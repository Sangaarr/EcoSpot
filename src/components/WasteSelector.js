import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList,
    TouchableOpacity, 
    ActivityIndicator, 
    Dimensions 
} from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- CONSTANTES ---
const WASTE_ICONS = {
    'Envases': '🥤', 
    'Vidrio': '🍾', 
    'Papel y Cartón': '📦', 
    'Orgánico': '🍎', 
    'Pilas y Baterías': '🔋', 
    'Aceite usado': '🍳', 
    'Residuos voluminosos y/o Tecnológicos': '🖥️', 
};

// --- COLORES DE CONTENEDORES OFICIALES (Actualizados) ---
const COLOR_PLASTIC_YELLOW = '#FFD700'; // Amarillo (Envases/Plástico)
const COLOR_GLASS_GREEN = '#66BB6A';   // Verde (Vidrio)
const COLOR_PAPER_BLUE = '#29B6F6';    // Azul (Papel/Cartón)
const COLOR_ORGANIC_BROWN = '#795548'; // Marrón (Orgánico)

const WASTE_COLORS = {
    // Colores actualizados para coincidir con los contenedores
    'Envases': COLOR_PLASTIC_YELLOW, 
    'Vidrio': COLOR_GLASS_GREEN, 
    'Papel y Cartón': COLOR_PAPER_BLUE, 
    'Orgánico': COLOR_ORGANIC_BROWN, 
    
    // Colores anteriores para otros tipos
    'Aceite usado': '#CCCCCC', 
    'Pilas y Baterías': '#FFB69B', 
    'Residuos voluminosos y/o Tecnológicos': '#FFFFFF', 
    'DEFAULT': '#C8E6C9', 
};

const CUSTOM_WASTE_ORDER = [
    'Envases',
    'Vidrio',
    'Papel y Cartón',
    'Orgánico',
    'Aceite usado',
    'Pilas y Baterías',
    'Residuos voluminosos y/o Tecnológicos',
];

const GRID_PADDING = 20;
const CARD_SPACING = 15;
const CARD_WIDTH = (width - (GRID_PADDING * 2) - CARD_SPACING) / 2;

// CAMBIO CRÍTICO AQUI: Ahora recibe la prop con el nombre que App.js le asignó
export default function WasteSelector({ setActiveWasteFilter }) { 
    
    const navigation = useNavigation();
    const [wasteTypes, setWasteTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- LÓGICA CORREGIDA PARA ACTUALIZAR ESTADO CENTRAL Y NAVEGAR ---
    const handlePress = (wasteName) => {
        // 1. **ACTUALIZAR EL FILTRO CENTRAL EN App.js**
        // Llama a la función setter pasada como prop para cambiar el filtro.
        if (setActiveWasteFilter) {
            setActiveWasteFilter(wasteName);
            console.log(`Filtro seleccionado: ${wasteName}. Actualizando estado central.`);
        } 
        
        // 2. **NAVEGAR A LA PESTAÑA DEL MAPA**
        // Es crucial navegar a 'Mapa'. Ya no pasamos parámetros de navegación porque usamos el estado central.
        navigation.navigate('Mapa');
    };
    // ----------------------------------------
    
    useEffect(() => {
        const fetchWasteTypes = async () => {
            setLoading(true);
            setError(null);
            try {
                // Usamos el orden predefinido para simular o filtrar
                const sortedNames = CUSTOM_WASTE_ORDER; 
                
                setWasteTypes(sortedNames);
            } catch (e) {
                console.error('Error:', e);
                setError('Error al cargar residuos');
            } finally {
                setLoading(false);
            }
        };

        fetchWasteTypes();
    }, []); 

    const renderWasteCard = ({ item: wasteName }) => {
        const bgColor = WASTE_COLORS[wasteName] || WASTE_COLORS.DEFAULT;
        
        // Determinamos el color del texto. Si el fondo es oscuro (Marrón Orgánico), usamos texto blanco.
        const isDark = wasteName === 'Orgánico';
        const textColor = isDark ? '#FFFFFF' : '#333333';

        return (
            <TouchableOpacity 
                key={wasteName}
                style={[styles.card, { backgroundColor: bgColor }]}
                onPress={() => handlePress(wasteName)}
                activeOpacity={0.8}
            >
                <Text style={[styles.cardEmoji, { color: textColor }]}>
                    {WASTE_ICONS[wasteName] || '♻️'}
                </Text>
                <Text style={[styles.cardName, { color: textColor }]}>
                    {wasteName}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2E7D32" /> 
                <Text style={styles.loadingText}>Cargando residuos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>¿Qué vas a reciclar hoy?</Text>
                <Text style={styles.subtitle}>
                    Selecciona una categoría para ver los puntos cercanos.
                </Text>
            </View>
            
            <FlatList
                data={wasteTypes}
                renderItem={renderWasteCard}
                keyExtractor={item => item}
                numColumns={2}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E7F9E7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E7F9E7' },
    header: { paddingHorizontal: GRID_PADDING, paddingTop: 20, paddingBottom: 20 },
    title: { fontSize: 26, fontWeight: '900', color: '#333333', marginBottom: 5 },
    subtitle: { fontSize: 15, color: '#666666' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#2E7D32' },
    gridContent: { paddingHorizontal: GRID_PADDING, paddingBottom: 20 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: CARD_SPACING },
    card: {
        width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 20,
        alignItems: 'flex-start', justifyContent: 'space-between', padding: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, 
        shadowRadius: 4, elevation: 3,
    },
    cardEmoji: { fontSize: 45 },
    cardName: { fontSize: 15, fontWeight: '700', color: '#333' }
});