// app/api/test-dropbox/route.ts
// Endpoint de diagnóstico para verificar configuración de Dropbox

import { NextResponse } from 'next/server';
import { createDropboxClient } from '@/lib/dropbox-auth-vercel';

export async function GET() {
  try {
    // Verificar variables de entorno
    const envCheck = {
      DROPBOX_CLIENT_ID: !!process.env.DROPBOX_CLIENT_ID,
      DROPBOX_CLIENT_SECRET: !!process.env.DROPBOX_CLIENT_SECRET,
      DROPBOX_ACCESS_TOKEN: !!process.env.DROPBOX_ACCESS_TOKEN,
      DROPBOX_REFRESH_TOKEN: !!process.env.DROPBOX_REFRESH_TOKEN,
      DROPBOX_FOLDER: !!process.env.DROPBOX_FOLDER,
    };

    // Mostrar primeros caracteres de los tokens (para debug)
    const tokenPreview = {
      CLIENT_ID: process.env.DROPBOX_CLIENT_ID?.substring(0, 10) + '...',
      ACCESS_TOKEN: process.env.DROPBOX_ACCESS_TOKEN?.substring(0, 20) + '...',
      REFRESH_TOKEN: process.env.DROPBOX_REFRESH_TOKEN?.substring(0, 20) + '...',
    };

    console.log('📋 Variables de entorno configuradas:', envCheck);
    console.log('🔍 Preview de tokens:', tokenPreview);

    // Intentar crear cliente y hacer una llamada simple
    const dbx = await createDropboxClient();
    
    console.log('🔌 Cliente Dropbox creado exitosamente');
    
    // Probar conexión listando archivos
    const response = await dbx.filesListFolder({ 
      path: '',
      limit: 1 
    });

    return NextResponse.json({
      success: true,
      message: '✅ Conexión con Dropbox exitosa',
      environmentVariables: envCheck,
      tokenPreview,
      dropboxTest: {
        connected: true,
        filesFound: response.result.entries.length,
      }
    });

  } catch (error: any) {
    console.error('❌ Error en test de Dropbox:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ Error al conectar con Dropbox',
      error: error.message,
      errorDetails: error.error || error.toString(),
      environmentVariables: {
        DROPBOX_CLIENT_ID: !!process.env.DROPBOX_CLIENT_ID,
        DROPBOX_CLIENT_SECRET: !!process.env.DROPBOX_CLIENT_SECRET,
        DROPBOX_ACCESS_TOKEN: !!process.env.DROPBOX_ACCESS_TOKEN,
        DROPBOX_REFRESH_TOKEN: !!process.env.DROPBOX_REFRESH_TOKEN,
        DROPBOX_FOLDER: !!process.env.DROPBOX_FOLDER,
      },
      hint: error.status === 401 
        ? '🔑 Token expirado o inválido. Genera un nuevo token en Dropbox App Console.'
        : '⚠️ Verifica que todas las variables estén configuradas correctamente.'
    }, { status: 500 });
  }
}
