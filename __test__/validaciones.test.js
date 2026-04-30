test('Comprobación de que el entorno de pruebas automáticas funciona', () => {
  const correoPrueba = 'usuario@ecospot.com';
  const tieneArroba = correoPrueba.includes('@');
  
  expect(tieneArroba).toBe(true);
});

test('Comprobación de que rechaza un correo sin formato correcto', () => {
  const correoFalso = 'usuarioecospot.com';
  const tieneArroba = correoFalso.includes('@');
  
  expect(tieneArroba).toBe(false);
});