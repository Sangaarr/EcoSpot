import React, { useState, useEffect, useCallback } from 'react'; 
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// Importamos las librerías de navegación instaladas
import { NavigationContainer } from '@react-navigation/native'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 

import { supabase } from './src/utils/supabaseClient';

// --- Importación de Componentes (Asegúrate de que existan) ---
import AuthScreen from './src/components/AuthScreen.js'; 
import WasteSelector from './src/components/WasteSelector.js'; // Pantalla de Residuos
import SearchMap from './src/components/SearchMap.js';   // Pantalla de Mapa
import RecyclingPointList from './src/components/RecyclingPointList.js'; // Pantalla de Lista
// ----------------------------------

// --- CONSTANTES DE COLOR ---
const GREEN = '#4CAF50'; // Color primario (StatusBar, carga inicial)
const WHITE = '#FFFFFF';
const LIGHT_GREEN_BG = '#E8F5E9'; // Color pastel SOLICITADO para la barra inferior
const DARK_GREEN_ACCENT = '#2E7D32'; // Verde oscuro para iconos activos
// -----------------------------

const Tab = createBottomTabNavigator();

// --- PANTALLAS CONTENEDORAS PARA LAS PESTAÑAS ---

// 1. Contenedor para la pantalla de Residuos (Home)
const HomeScreen = ({ setActiveWasteFilter }) => {
    // Nota: WasteSelector debe manejar internamente la navegación o recibirla como prop si la necesita
    return <WasteSelector setActiveWasteFilter={setActiveWasteFilter} />;
};

// 2. Contenedor para la pantalla de Mapa
const MapScreen = ({ activeWasteFilter, setRecyclingPoints }) => {
    return (
        <SearchMap 
            // Prop renombrada para indicar que DEBE reaccionar a los cambios en este valor
            currentWasteFilter={activeWasteFilter} 
            setRecyclingPoints={setRecyclingPoints} // Envía la función para actualizar el estado central
        />
    );
};

// 3. Contenedor para la pantalla de Lista
const ListScreen = ({ activeWasteFilter, recyclingPoints }) => {
    return (
        <RecyclingPointList 
            activeWasteFilter={activeWasteFilter} 
            recyclingPoints={recyclingPoints} // Pasa la lista de puntos
        />
    );
};

// 4. Pantalla de Cierre de Sesión
const LogoutScreen = ({ onLogout }) => { 
    // Ejecutar el cierre de sesión inmediatamente al entrar en esta pestaña
    useEffect(() => {
        if (onLogout) {
            onLogout();
        } else {
            console.warn("La función de logout no se pasó correctamente. Intentando cierre directo."); 
            supabase.auth.signOut(); 
        }
    }, [onLogout]);

    return (
        <View style={styles.logoutContainer}>
            <ActivityIndicator size="large" color={DARK_GREEN_ACCENT} />
            <Text style={styles.logoutText}>Cerrando sesión...</Text>
        </View>
    );
};

// --- COMPONENTE APP PRINCIPAL ---
export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ESTADOS ELEVADOS: Compartidos entre Mapa y Lista
    const [activeWasteFilter, setActiveWasteFilter] = useState('Papel y Cartón'); 
    const [recyclingPoints, setRecyclingPoints] = useState([]); // El array que contiene los puntos

    // Función para manejar el cierre de sesión, para pasarla como prop
    const handleLogoutApp = useCallback(async () => {
        setLoading(true);
        // Supabase sign out
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
    }, []);

    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        // Comprobación inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        return () => {
            if (listener && listener.subscription) {
                listener.subscription.unsubscribe();
            }
        };
    }, []);

    const renderTabNavigator = () => (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                // Solución al problema de los títulos en la parte superior:
                headerShown: false, 
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    const c = focused ? DARK_GREEN_ACCENT : color;

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Mapa') {
                        iconName = focused ? 'location-sharp' : 'location-outline';
                    } else if (route.name === 'Lista') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Salir') {
                        iconName = focused ? 'log-out' : 'log-out-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={c} />;
                },
                tabBarActiveTintColor: DARK_GREEN_ACCENT,
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { 
                    backgroundColor: LIGHT_GREEN_BG, 
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 5,
                }
            })}
        >
            <Tab.Screen 
                name="Inicio" 
                options={{ title: 'Residuos' }} 
            >
                {props => <HomeScreen {...props} setActiveWasteFilter={setActiveWasteFilter} />}
            </Tab.Screen>

            <Tab.Screen 
                name="Mapa" 
                options={{ title: 'Puntos de Reciclaje' }} 
            >
                {props => (
                    <MapScreen 
                        {...props} 
                        activeWasteFilter={activeWasteFilter} 
                        setRecyclingPoints={setRecyclingPoints} 
                    />
                )}
            </Tab.Screen>

            {/* Solución al problema de los puntos no visibles: se pasa el estado compartido */}
            <Tab.Screen 
                name="Lista" 
                options={{ title: 'Ver Lista' }} 
            >
                {props => (
                    <ListScreen 
                        {...props} 
                        activeWasteFilter={activeWasteFilter} 
                        recyclingPoints={recyclingPoints} // <-- ESTADO CLAVE
                    />
                )}
            </Tab.Screen>
            
            <Tab.Screen 
                name="Salir" 
                options={{ title: 'Cerrar Sesión', headerShown: false }} 
            >
                {props => <LogoutScreen {...props} onLogout={handleLogoutApp} />}
            </Tab.Screen>
        </Tab.Navigator>
    );

    if (loading) {
        return (
            <SafeAreaProvider>
                <StatusBar barStyle="light-content" backgroundColor={GREEN} />
                <View style={styles.fullScreenGreen}>
                    <ActivityIndicator size="large" color={WHITE} />
                    <Text style={{ color: WHITE, marginTop: 10 }}>Cargando aplicación...</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
                <StatusBar barStyle="light-content" backgroundColor={GREEN} />
                {!session ? (
                    <AuthScreen />
                ) : (
                    <NavigationContainer independent={true}>
                        {renderTabNavigator()}
                    </NavigationContainer>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    fullScreenGreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: GREEN, 
    },
    logoutContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: LIGHT_GREEN_BG,
    },
    logoutText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DARK_GREEN_ACCENT,
    }
});