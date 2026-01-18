// puntos.js

import { supabase } from '../utils/supabaseClient.js'; // Importa el cliente de conexión

// =================================================================
// 1. FUNCIÓN PARA OBTENER PUNTOS CERCANOS (LECTURA)
// =================================================================

/**
 * Llama a la función RPC en PostgreSQL para buscar puntos de reciclaje cercanos
 * que acepten el tipo de residuo especificado, calcula la distancia y devuelve
 * los resultados.
 * @param {number} latitud Latitud actual del usuario.
 * @param {number} longitud Longitud actual del usuario.
 * @param {string} residuoNombre Nombre del residuo a buscar (ej: 'Plástico').
 * @returns {Array<Object>} Lista de puntos de reciclaje cercanos.
 */
export async function obtenerPuntosCercanos(latitud, longitud, residuoNombre) {
    
    // Llamada a la función RPC de PostgreSQL.
    const { data, error } = await supabase.rpc('fn_obtener_puntos_cercanos', {
        p_latitud_usuario: latitud,
        p_longitud_usuario: longitud,
        p_nombre_residuo: residuoNombre,
    });

    if (error) {
        console.error('Error al buscar puntos (fn_obtener_puntos_cercanos):', error.message);
        throw new Error('No se pudo completar la búsqueda de puntos.');
    }
    
    // El RPC devuelve JSONB. Esta lógica robusta asegura que 'data' se maneje como un array de resultados.
    let resultadosParseados = [];
    try {
        if (data) {
             resultadosParseados = Array.isArray(data) ? data : (data.fn_obtener_puntos_cercanos || []);
        }
    } catch (e) {
        console.error("Error al procesar la respuesta JSON del RPC:", e);
        throw new Error("Formato de datos no válido desde el servidor.");
    }
    
    return resultadosParseados;
}


// =================================================================
// 2. FUNCIÓN PARA REGISTRAR LA CONSULTA (ESCRITURA)
// =================================================================

/**
 * Registra la consulta del usuario en las tablas 'consulta' y
 * 'consulta_puntoreciclaje' para análisis de datos.
 * @param {number} latitudUsuario Latitud del usuario en el momento de la consulta.
 * @param {number} longitudUsuario Longitud del usuario en el momento de la consulta.
 * @param {number} residuoId ID del residuo buscado (debe obtenerse antes de llamar a esta función).
 * @param {Array<Object>} puntosEncontrados Array de puntos devueltos por obtenerPuntosCercanos.
 * @param {string | null} [usuarioId=null] ID del usuario si está autenticado (opcional).
 */
export async function registrarConsulta(
    latitudUsuario, 
    longitudUsuario, 
    residuoId, 
    puntosEncontrados, 
    usuarioId = null
) {
    
    // Objeto base de la inserción en la tabla 'consulta'
    const consultaBase = {
        latitud_consulta: latitudUsuario,
        longitud_consulta: longitudUsuario,
        id_residuo: residuoId,
        // PostgreSQL debería asignar automáticamente la fecha_hora si no se proporciona, 
        // pero podemos incluirla si es necesario: fecha_hora: new Date().toISOString(),
    };

    // Si estás usando la columna id_usuario, descomenta y ajusta esta línea:
    // if (usuarioId) {
    //     consultaBase.id_usuario = usuarioId;
    // }

    // 1. Insertar la consulta principal en la tabla 'consulta'
    const { data: consultaData, error: consultaError } = await supabase
        .from('consulta')
        .insert([consultaBase])
        .select('id_consulta') // Recuperar el ID de la consulta recién creada
        .single(); 

    if (consultaError) {
        console.error('Error al registrar la consulta principal:', consultaError);
        return;
    }

    const idConsulta = consultaData.id_consulta;
    
    // 2. Preparar los datos para la tabla 'consulta_puntoreciclaje'
    const datosConsultaPuntos = puntosEncontrados.map((punto, index) => ({
        id_consulta: idConsulta,
        id_punto: punto.punto_id, 
        distancia: punto.distancia_km, 
        orden_resultado: index + 1, 
    }));

    // 3. Insertar los resultados en la tabla 'consulta_puntoreciclaje'
    const { error: puntosError } = await supabase
        .from('consulta_puntoreciclaje')
        .insert(datosConsultaPuntos);

    if (puntosError) {
        console.error('Error al registrar los puntos de la consulta:', puntosError);
    }
}