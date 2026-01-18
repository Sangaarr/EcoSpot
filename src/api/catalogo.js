import { supabase } from '../utils/supabaseClient.js';

// NOTA: Estas funciones usan la capa de 'select' (lectura directa) de Supabase, 
// no funciones RPC, porque solo consultan datos sencillos.

/**
 * Obtiene el ID_Residuo (INTEGER) a partir del nombre del residuo (VARCHAR).
 * @param {string} nombreResiduo - Nombre del residuo (ej: 'Plástico').
 * @returns {Promise<number>} - El ID_Residuo correspondiente.
 */
export async function obtenerIdResiduo(nombreResiduo) {
    const { data, error } = await supabase
        .from('TipoResiduo')
        .select('ID_Residuo')
        .eq('Nombre_Residuo', nombreResiduo)
        .single(); // Esperamos solo un resultado

    if (error) {
        console.error('Error al obtener ID de Residuo:', error.message);
        throw new Error(`Residuo '${nombreResiduo}' no encontrado.`);
    }

    return data.ID_Residuo;
}

/**
 * Obtiene el ID_Usuario (INTEGER) a partir del UUID de autenticación de Supabase.
 * Este UUID se obtiene del usuario actualmente logueado.
 * @param {string} authUuid - El UUID de autenticación del usuario.
 * @returns {Promise<number>} - El ID_Usuario INTEGER correspondiente de la tabla 'Usuario'.
 */
export async function obtenerIdUsuario(authUuid) {
    const { data, error } = await supabase
        .from('Usuario')
        .select('ID_Usuario')
        .eq('auth_uuid', authUuid)
        .single(); // Esperamos solo un resultado

    if (error) {
        console.error('Error al obtener ID de Usuario:', error.message);
        throw new Error('ID de Usuario no encontrado. ¿El trigger de sincronización falló?');
    }

    return data.ID_Usuario;
}