import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto' 
// Importar AsyncStorage para persistencia de sesión en Expo/RN
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 1. SUPABASE_URL: REEMPLAZA ESTA CLAVE CON TU URL DE PROYECTO REAL
const SUPABASE_URL = 'https://xbapwhymwfuhbylpvjji.supabase.co'; 

// 2. SUPABASE_ANON_KEY: REEMPLAZA ESTA CLAVE CON TU CLAVE ANON_KEY REAL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYXB3aHltd2Z1aGJ5bHB2amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjM0NjYsImV4cCI6MjA3ODU5OTQ2Nn0.Y-ZSS3nJOoduJLAwXi4Tyzfbg67L22mRd31E4lZa7Eg'; 

// ------------------------------------------

// --- VALIDACIÓN DE SEGURIDAD ---
// Esta comprobación nos ayuda a atrapar errores de entorno o de configuración
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("ERROR CRÍTICO: Las variables SUPABASE_URL o SUPABASE_ANON_KEY no están definidas o están vacías. Verifica src/utils/supabaseClient.js");
}

export const supabase = createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY,
    {
        auth: {
            // Asignar AsyncStorage al almacenamiento de sesión
            storage: AsyncStorage,
            autoRefreshToken: true,
            // Activar la persistencia de sesión
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);