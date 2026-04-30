import { supabase } from '../utils/supabaseClient'; 

/**

 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña.
 * @throws {Error} - Lanza el mensaje de error de Supabase.
 */
export const iniciarSesion = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        throw new Error(error.message); 
    }
   
};

/**
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña.
 * @returns {{ confirmacionPendiente: boolean }}
 * @throws {Error} - Lanza el mensaje de error de Supabase.
 */
export const registrarUsuario = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        throw new Error(error.message); 
    }


    if (data.user && !data.session) {
        return { confirmacionPendiente: true };
    }


    return { confirmacionPendiente: false };
};