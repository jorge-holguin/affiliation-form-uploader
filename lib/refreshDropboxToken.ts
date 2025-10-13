import { promises as fs } from 'fs';
import path from 'path';
import type { DropboxTokens, RefreshTokenResponse } from './types/dropbox';
import { DROPBOX_OAUTH_CONSTANTS } from './types/dropbox';

/**
 * Lee los tokens desde tokens.json
 */
export async function readTokens(): Promise<DropboxTokens | null> {
  try {
    const tokensPath = path.join(process.cwd(), 'tokens.json');
    const tokensData = await fs.readFile(tokensPath, 'utf-8');
    return JSON.parse(tokensData) as DropboxTokens;
  } catch (error) {
    console.error('Error reading tokens.json:', error);
    return null;
  }
}

/**
 * Guarda los tokens actualizados en tokens.json
 */
export async function saveTokens(tokens: DropboxTokens): Promise<void> {
  try {
    const tokensPath = path.join(process.cwd(), 'tokens.json');
    await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
    console.log('✅ Tokens updated in tokens.json');
  } catch (error) {
    console.error('Error saving tokens.json:', error);
    throw error;
  }
}

/**
 * Verifica si el access_token ha expirado
 */
export function isTokenExpired(tokens: DropboxTokens): boolean {
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  
  // Considerar expirado si faltan menos de 5 minutos
  return now.getTime() >= (expiresAt.getTime() - DROPBOX_OAUTH_CONSTANTS.EXPIRATION_BUFFER_MS);
}

/**
 * Refresca el access_token usando el refresh_token
 * 
 * @param refreshToken - El refresh token de Dropbox
 * @returns El nuevo access_token y su tiempo de expiración
 */
export async function refreshDropboxToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const clientId = process.env.DROPBOX_CLIENT_ID;
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing DROPBOX_CLIENT_ID or DROPBOX_CLIENT_SECRET in environment variables');
  }

  try {
    const response = await fetch(DROPBOX_OAUTH_CONSTANTS.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Dropbox token refresh error:', errorData);
      throw new Error(`Failed to refresh token: ${response.status} ${errorData}`);
    }

    const data = await response.json() as RefreshTokenResponse;
    console.log('✅ Access token refreshed successfully');
    
    return data;
  } catch (error) {
    console.error('Error refreshing Dropbox token:', error);
    throw error;
  }
}

/**
 * Obtiene un access_token válido, refrescándolo automáticamente si es necesario
 * 
 * @returns Un access_token válido
 */
export async function getValidAccessToken(): Promise<string> {
  // Leer tokens actuales
  const tokens = await readTokens();

  if (!tokens) {
    throw new Error('No tokens found. Please authorize the app first at /api/dropbox/authorize');
  }

  // Verificar si el token ha expirado
  if (isTokenExpired(tokens)) {
    console.log('⚠️ Access token expired, refreshing...');
    
    // Refrescar el token
    const refreshedData = await refreshDropboxToken(tokens.refresh_token);

    // Actualizar los tokens con el nuevo access_token
    const updatedTokens: DropboxTokens = {
      ...tokens,
      access_token: refreshedData.access_token,
      expires_in: refreshedData.expires_in,
      obtained_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + refreshedData.expires_in * 1000).toISOString(),
    };

    // Guardar los tokens actualizados
    await saveTokens(updatedTokens);

    return refreshedData.access_token;
  }

  // El token aún es válido
  console.log('✅ Access token is still valid');
  return tokens.access_token;
}
