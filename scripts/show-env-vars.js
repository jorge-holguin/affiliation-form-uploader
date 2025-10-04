// scripts/show-env-vars.js
// Script para mostrar las variables de entorno que necesitas en Vercel

const fs = require('fs');
const path = require('path');

console.log('📋 Variables de Entorno para Vercel\n');
console.log('═'.repeat(60));
console.log('\nCopia estas variables en Vercel → Settings → Environment Variables\n');

try {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    if (key && value) {
      console.log(`\n📌 ${key}`);
      console.log('─'.repeat(60));
      
      // Mostrar solo los primeros y últimos caracteres de valores largos
      if (value.length > 80) {
        console.log(`${value.substring(0, 40)}...${value.substring(value.length - 20)}`);
        console.log(`(${value.length} caracteres - copia el valor completo del .env)`);
      } else {
        console.log(value);
      }
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Pasos siguientes:');
  console.log('1. Ve a https://vercel.com/dashboard');
  console.log('2. Selecciona tu proyecto (almip.com)');
  console.log('3. Settings → Environment Variables');
  console.log('4. Agrega cada variable de arriba');
  console.log('5. Marca: Production, Preview, Development');
  console.log('6. Haz Redeploy\n');
  
} catch (error) {
  console.error('❌ Error leyendo .env:', error.message);
  console.log('\nAsegúrate de que el archivo .env existe en la raíz del proyecto.');
}
