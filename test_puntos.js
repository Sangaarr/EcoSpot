// test_puntos.js


import { obtenerPuntosCercanos } from './src/api/puntos.js'; 

const lat = 40.416775;
const lon = -3.703790;
const residuo = 'Envases'; 


(async function runTest() {
    console.log("--- Ejecutando Prueba de Búsqueda de Puntos ---");
    
    try {
        
        const puntos = await obtenerPuntosCercanos(lat, lon, residuo);
        
        console.log(`✅ Prueba Exitosa: Se encontraron ${puntos.length} puntos para ${residuo}.`);
        console.log('Primer resultado (debe ser el más cercano):', puntos[0]);
        
    } catch (error) {
        console.error(`❌ Prueba Fallida: ${error.message}`);
    }
})(); 
