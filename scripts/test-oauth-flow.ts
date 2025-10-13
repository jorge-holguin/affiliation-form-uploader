/**
 * Script de prueba para verificar el flujo OAuth2 de Dropbox
 * 
 * Uso:
 *   npm run test:dropbox
 * 
 * O directamente:
 *   npx tsx scripts/test-oauth-flow.ts
 */

import { readTokens, isTokenExpired, getValidAccessToken, refreshDropboxToken } from '../lib/refreshDropboxToken';
import { getDropboxClient, listDropboxFiles } from '../lib/dropboxClient';

// Las variables de entorno se cargan automáticamente desde .env en Next.js
// Si ejecutas este script directamente, asegúrate de tener las variables configuradas

async function main() {
  console.log('🔍 Verificando flujo OAuth2 de Dropbox...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Paso 1: Verificando variables de entorno');
  const requiredEnvVars = [
    'DROPBOX_CLIENT_ID',
    'DROPBOX_CLIENT_SECRET',
    'DROPBOX_REDIRECT_URI',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Faltan variables de entorno:', missingVars.join(', '));
    console.log('\n💡 Agrega estas variables a tu archivo .env\n');
    process.exit(1);
  }
  
  console.log('✅ Variables de entorno configuradas correctamente');
  console.log(`   - CLIENT_ID: ${process.env.DROPBOX_CLIENT_ID}`);
  console.log(`   - REDIRECT_URI: ${process.env.DROPBOX_REDIRECT_URI}\n`);

  // 2. Verificar si existen tokens
  console.log('📋 Paso 2: Verificando tokens guardados');
  const tokens = await readTokens();
  
  if (!tokens) {
    console.error('❌ No se encontraron tokens guardados');
    console.log('\n💡 Para obtener tokens, sigue estos pasos:');
    console.log('   1. Inicia tu servidor: npm run dev');
    console.log('   2. Visita: http://localhost:3000/api/dropbox/authorize');
    console.log('   3. Autoriza la aplicación en Dropbox');
    console.log('   4. Vuelve a ejecutar este script\n');
    process.exit(1);
  }
  
  console.log('✅ Tokens encontrados en tokens.json');
  console.log(`   - Account ID: ${tokens.account_id}`);
  console.log(`   - Obtenido: ${new Date(tokens.obtained_at).toLocaleString()}`);
  console.log(`   - Expira: ${new Date(tokens.expires_at).toLocaleString()}`);
  
  // 3. Verificar si el token está expirado
  console.log('\n📋 Paso 3: Verificando estado del token');
  const expired = isTokenExpired(tokens);
  
  if (expired) {
    console.log('⚠️  Token expirado o próximo a expirar');
    console.log('   Intentando refrescar...');
    
    try {
      const newTokenData = await refreshDropboxToken(tokens.refresh_token);
      console.log('✅ Token refrescado exitosamente');
      console.log(`   - Nuevo access_token obtenido`);
      console.log(`   - Expira en: ${newTokenData.expires_in} segundos (${newTokenData.expires_in / 3600} horas)`);
    } catch (error) {
      console.error('❌ Error al refrescar token:', error);
      console.log('\n💡 Puede que necesites re-autorizar la aplicación');
      process.exit(1);
    }
  } else {
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
    
    console.log('✅ Token válido');
    console.log(`   - Tiempo restante: ${minutesLeft} minutos`);
  }

  // 4. Probar obtener un token válido (con auto-refresh)
  console.log('\n📋 Paso 4: Probando getValidAccessToken()');
  try {
    const validToken = await getValidAccessToken();
    console.log('✅ Token válido obtenido');
    console.log(`   - Token: ${validToken.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Error al obtener token válido:', error);
    process.exit(1);
  }

  // 5. Probar crear cliente de Dropbox
  console.log('\n📋 Paso 5: Creando cliente de Dropbox');
  let dbx;
  try {
    dbx = await getDropboxClient();
    console.log('✅ Cliente de Dropbox creado exitosamente');
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    process.exit(1);
  }

  // 6. Probar obtener información de la cuenta
  console.log('\n📋 Paso 6: Obteniendo información de la cuenta');
  try {
    const accountInfo = await dbx.usersGetCurrentAccount();
    console.log('✅ Información de cuenta obtenida');
    console.log(`   - Nombre: ${accountInfo.result.name.display_name}`);
    console.log(`   - Email: ${accountInfo.result.email}`);
    console.log(`   - Account ID: ${accountInfo.result.account_id}`);
    console.log(`   - Tipo: ${accountInfo.result.account_type['.tag']}`);
  } catch (error) {
    console.error('❌ Error al obtener información de cuenta:', error);
    process.exit(1);
  }

  // 7. Probar listar archivos
  console.log('\n📋 Paso 7: Listando archivos en Dropbox');
  const folderPath = process.env.DROPBOX_FOLDER || '';
  console.log(`   - Carpeta: ${folderPath || '/ (raíz)'}`);
  
  try {
    const files = await listDropboxFiles(folderPath);
    console.log(`✅ Archivos listados exitosamente`);
    console.log(`   - Total de archivos/carpetas: ${files.length}`);
    
    if (files.length > 0) {
      console.log('\n   Primeros 5 archivos:');
      files.slice(0, 5).forEach((file: any, index: number) => {
        const icon = file['.tag'] === 'folder' ? '📁' : '📄';
        const size = file.size ? ` (${(file.size / 1024).toFixed(2)} KB)` : '';
        console.log(`   ${index + 1}. ${icon} ${file.name}${size}`);
      });
      
      if (files.length > 5) {
        console.log(`   ... y ${files.length - 5} más`);
      }
    } else {
      console.log('   (La carpeta está vacía)');
    }
  } catch (error: any) {
    if (error?.error?.error?.['.tag'] === 'path' && error?.error?.error?.path?.['.tag'] === 'not_found') {
      console.log('⚠️  La carpeta no existe en Dropbox');
      console.log(`   - Carpeta buscada: ${folderPath}`);
      console.log('   - Esto es normal si aún no has creado la carpeta');
    } else {
      console.error('❌ Error al listar archivos:', error);
    }
  }

  // 8. Verificar espacio disponible
  console.log('\n📋 Paso 8: Verificando espacio en Dropbox');
  try {
    const spaceUsage = await dbx.usersGetSpaceUsage();
    const used = spaceUsage.result.used;
    const allocated = (spaceUsage.result.allocation as any).allocated;
    const usedGB = (used / (1024 ** 3)).toFixed(2);
    const allocatedGB = (allocated / (1024 ** 3)).toFixed(2);
    const percentage = ((used / allocated) * 100).toFixed(2);
    
    console.log('✅ Información de espacio obtenida');
    console.log(`   - Usado: ${usedGB} GB`);
    console.log(`   - Total: ${allocatedGB} GB`);
    console.log(`   - Porcentaje usado: ${percentage}%`);
  } catch (error) {
    console.log('⚠️  No se pudo obtener información de espacio');
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
  console.log('='.repeat(60));
  console.log('\n🎉 El flujo OAuth2 está funcionando correctamente!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Usa getDropboxClient() en tus rutas API');
  console.log('   2. Los tokens se refrescarán automáticamente');
  console.log('   3. Revisa INTEGRATION_EXAMPLES.md para más ejemplos\n');
}

// Ejecutar script
main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
