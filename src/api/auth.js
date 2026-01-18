import { supabase } from '../utils/supabaseClient'; 

/**
 * Función para iniciar sesión con email y contraseña.
 * Lanza un error si falla, el cual debe ser capturado por el componente que la llama.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña.
 * @throws {Error} - Lanza el mensaje de error de Supabase.
 */
export const iniciarSesion = async (email, password) => {
    
    // La función 'iniciarSesion' es la que faltaba.
    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        // Lanzamos el error para que el componente (AuthScreen.js) lo muestre en la alerta.
        throw new Error(error.message); 
    }
    // Si no hay error, Supabase maneja el estado de la sesión.
};

/**
 * Función para registrar un nuevo usuario.
 * Lanza un error si falla.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña.
 * @throws {Error} - Lanza el mensaje de error de Supabase.
 */
export const registrarUsuario = async (email, password) => {
    
    // La función 'registrarUsuario' es la versión corregida de 'signUpWithEmail'.
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        // Lanzamos el error para que el componente llamador lo maneje.
        throw new Error(error.message); 
    }

    // Si el registro es exitoso pero se requiere confirmación por email, podemos devolver un mensaje.
    if (data.user && !data.session) {
        throw new Error("Registro exitoso. Revisa tu correo electrónico para el enlace de confirmación.");
    }
};