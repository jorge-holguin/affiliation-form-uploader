// scripts/test-dropbox-auth.ts
// Script para probar la autenticación de Dropbox y el refresh de tokens

import { createDropboxClient, getValidAccessToken } from '../lib/dropbox-auth';

async function testDropboxAuth() {
  console.log('🔍 Probando autenticación de Dropbox...\n');

  try {
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log('  DROPBOX_CLIENT_ID:', process.env.DROPBOX_CLIENT_ID ? '✅ Configurado' : '❌ Falta');
    console.log('  DROPBOX_CLIENT_SECRET:', process.env.DROPBOX_CLIENT_SECRET ? '✅ Configurado' : '❌ Falta');
    console.log('  DROPBOX_ACCESS_TOKEN:', process.env.DROPBOX_ACCESS_TOKEN ? '✅ Configurado' : '❌ Falta');
    console.log('  DROPBOX_REFRESH_TOKEN:', process.env.DROPBOX_REFRESH_TOKEN ? '✅ Configurado' : '❌ Falta');
    console.log('');

    // Obtener token válido
    console.log('🔐 Obteniendo token de acceso válido...');
    const accessToken = await getValidAccessToken();
    console.log('✅ Token obtenido:', accessToken.substring(0, 20) + '...\n');

    // Crear cliente Dropbox
    console.log('🔌 Creando cliente Dropbox...');
    const dbx = await createDropboxClient();
    console.log('✅ Cliente creado exitosamente\n');

    // Probar conexión listando la carpeta raíz
    console.log('📂 Probando conexión (listando archivos)...');
    const response = await dbx.filesListFolder({ path: '' });
    console.log(`✅ Conexión exitosa! Encontrados ${response.result.entries.length} elementos\n`);

    // Mostrar algunos archivos
    if (response.result.entries.length > 0) {
      console.log('📄 Primeros archivos/carpetas:');
      response.result.entries.slice(0, 5).forEach(entry => {
        const icon = entry['.tag'] === 'folder' ? '📁' : '📄';
        console.log(`  ${icon} ${entry.name}`);
      });
    }

    console.log('\n✅ ¡Prueba completada exitosamente!');
    console.log('🎉 El sistema de refresh tokens está funcionando correctamente');

  } catch (error: any) {
    console.error('\n❌ Error durante la prueba:');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    
    if (error.error) {
      console.error('Detalles:', JSON.stringify(error.error, null, 2));
    }

    if (error.status === 401) {
      console.error('\n💡 Sugerencia: El token ha expirado o es inválido.');
      console.error('   Intenta generar un nuevo refresh token siguiendo la guía en DROPBOX_TOKEN_SETUP.md');
    }

    process.exit(1);
  }
}

// Ejecutar prueba
testDropboxAuth();
