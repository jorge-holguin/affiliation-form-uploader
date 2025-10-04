// lib/dropbox-auth-vercel.ts
// Versión optimizada para Vercel (sin sistema de archivos)

import { Dropbox } from 'dropbox';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Cache en memoria (se pierde entre invocaciones pero ayuda en la misma ejecución)
let cachedTokens: TokenData | null = null;

/**
 * Refresca el access token usando el refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const clientId = process.env.DROPBOX_CLIENT_ID?.trim();
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET?.trim();
  const cleanRefreshToken = refreshToken.trim();

  if (!clientId || !clientSecret) {
    throw new Error('DROPBOX_CLIENT_ID y DROPBOX_CLIENT_SECRET son requeridos para refresh tokens');
  }

  console.log('🔄 Refrescando access token de Dropbox...');
  console.log('📋 Client ID:', clientId);
  console.log('📋 Refresh Token (primeros 20 chars):', cleanRefreshToken.substring(0, 20) + '...');

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: cleanRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error refrescando token:', errorText);
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  // Los tokens de Dropbox expiran en 4 horas (14400 segundos)
  const expiresAt = Date.now() + (data.expires_in * 1000);

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  };

  // Guardar en cache de memoria
  cachedTokens = tokenData;
  console.log('✅ Token refrescado exitosamente');

  return tokenData;
}

/**
 * Obtiene un access token válido, refrescándolo si es necesario
 */
export async function getValidAccessToken(): Promise<string> {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN?.trim();
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN?.trim();

  // Si no hay refresh token, usar access token directo
  if (!refreshToken) {
    if (!accessToken) {
      throw new Error('No se encontró DROPBOX_ACCESS_TOKEN ni DROPBOX_REFRESH_TOKEN en las variables de entorno');
    }
    console.warn('⚠️ Usando access token sin refresh. Esto expirará en 4 horas.');
    console.warn('💡 Configura DROPBOX_REFRESH_TOKEN para renovación automática');
    return accessToken;
  }

  // Verificar si tenemos un token en cache y no ha expirado
  if (cachedTokens) {
    const isExpired = Date.now() >= (cachedTokens.expires_at - 5 * 60 * 1000);
    if (!isExpired) {
      console.log('✅ Usando token en cache (válido)');
      return cachedTokens.access_token;
    }
    console.log('⏰ Token en cache expirado, refrescando...');
  }

  // Intentar refrescar token
  try {
    const tokens = await refreshAccessToken(refreshToken);
    return tokens.access_token;
  } catch (error: any) {
    console.error('❌ Error al refrescar token:', error.message);
    
    // Fallback: usar access token directo si existe
    if (accessToken) {
      console.warn('⚠️ Usando DROPBOX_ACCESS_TOKEN como fallback');
      return accessToken;
    }
    
    throw error;
  }
}

/**
 * Crea una instancia de Dropbox con token válido
 */
export async function createDropboxClient(): Promise<Dropbox> {
  const accessToken = await getValidAccessToken();
  return new Dropbox({
    accessToken,
    fetch,
  });
}
