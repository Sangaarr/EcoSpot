import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
// CORRECCIÓN CLAVE: La ruta debe ser '../utils/supabaseClient' para salir de 'components' y entrar en 'utils'
import { supabase } from '../utils/supabaseClient'; 

// Dimensiones y Constantes
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const DEFAULT_REGION = {
    latitude: 40.416775, 
    longitude: -3.703790, // Centro de Madrid (por defecto si falla la ubicación)
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
};
const DARK_GREEN_ACCENT = '#2E7D32'; 
const RED_ALERT = '#D32F2F';

/**
 * Calcula la distancia entre dos puntos geográficos (fórmula de Haversine).
 * @param {number} lat1 - Latitud del punto 1.
 * @param {number} lon1 - Longitud del punto 1.
 * @param {number} lat2 - Latitud del punto 2.
 * @param {number} lon2 - Longitud del punto 2.
 * @returns {number} Distancia en kilómetros.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

/**
 * Asigna un color al pin del marcador basado en el estado del contenedor.
 * @param {string} status - Estado del contenedor (e.g., 'Operativo', 'Lleno', 'Averiado')
 * @returns {string} El color del pin.
 */
const getPinColor = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';

    if (normalizedStatus.includes('operativo') || normalizedStatus.includes('disponible') || normalizedStatus.includes('vacío')) {
        return 'green'; 
    }
    if (normalizedStatus.includes('lleno')) {
        return 'red'; 
    }
    if (normalizedStatus.includes('averiado') || normalizedStatus.includes('mantenimiento')) {
        return 'orange'; 
    }
    return 'blue'; 
};

// --- COMPONENTE PRINCIPAL ---
export default function SearchMap({ currentWasteFilter, setRecyclingPoints }) {
    
    const [mapRegion, setMapRegion] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recyclingPointsLocal, setRecyclingPointsLocal] = useState([]); // Para el mapa (marcadores)
    const [supabaseError, setSupabaseError] = useState(null); 

    // 1. Obtener Localización (Al montar)
    useEffect(() => {
        const fetchLocation = async () => {
            setLoading(true);
            setSupabaseError(null); 
            
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permiso de ubicación denegado. Mostrando ubicación por defecto (Madrid).');
                setMapRegion(DEFAULT_REGION);
                setLoading(false);
                return;
            }
            try {
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                setMapRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                });
            } catch (error) {
                setLocationError('Error al obtener la ubicación. Usando ubicación por defecto (Madrid).');
                setMapRegion(DEFAULT_REGION);
            } finally {
                // Dejamos que el segundo useEffect desactive el loading después de la búsqueda de datos
            }
        };
        fetchLocation();
    }, []);

    // 2. Función de Búsqueda en Supabase (Usa useCallback para memorizarla)
    const fetchRecyclingPoints = useCallback(async (wasteType) => {
        // Ejecutar búsqueda solo si tenemos un tipo de residuo y una región de mapa
        if (!wasteType || !mapRegion) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setSupabaseError(null);
        console.log(`🔍 Buscando puntos para: ${wasteType}`);
        
        try {
            // A) Obtener ID del residuo basándose en el nombre (e.g., 'Papel y Cartón')
            const { data: tipoData, error: tipoError } = await supabase
                .from('tiporesiduo')
                .select('id_residuo')
                .eq('nombre_residuo', wasteType)
                .single();

            if (tipoError && tipoError.code !== 'PGRST116') throw tipoError; // PGRST116 = No Rows Found

            if (!tipoData) {
                console.log('Tipo de residuo no encontrado en BD o no existen puntos asociados.');
                setRecyclingPoints([]); // Notifica al padre
                setRecyclingPointsLocal([]); // Actualiza el mapa
                setLoading(false);
                return;
            }

            // B) Obtener todos los puntos (puntoreciclaje) que manejan ese residuo (punto_residuo)
            const { data: pointsData, error: pointsError } = await supabase
                .from('punto_residuo')
                .select(`
                    id_punto,
                    estado_contenedor, 
                    puntoreciclaje!inner(
                        id_punto, nombre, latitud, longitud, direccion, activa, horario, telefono
                    )
                `)
                .eq('id_residuo', tipoData.id_residuo)
                .eq('puntoreciclaje.activa', true);

            if (pointsError) throw pointsError;

            // C) Procesar, calcular distancia, limpiar datos y convertir a float
            let cleanData = pointsData.map(item => {
                const p = item.puntoreciclaje;
                
                // 1. Conversión estricta a Número
                let pointLatitude = parseFloat(p.latitud); 
                let pointLongitude = parseFloat(p.longitud); 
                
                // 2. FILTRO Y CORRECCIÓN DE DATOS (Corrección de Punto Decimal Desplazado)
                // Esto soluciona el problema de 4.04 en lugar de 40.40 para coordenadas en España.
                if (pointLatitude > 1 && pointLatitude < 10 && Math.abs(pointLongitude) > 0) {
                    console.warn(`[CORRECCIÓN DECIMAL APLICADA] Latitud ${pointLatitude.toFixed(2)} multiplicada por 10. Nuevo valor: ${(pointLatitude * 10).toFixed(2)}.`);
                    pointLatitude = pointLatitude * 10;
                }
                
                // 3. Filtro de seguridad (nulos, cero, o NaN después de la conversión)
                if (isNaN(pointLatitude) || isNaN(pointLongitude) || pointLatitude === 0 || pointLongitude === 0 || !pointLatitude || !pointLongitude) {
                    return null; 
                }

                // 4. Filtro de seguridad para coordenadas totalmente fuera de rango geográfico
                if (Math.abs(pointLatitude) > 90 || Math.abs(pointLongitude) > 180) {
                    console.warn(`Punto ${p.id_punto} saltado: Coordenadas fuera de rango. Lat: ${pointLatitude}, Lon: ${pointLongitude}`);
                    return null;
                }
                
                // 5. Calcula la distancia
                const dist = calculateDistance(mapRegion.latitude, mapRegion.longitude, pointLatitude, pointLongitude);

                // --- DEBUG LOG (Mantenido para el caso de error de inversión) ---
                if (dist > 50) { 
                    console.log(`[DEBUG - Distancia Grande] ID: ${p.id_punto}, User Lat/Lon: ${mapRegion.latitude.toFixed(2)}, ${mapRegion.longitude.toFixed(2)}, Point Lat/Lon: ${pointLatitude.toFixed(2)}, ${pointLongitude.toFixed(2)}, Distancia: ${dist.toFixed(0)} km`);
                }
                // ----------------------------------------------------
                
                return {
                    id: item.id_punto,
                    name: p.nombre,
                    // Usamos las coordenadas corregidas
                    latitude: pointLatitude, 
                    longitude: pointLongitude, 
                    description: item.estado_contenedor, // Usado para el estado del contenedor
                    distance: dist,
                    distanceText: `${dist.toFixed(1)} km`, 
                    address: p.direccion, 
                    wasteType: wasteType, 
                    horario: p.horario || 'No especificado', 
                    telefono: p.telefono || 'No especificado', 
                };
            }).filter(Boolean); // Eliminar entradas nulas

            // Ordenar por cercanía antes de pasarlos a los estados
            cleanData.sort((a, b) => a.distance - b.distance);
            
            // ACTUALIZACIÓN CLAVE: Envía la lista de puntos procesados al componente padre (App.js)
            setRecyclingPoints(cleanData); 

            // Actualiza el estado local para mostrar los marcadores en el mapa
            setRecyclingPointsLocal(cleanData);

        } catch (e) {
            console.error('Error buscando puntos:', e.message);
            setSupabaseError(`Error al cargar datos: ${e.message}`);
            setRecyclingPoints([]);
            setRecyclingPointsLocal([]);
        } finally {
            setLoading(false);
        }
    }, [mapRegion, setRecyclingPoints]);

    // 3. LISTENER CLAVE: Reaccionar cuando cambia el filtro (currentWasteFilter) o la ubicación (mapRegion)
    useEffect(() => {
        // Ejecutar búsqueda si tenemos un filtro activo y la región del mapa ha sido establecida
        if (currentWasteFilter && mapRegion) {
            fetchRecyclingPoints(currentWasteFilter);
        } else if (!currentWasteFilter) {
            // Si no hay filtro, limpiar puntos
            setRecyclingPoints([]);
            setRecyclingPointsLocal([]);
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWasteFilter, mapRegion, fetchRecyclingPoints]); 

    // --- RENDER ---

    // Pantalla de carga inicial de ubicación
    if (!mapRegion && loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={DARK_GREEN_ACCENT} />
                <Text style={{marginTop:10}}>Obteniendo ubicación...</Text>
            </View>
        );
    }
    
    const showMap = mapRegion?.latitude && mapRegion?.longitude;

    return (
        <View style={styles.container}>
            {/* Cabecera informativa flotante */}
            <View style={styles.infoBar}>
                <Text style={styles.infoTitle}>
                    {/* Usamos directamente la prop para mostrar el filtro */}
                    {currentWasteFilter ? `Puntos de Reciclaje de ${currentWasteFilter}` : 'Selecciona un residuo en Inicio'}
                </Text>
                {currentWasteFilter && (
                    <Text style={styles.infoSubtitle}>
                        {recyclingPointsLocal.length} puntos encontrados cerca de ti.
                    </Text>
                )}
                {locationError && (
                    <Text style={[styles.infoSubtitle, styles.errorText]}>{locationError}</Text>
                )}
            </View>
            
            {/* Mapa o Mensaje de Error de Mapa */}
            {showMap ? (
                <MapView
                    style={styles.map}
                    region={mapRegion}
                    showsUserLocation={true}
                    // onRegionChangeComplete: Actualiza la región del mapa cuando el usuario lo mueve (opcional)
                    onRegionChangeComplete={setMapRegion} 
                >
                    {recyclingPointsLocal.map((point, index) => (
                        <Marker
                            key={`${point.id}-${index}`}
                            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                            title={point.name}
                            // DESCRIPCIÓN ACTUALIZADA: Incluye todos los datos solicitados (Dirección, Residuo, Estado, Horario, Teléfono)
                            description={
                                `Distancia: ${point.distance.toFixed(1)} km\n` +
                                `Dirección: ${point.address}\n` +
                                `Residuo: ${point.wasteType}\n` +
                                `Estado: ${point.description || 'N/A'}\n` +
                                `Horario: ${point.horario || 'N/A'}\n` +
                                `Teléfono: ${point.telefono || 'N/A'}`
                            }
                            pinColor={getPinColor(point.description)} 
                        />
                    ))}
                </MapView>
            ) : (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No se pudo cargar el mapa. Verifica tu conexión o permisos de ubicación.</Text>
                </View>
            )}

            {/* Overlay de Carga (para búsquedas) o Error de BD */}
            {(loading || supabaseError) && (
                <View style={styles.loadingOverlay}>
                    {loading ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={{color:'#fff', marginLeft: 10}}>Buscando puntos cercanos...</Text>
                        </>
                    ) : (
                        <Text style={{color: '#fff', fontWeight: 'bold'}}>{supabaseError}</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoBar: {
        position: 'absolute',
        top: 10, left: 10, right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 15,
        borderRadius: 10,
        elevation: 5,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    infoTitle: { fontSize: 16, fontWeight: 'bold', color: DARK_GREEN_ACCENT, textAlign: 'center' },
    infoSubtitle: { fontSize: 12, color: '#555', textAlign: 'center', marginTop: 2 },
    errorText: { color: RED_ALERT, fontWeight: 'bold', fontSize: 13, marginTop: 5 },
    loadingOverlay: {
        position: 'absolute',
        bottom: 30, 
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', 
        paddingVertical: 12, 
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: 'row', 
        alignItems: 'center', 
        zIndex: 20, 
        minHeight: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    }
});