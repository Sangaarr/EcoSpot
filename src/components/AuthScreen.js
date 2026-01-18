import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
// La importación está confirmada como correcta, pero si el problema persiste,
// el error debe estar en el archivo ../api/auth.js (que no has mostrado)
import { iniciarSesion, registrarUsuario } from '../api/auth'; 

const CustomAlert = ({ message, type, onClose }) => {
    if (!message) return null;

    const backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
    const color = type === 'error' ? '#721c24' : '#155724';
    const borderColor = type === 'error' ? '#f5c6cb' : '#c3e6cb';

    return (
        <View style={[styles.customAlert, { backgroundColor, borderColor }]}>
            <Text style={[styles.alertText, { color }]}>{message}</Text>
            <TouchableOpacity onPress={onClose} style={styles.alertCloseButton}>
                <Text style={{ color: color, fontWeight: 'bold' }}>X</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ message: '', type: '' });

    const showAlert = (message, type) => {
        setAlert({ message, type });
    };

    async function handleSignIn() {
        if (!email || !password) {
            showAlert('Por favor, introduce email y contraseña.', 'error');
            return;
        }

        setLoading(true);
        try {
            // USO CORRECTO: iniciarSesion
            await iniciarSesion(email, password);
        } catch (error) {
            showAlert(`Fallo al Iniciar Sesión: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleSignUp() {
        if (!email || !password) {
            showAlert('Por favor, introduce email y contraseña.', 'error');
            return;
        }

        setLoading(true);
        try {
            await registrarUsuario(email, password);
            showAlert('¡Revisa tu correo electrónico para confirmar tu cuenta!', 'success');
        } catch (error) {
            showAlert(`Fallo en el Registro: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <CustomAlert 
                message={alert.message} 
                type={alert.type} 
                onClose={() => setAlert({ message: '', type: '' })}
            />
            <View style={styles.header}>
                <Text style={styles.logoIcon}>♻️</Text> 
                <Text style={styles.logo}>EcoSpot</Text>
                <Text style={styles.subtitle}>Tu guía para el reciclaje inteligente.</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Acceso de Usuario</Text>
                <View style={styles.verticallySpaced}>
                    <TextInput
                        style={styles.input}
                        onChangeText={setEmail}
                        value={email}
                        placeholder="Correo Electrónico"
                        autoCapitalize={'none'}
                        keyboardType="email-address"
                        editable={!loading}
                    />
                </View>
                <View style={styles.verticallySpaced}>
                    <TextInput
                        style={styles.input}
                        onChangeText={setPassword}
                        value={password}
                        secureTextEntry={true}
                        placeholder="Contraseña"
                        autoCapitalize={'none'}
                        editable={!loading}
                    />
                </View>
                <View style={[styles.buttonGroup, styles.verticallySpaced]}>
                    <TouchableOpacity
                        style={[styles.buttonBase, styles.buttonPrimary, styles.button3D]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                             <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.buttonBase, styles.buttonSecondary, styles.button3D]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        <Text style={styles.buttonTextSecondary}>Registrarse</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // FONDO VERDE GARANTIZADO si el componente se renderiza.
        backgroundColor: '#4CAF50', 
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        fontSize: 100,
        marginBottom: 10,
        textShadowColor: 'rgba(255, 255, 255, 0.8)', 
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    logo: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF', 
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#DCEDC8', 
        marginTop: 5,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 15, 
    },
    cardTitle: {
        fontSize: 24, 
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 25,
        textAlign: 'center',
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    input: {
        height: 55, 
        borderColor: '#CCCCCC',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: '#FAFAFA',
        fontSize: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
    },
    buttonBase: {
        flex: 1,
        padding: 12,
        borderRadius: 10, 
        alignItems: 'center',
        justifyContent: 'center',
        height: 55, 
    },
    button3D: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3,
        shadowRadius: 0, 
        elevation: 5,
        marginBottom: 5, 
        borderBottomWidth: 5, 
    },
    buttonPrimary: {
        backgroundColor: '#66BB6A', 
        marginRight: 10,
        borderBottomColor: '#2E7D32', 
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18, 
    },
    buttonSecondary: {
        backgroundColor: '#9CCC65', 
        marginLeft: 10,
        borderBottomColor: '#4CAF50', 
    },
    buttonTextSecondary: {
        color: '#333333',
        fontWeight: 'bold',
        fontSize: 18, 
    },
    customAlert: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    alertText: {
        flexShrink: 1,
        marginRight: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    alertCloseButton: {
        paddingHorizontal: 5,
    }
});