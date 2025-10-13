import { NextResponse } from 'next/server';
import { DROPBOX_OAUTH_CONSTANTS } from '@/lib/types/dropbox';

/**
 * GET /api/dropbox/authorize
 * 
 * Inicia el flujo OAuth2 de Dropbox redirigiendo al usuario a la página de autorización.
 * Usa token_access_type=offline para obtener refresh tokens.
 */
export async function GET() {
  const clientId = process.env.DROPBOX_CLIENT_ID;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing DROPBOX_CLIENT_ID or DROPBOX_REDIRECT_URI in environment variables' },
      { status: 500 }
    );
  }

  // Scopes necesarios para leer y escribir archivos
  const scopes = DROPBOX_OAUTH_CONSTANTS.DEFAULT_SCOPES.join(' ');

  // Construir la URL de autorización de Dropbox
  const authUrl = new URL(DROPBOX_OAUTH_CONSTANTS.AUTHORIZE_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('token_access_type', 'offline'); // Importante para obtener refresh token
  authUrl.searchParams.set('scope', scopes);

  // Redirigir al usuario a Dropbox para autorizar
  return NextResponse.redirect(authUrl.toString());
}
