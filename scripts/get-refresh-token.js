// scripts/get-refresh-token.js
// Script interactivo para obtener refresh token de Dropbox

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CLIENT_ID = '9luel6tahlh5d40';
const CLIENT_SECRET = '933ku5zxgjtwoiz';

console.log('\n🔑 Generador de Refresh Token de Dropbox\n');
console.log('═'.repeat(60));
console.log('\n📋 PASO 1: Autorizar la aplicación\n');
console.log('Abre esta URL en tu navegador:\n');
console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${CLIENT_ID}&token_access_type=offline&response_type=code\n`);
console.log('═'.repeat(60));
console.log('\n📋 PASO 2: Copiar el código\n');
console.log('Después de autorizar, serás redirigido a una URL como:');
console.log('http://localhost:3000/oauth/callback?code=XXXXXXXX\n');
console.log('Copia el código que aparece después de "code="\n');
console.log('═'.repeat(60));

rl.question('\n✏️  Pega el código aquí: ', async (code) => {
  if (!code || code.trim().length === 0) {
    console.error('\n❌ Error: No ingresaste ningún código');
    rl.close();
    return;
  }

  const cleanCode = code.trim();
  console.log('\n🔄 Intercambiando código por tokens...\n');

  try {
    const params = new URLSearchParams({
      code: cleanCode,
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      rl.close();
      return;
    }

    const data = await response.json();

    console.log('✅ ¡Tokens obtenidos exitosamente!\n');
    console.log('═'.repeat(60));
    console.log('\n📋 Copia estos valores en tu archivo .env:\n');
    console.log(`DROPBOX_ACCESS_TOKEN=${data.access_token}`);
    console.log(`DROPBOX_REFRESH_TOKEN=${data.refresh_token}\n`);
    console.log('═'.repeat(60));
    console.log('\n📋 Y también en Vercel → Settings → Environment Variables:\n');
    console.log('1. DROPBOX_ACCESS_TOKEN');
    console.log(`   Valor: ${data.access_token.substring(0, 40)}...`);
    console.log('\n2. DROPBOX_REFRESH_TOKEN');
    console.log(`   Valor: ${data.refresh_token}\n`);
    console.log('═'.repeat(60));
    console.log('\n✅ Pasos siguientes:');
    console.log('1. Actualiza tu archivo .env local');
    console.log('2. Actualiza las variables en Vercel');
    console.log('3. Haz Redeploy en Vercel');
    console.log('4. ¡Listo! Los tokens se renovarán automáticamente\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  rl.close();
});
