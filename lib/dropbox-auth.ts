// lib/dropbox-auth.ts
import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp en ms
}

const TOKEN_FILE = path.join(process.cwd(), '.dropbox-tokens.json');

/**
 * Lee los tokens guardados del archivo
 */
function readTokens(): TokenData | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error leyendo tokens:', error);
  }
  return null;
}

/**
 * Guarda los tokens en el archivo
 */
function saveTokens(tokens: TokenData): void {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error guardando tokens:', error);
  }
}

/**
 * Refresca el access token usando el refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const clientId = process.env.DROPBOX_CLIENT_ID!;
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET!;

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
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
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Los tokens de Dropbox expiran en 4 horas (14400 segundos)
  const expiresAt = Date.now() + (data.expires_in * 1000);

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: refreshToken, // El refresh token no cambia
    expires_at: expiresAt,
  };

  saveTokens(tokenData);
  return tokenData;
}

/**
 * Obtiene un access token válido, refrescándolo si es necesario
 */
export async function getValidAccessToken(): Promise<string> {
  // Primero intentar con el token guardado
  let tokens = readTokens();

  // Si no hay tokens guardados, usar los del .env
  if (!tokens) {
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

    if (!refreshToken) {
      // Si no hay refresh token, usar el access token directo (modo legacy)
      if (!accessToken) {
        throw new Error('No se encontró DROPBOX_ACCESS_TOKEN ni DROPBOX_REFRESH_TOKEN');
      }
      console.warn('⚠️ Usando access token sin refresh. Esto expirará en 4 horas.');
      return accessToken;
    }

    // Guardar tokens iniciales
    tokens = {
      access_token: accessToken || '',
      refresh_token: refreshToken,
      expires_at: Date.now() + (4 * 60 * 60 * 1000), // 4 horas
    };
    saveTokens(tokens);
  }

  // Verificar si el token está expirado (con 5 minutos de margen)
  const isExpired = Date.now() >= (tokens.expires_at - 5 * 60 * 1000);

  if (isExpired) {
    console.log('🔄 Access token expirado, refrescando...');
    tokens = await refreshAccessToken(tokens.refresh_token);
  }

  return tokens.access_token;
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
