import { NextResponse } from 'next/server';
import { getDropboxClient, listDropboxFiles } from '@/lib/dropboxClient';
import { readTokens, isTokenExpired } from '@/lib/refreshDropboxToken';

/**
 * GET /api/dropbox/test-auth
 * 
 * Ruta de prueba para verificar que la autenticación OAuth2 funciona correctamente.
 * Lista los archivos en la carpeta configurada de Dropbox.
 */
export async function GET() {
  try {
    // Verificar si existen tokens
    const tokens = await readTokens();
    
    if (!tokens) {
      return NextResponse.json({
        error: 'No tokens found',
        message: 'Please authorize the app first by visiting /api/dropbox/authorize',
        authUrl: '/api/dropbox/authorize'
      }, { status: 401 });
    }

    // Verificar estado del token
    const expired = isTokenExpired(tokens);
    
    // Obtener cliente de Dropbox (auto-refresca si es necesario)
    const dbx = await getDropboxClient();
    
    // Obtener información de la cuenta
    const accountInfo = await dbx.usersGetCurrentAccount();
    
    // Listar archivos en la carpeta configurada
    const folderPath = process.env.DROPBOX_FOLDER || '';
    const files = await listDropboxFiles(folderPath);

    return NextResponse.json({
      success: true,
      message: 'Dropbox authentication is working correctly!',
      tokenStatus: {
        wasExpired: expired,
        expiresAt: tokens.expires_at,
        obtainedAt: tokens.obtained_at,
      },
      account: {
        name: accountInfo.result.name.display_name,
        email: accountInfo.result.email,
        accountId: accountInfo.result.account_id,
      },
      folder: folderPath,
      filesCount: files.length,
      files: files.map((file: any) => ({
        name: file.name,
        path: file.path_display,
        type: file['.tag'],
        size: file.size,
      })),
    });

  } catch (error) {
    console.error('Error in test-auth:', error);
    
    return NextResponse.json({
      error: 'Authentication test failed',
      details: String(error),
      message: 'Please try re-authorizing at /api/dropbox/authorize',
    }, { status: 500 });
  }
}
