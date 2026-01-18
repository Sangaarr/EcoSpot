// Script de importación para tu modelo N:M: puntoreciclaje <-> punto_residuo <-> tiporesiduo.
// Usa caché para evitar consultas repetidas y realiza doble inserción por punto.
// ¡Optimizado para el formato de coordenadas del CSV de Madrid!

import { createReadStream } from 'fs';
import csv from 'csv-parser';
// Eliminamos la dependencia de './src/utils/supabaseClient.js' para evitar el error de react-native
import { createClient } from '@supabase/supabase-js'; 

// --- CONFIGURACIÓN DE SUPABASE (¡IMPORTANTE! REEMPLAZA ESTOS VALORES) ---
const supabaseUrl = 'https://xbapwhymwfuhbylpvjji.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYXB3aHltd2Z1aGJ5bHB2amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjM0NjYsImV4cCI6MjA3ODU5OTQ2Nn0.Y-ZSS3nJOoduJLAwXi4Tyzfbg67L22mRd31E4lZa7Eg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURACIÓN DE IMPORTACIÓN ---
const CSV_FILEPATH = 'contenedores_madrid.csv'; 
const TARGET_TABLE = 'puntoreciclaje'; // Tabla principal
const RELATION_TABLE = 'punto_residuo'; // Tabla intermedia
const CSV_DELIMITER = ';'; // TU CSV USA PUNTO Y COMA (;) COMO SEPARADOR
const BATCH_SIZE = 100; // Tamaño del lote para inserciones

// Cache para almacenar los IDs de los tipos de residuo, cargados de tiporesiduo.
let wasteTypeCache = {};

// --- MAPEO DE COLUMNAS ---
const COLUMN_MAPPING = {
    'Tipo Contenedor'            : 'wasteTypeRaw', // Columna temporal del CSV
    'Latitud'                    : 'latitud',    
    'Longitud'                   : 'longitud',   
    'Dirección'                  : 'direccion',  // Corregido a 'Dirección'
    // 'Orden' no se usa
};

/**
 * Limpia y convierte la cadena de coordenada a número.
 * Se asume que el formato es 'XX.XXX.XXX.XXX' donde los puntos son separadores de miles,
 * y se necesita un punto decimal.
 */
function cleanCoordinate(coordString) {
    if (!coordString) return NaN;
    
    // Eliminamos todos los puntos que actúan como separadores de miles.
    let cleaned = coordString.replace(/\./g, '');
    
    // Buscamos el patrón y forzamos la posición del punto decimal para coordenadas geográficas.
    // Ej: 40399762223622 -> 40.399762223622
    
    // CORRECCIÓN: Se relaja la expresión regular (\d+ en lugar de \d{14,}) 
    // para evitar el 'numeric field overflow' cuando la longitud de la cadena varía.
    
    const match = cleaned.match(/^(-?\d{1})(\d+)/); // Longitud (Ej: -3 seguido de 1 o más dígitos)
    if (match) {
        cleaned = match[1] + '.' + match[2];
    } else {
        const match2 = cleaned.match(/^(-?\d{2})(\d+)/); // Latitud (Ej: 40 seguido de 1 o más dígitos)
        if (match2) {
             cleaned = match2[1] + '.' + match2[2];
        } else {
            // Si todo falla, confiamos en la cadena original sin puntos de miles.
            cleaned = coordString.replace(/\./g, '');
        }
    }
    
    let value = parseFloat(cleaned);
    
    // Verificación adicional: si el valor sigue siendo anormalmente grande (ej. > 90), 
    // lo marcamos como inválido para evitar el desbordamiento en la base de datos.
    if (Math.abs(value) > 90) {
        return NaN;
    }

    return value;
}


/**
 * Normaliza el tipo de residuo del CSV de Madrid a tu nombre estandarizado (Ej: 'Envases').
 */
function normalizeWasteType(rawType) {
    if (!rawType) return 'Otros';
    const lower = rawType.toLowerCase().trim();

    if (lower.includes('envase')) {
        return 'Envases';
    }
    if (lower.includes('papel') || lower.includes('cartón') || lower.includes('carton')) {
        return 'Papel y Cartón';
    }
    if (lower.includes('vidrio')) {
        return 'Vidrio';
    }
    if (lower.includes('orgánico') || lower.includes('organico') || lower.includes('orgánica')) {
        return 'Orgánico';
    }
    
    if (lower.includes('pilas') || lower.includes('baterías')) {
        return 'Pilas y Baterías';
    }
    if (lower.includes('aceite')) {
        return 'Aceite usado';
    }
    
    // Si no coincide con ninguno, lo categorizamos como 'Otros'.
    return 'Otros';
}

/**
 * Carga todos los IDs de tiporesiduo en la caché al inicio para una búsqueda rápida.
 */
async function loadWasteTypeCache() {
    console.log("⏳ Cargando IDs de Tipos de Residuos desde Supabase...");
    const { data, error } = await supabase
        .from('tiporesiduo')
        // Buscamos la columna 'id_residuo'
        .select('id_residuo, nombre_residuo'); 

    if (error) {
        console.error("❌ Error al cargar la caché de tiporesiduo:", error.message);
        throw new Error("No se pudo cargar la tabla 'tiporesiduo'. Asegúrate de que existe y las credenciales son correctas.");
    }

    data.forEach(item => {
        // Almacenamos el ID (item.id_residuo) en la caché
        wasteTypeCache[item.nombre_residuo] = item.id_residuo;
    });

    const expectedTypes = ['Envases', 'Papel y Cartón', 'Vidrio', 'Orgánico', 'Otros'];
    expectedTypes.forEach(type => {
        if (!wasteTypeCache[type]) {
             console.warn(`⚠️ Advertencia: El tipo estandarizado '${type}' no se encontró en la tabla 'tiporesiduo'. Asegúrate de haber ejecutado el script SQL de preparación.`);
        }
    });

    console.log(`✅ IDs de Tipos de Residuos cargados: ${Object.keys(wasteTypeCache).length} tipos.`);
}

/**
 * Obtiene el ID del tipo de residuo usando la caché.
 */
function getWasteTypeId(normalizedType) {
    const id = wasteTypeCache[normalizedType];
    if (id) {
        return id;
    }
    return wasteTypeCache['Otros'] || null; 
}


async function importData() {
    // Verificar que las credenciales no sean las de marcador de posición
    if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error("❌ ERROR: Por favor, reemplaza 'YOUR_SUPABASE_URL' y 'YOUR_SUPABASE_ANON_KEY' con tus credenciales reales de Supabase.");
        return;
    }

    try {
        await loadWasteTypeCache();
    } catch (e) {
        console.error(e.message);
        return;
    }

    console.log(`--- Iniciando importación RELACIONAL N:M de ${CSV_FILEPATH} ---`);
    const records = [];
    let processedCount = 0;
    
    // 1. Lectura y parsing del CSV
    await new Promise((resolve, reject) => {
        createReadStream(CSV_FILEPATH) 
            .pipe(csv({ separator: CSV_DELIMITER }))
            .on('data', (row) => {
                const newRecord = {
                    wasteTypeNormalized: null, 
                    id_residuo: null, // CORRECCIÓN: Usar 'id_residuo' para coincidir con el nombre real de la columna FK en 'punto_residuo'
                };
                let isValid = true;
                
                for (const csvKey in COLUMN_MAPPING) {
                    const dbKey = COLUMN_MAPPING[csvKey];
                    let value = row[csvKey]; 

                    if (dbKey === 'latitud' || dbKey === 'longitud') {
                        const cleanedValue = cleanCoordinate(value);
                        if (isNaN(cleanedValue) || cleanedValue === null || cleanedValue === 0) {
                            // Cero o un valor grande (NaN devuelto por cleanCoordinate) no es una coordenada válida.
                            isValid = false; 
                            break;
                        }
                        newRecord[dbKey] = cleanedValue;
                    } else if (dbKey === 'wasteTypeRaw') {
                        newRecord.wasteTypeNormalized = normalizeWasteType(value);
                        newRecord.nombre = `Punto de Reciclaje (${newRecord.wasteTypeNormalized})`; 
                    } else if (dbKey === 'direccion') {
                         newRecord[dbKey] = value ? value.trim() : null;
                    }
                }
                
                if (isValid) {
                    const idTipo = getWasteTypeId(newRecord.wasteTypeNormalized);
                    
                    if (idTipo) {
                        newRecord.id_residuo = idTipo; // CORRECCIÓN: Asignar el ID al campo 'id_residuo'
                        records.push(newRecord);
                        processedCount++;
                    } 
                }
            })
            .on('end', () => {
                console.log(`✅ CSV Procesado. ${processedCount} registros válidos listos para insertar.`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`❌ Error al leer el CSV: ${CSV_FILEPATH}.`, err.message);
                reject(err);
            });
    });

    if (records.length === 0) {
        console.log("No hay registros válidos para insertar. Terminando.");
        return;
    }

    // 2. Inserción de datos en Supabase por lotes
    console.log(`⏳ Insertando ${records.length} puntos y sus relaciones en lotes de ${BATCH_SIZE}...`);
    let successfulInserts = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        
        const pointsToInsert = batch.map(r => ({
            nombre: r.nombre,
            direccion: r.direccion,
            latitud: r.latitud,
            longitud: r.longitud,
        }));
        
        try {
            // A. Insertar Puntos (y OBTENER id_punto devuelto)
            const { data: insertedPoints, error: pointsError } = await supabase
                .from(TARGET_TABLE)
                .insert(pointsToInsert)
                .select('id_punto'); 

            if (pointsError) {
                console.error(`❌ Error al insertar lote de puntos ${i/BATCH_SIZE + 1}:`, pointsError);
                // Muestra solo el error, no el objeto entero
                console.error(`   Detalle: ${pointsError.message}`); 
                continue; 
            }

            // B. Preparar Inserción en la Tabla Intermedia
            const relationsToInsert = insertedPoints.map((point, index) => ({
                id_punto: point.id_punto,
                id_residuo: batch[index].id_residuo, // CORRECCIÓN: Usar 'id_residuo' para la inserción
            }));

            // C. Insertar Relaciones
            const { error: relationError } = await supabase
                .from(RELATION_TABLE)
                .insert(relationsToInsert);

            if (relationError) {
                console.error(`❌ Error al insertar lote de relaciones ${i/BATCH_SIZE + 1}:`, relationError);
                // Muestra solo el error, no el objeto entero
                console.error(`   Detalle: ${relationError.message}`);
                continue; 
            }
            
            successfulInserts += insertedPoints.length;
            
        } catch (e) {
            console.error(`❌ Fallo en el proceso de lote ${i/BATCH_SIZE + 1}:`, e.message);
        }
    }
    
    console.log(`\n🎉 ¡Proceso Finalizado! ${successfulInserts} puntos insertados y relacionados con éxito.`);
}

// Ejecuta la función de importación
importData();