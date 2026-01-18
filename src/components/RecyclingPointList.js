import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- CONSTANTES DE COLOR ---
const DARK_GREEN_ACCENT = '#2E7D32'; 
const LIGHT_GREEN_BG = '#E8F5E9'; 
const RED_ALERT = '#D32F2F';
const ORANGE_WARNING = '#FF9800';

// --- COLORES DE CONTENEDORES ---
const COLOR_PLASTIC_YELLOW = '#FFD700'; // Amarillo (Envases/Plástico)
const COLOR_GLASS_GREEN = '#66BB6A';   // Verde (Vidrio)
const COLOR_PAPER_BLUE = '#29B6F6';    // Azul (Papel/Cartón)
const COLOR_ORGANIC_BROWN = '#795548'; // Marrón (Orgánico)

/**
 * Asigna un estilo de texto basado en el estado del contenedor.
 * @param {string} status - Estado del contenedor.
 * @returns {object} Estilo de React Native.
 */
const getStatusStyle = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';

    if (normalizedStatus.includes('operativo') || normalizedStatus.includes('disponible') || normalizedStatus.includes('vacío')) {
        return styles.statusTextOperativo;
    }
    if (normalizedStatus.includes('lleno')) {
        return styles.statusTextLleno;
    }
    if (normalizedStatus.includes('averiado') || normalizedStatus.includes('mantenimiento')) {
        return styles.statusTextAveriado;
    }
    return styles.statusTextDefault;
};

/**
 * Asigna un color basado en el tipo de residuo.
 * @param {string} wasteType - Tipo de residuo.
 * @returns {string} Código de color hexadecimal.
 */
const getWasteTypeColor = (wasteType) => {
    const normalizedType = wasteType ? wasteType.toLowerCase() : '';

    if (normalizedType.includes('envases') || normalizedType.includes('envases')) {
        return COLOR_PLASTIC_YELLOW;
    }
    if (normalizedType.includes('vidrio')) {
        return COLOR_GLASS_GREEN;
    }
    if (normalizedType.includes('papel') || normalizedType.includes('cartón')) {
        return COLOR_PAPER_BLUE;
    }
    if (normalizedType.includes('orgánico') || normalizedType.includes('orgánica')) {
        return COLOR_ORGANIC_BROWN;
    }
    // Color por defecto para 'Punto Limpio' o 'Otros'
    return '#555'; 
};


/**
 * Componente que representa un único elemento en la lista.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.point - Objeto del punto de reciclaje.
 */
const RecyclingPointItem = ({ point }) => {
    
    const wasteColor = getWasteTypeColor(point.wasteType);

    // Función para abrir la ubicación en Google Maps
    const openInMaps = () => {
        // Asegúrate de que las coordenadas existan antes de intentar abrir el enlace
        if (point.latitude && point.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}&travelmode=driving`;
            Linking.openURL(url).catch(err => console.error('Error al abrir Maps:', err));
        } else {
            console.error('Coordenadas no disponibles para la navegación.');
        }
    };

    // Función para llamar al número de teléfono
    const callPhoneNumber = () => {
        const phone = point.telefono?.trim();
        if (phone && phone !== 'No especificado') {
            Linking.openURL(`tel:${phone}`).catch(err => console.error('Error al llamar:', err));
        } else {
            console.warn('Número de teléfono no disponible.');
        }
    };


    return (
        <View style={styles.itemContainer}>
            {/* Sección de Distancia y Título */}
            <View style={styles.headerRow}>
                <Text style={styles.distanceText}>{point.distanceText}</Text>
                <Text style={styles.nameText} numberOfLines={1}>{point.name}</Text>
            </View>

            {/* Dirección */}
            <Text style={styles.addressText}>{point.address || 'Dirección no disponible'}</Text>
            
            {/* Tipo de Residuo (AHORA CON COLOR DE CONTENEDOR) */}
            <View style={styles.wasteTypeRow}>
                <Ionicons 
                    name="cube" // Icono de cubo para representar el contenedor
                    size={18} 
                    color={wasteColor} 
                    style={{ marginRight: 8 }}
                />
                <Text style={styles.wasteLabel}>Residuo: </Text>
                <Text style={[styles.wasteTypeText, { color: wasteColor }]}>
                    {point.wasteType}
                </Text>
            </View>


            {/* Estado del Contenedor */}
            <View style={styles.statusRow}>
                <Ionicons 
                    name="trash-bin" 
                    size={16} 
                    color={getStatusStyle(point.description).color} 
                />
                <Text style={styles.statusLabel}>Estado: </Text>
                <Text style={getStatusStyle(point.description)}>
                    {point.description || 'N/A'}
                </Text>
            </View>
            
            {/* AÑADIDO: Horario */}
            <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>Horario: </Text>
                <Text style={styles.detailValue}>{point.horario || 'No especificado'}</Text>
            </View>

            {/* AÑADIDO: Teléfono (con botón de llamada si existe) */}
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>Teléfono: </Text>
                {point.telefono && point.telefono.trim() !== 'No especificado' ? (
                    <TouchableOpacity onPress={callPhoneNumber} style={styles.phoneButton}>
                        <Text style={styles.phoneButtonText}>{point.telefono}</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.detailValue}>No especificado</Text>
                )}
            </View>


            {/* Botón para Navegación */}
            <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
                <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>Cómo llegar</Text>
            </TouchableOpacity>
        </View>
    );
};

/**
 * Componente principal de la Lista de Puntos de Reciclaje.
 * @param {object} props - Propiedades del componente.
 * @param {Array<object>} props.recyclingPoints - Lista de puntos de reciclaje (desde App.js).
 */
export default function RecyclingPointList({ recyclingPoints }) {
    
    // Si la lista está vacía, mostramos un mensaje
    if (!recyclingPoints || recyclingPoints.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={DARK_GREEN_ACCENT} />
                <Text style={styles.emptyTextTitle}>No hay puntos de reciclaje cercanos</Text>
                <Text style={styles.emptyTextSubtitle}>
                    Asegúrate de haber seleccionado un tipo de residuo en la pestaña "Inicio" y de tener activa la ubicación.
                </Text>
            </View>
        );
    }
    
    // Agregamos un encabezado a la lista para dar contexto
    const ListHeader = () => (
        <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Puntos Cercanos Encontrados</Text>
            <Text style={styles.listHeaderSubtitle}>Resultados ordenados por distancia.</Text>
        </View>
    );

    // Renderiza la lista de puntos
    return (
        <View style={styles.listContainer}>
            <FlatList
                data={recyclingPoints}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <RecyclingPointItem point={item} />}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.contentContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        backgroundColor: LIGHT_GREEN_BG,
    },
    contentContainer: {
        padding: 10,
    },
    listHeader: {
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#CFD8DC',
    },
    listHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: DARK_GREEN_ACCENT,
    },
    listHeaderSubtitle: {
        fontSize: 14,
        color: '#607D8B',
        marginTop: 4,
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    separator: {
        height: 10, // Espacio entre elementos de la lista
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    distanceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: DARK_GREEN_ACCENT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: LIGHT_GREEN_BG,
        borderRadius: 8,
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flexShrink: 1,
        textAlign: 'right',
        marginLeft: 10,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    // Estilos antiguos eliminados (typeText), ahora se usa wasteTypeRow/wasteTypeText
    wasteTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    wasteLabel: {
        fontSize: 14,
        color: DARK_GREEN_ACCENT,
        fontWeight: '500',
    },
    wasteTypeText: {
        fontSize: 14,
        fontWeight: 'bold', // Hacemos el texto del tipo de residuo más visible
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    statusLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    statusTextOperativo: {
        fontSize: 14,
        fontWeight: 'bold',
        color: DARK_GREEN_ACCENT,
    },
    statusTextLleno: {
        fontSize: 14,
        fontWeight: 'bold',
        color: RED_ALERT,
    },
    statusTextAveriado: {
        fontSize: 14,
        fontWeight: 'bold',
        color: ORANGE_WARNING,
    },
    statusTextDefault: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
    },
    // Nuevos estilos para los detalles de Horario/Teléfono
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailIcon: {
        marginRight: 8,
        width: 20, // Asegura alineación
        textAlign: 'center',
    },
    detailText: {
        fontSize: 14,
        color: '#455A64',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#455A64',
    },
    phoneButton: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 5,
        backgroundColor: LIGHT_GREEN_BG,
    },
    phoneButtonText: {
        color: DARK_GREEN_ACCENT,
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Fin Nuevos estilos
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DARK_GREEN_ACCENT,
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
        shadowColor: DARK_GREEN_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    mapButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: LIGHT_GREEN_BG,
    },
    emptyTextTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: DARK_GREEN_ACCENT,
        marginTop: 15,
        textAlign: 'center',
    },
    emptyTextSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
    }
});