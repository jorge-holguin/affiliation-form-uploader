import type { DropboxTokens, RefreshTokenResponse } from './types/dropbox';
import { DROPBOX_OAUTH_CONSTANTS } from './types/dropbox';
import { supabase } from './supabase';
import type { DropboxTokenInsert, DropboxTokenUpdate } from './supabase';

const APP_NAME = 'PDF_Defensor_Democracia';

/**
 * Lee los tokens desde Supabase
 */
export async function readTokens(): Promise<DropboxTokens | null> {
  try {
    const { data, error } = await supabase
      .from('dropbox_tokens')
      .select('*')
      .eq('app_name', APP_NAME)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error reading tokens from Supabase:', error);
      return null;
    }

    if (!data) {
      console.log('No tokens found in Supabase');
      return null;
    }

    // Convertir de formato Supabase a DropboxTokens
    const tokens: DropboxTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      account_id: data.account_id,
      uid: data.uid,
      obtained_at: data.obtained_at,
      expires_at: data.expires_at,
    };

    return tokens;
  } catch (error) {
    console.error('Error reading tokens from Supabase:', error);
    return null;
  }
}

/**
 * Guarda los tokens en Supabase
 */
export async function saveTokens(tokens: DropboxTokens): Promise<void> {
  try {
    // Primero, verificar si ya existe un registro
    const { data: existing } = await supabase
      .from('dropbox_tokens')
      .select('id')
      .eq('app_name', APP_NAME)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const tokenData: DropboxTokenInsert = {
      app_name: APP_NAME,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope,
      account_id: tokens.account_id,
      uid: tokens.uid || null,
      obtained_at: tokens.obtained_at,
      expires_at: tokens.expires_at,
    };

    if (existing) {
      // Actualizar registro existente
      const { error } = await supabase
        .from('dropbox_tokens')
        .update(tokenData)
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating tokens in Supabase:', error);
        throw error;
      }

      console.log('✅ Tokens updated in Supabase');
    } else {
      // Insertar nuevo registro
      const { error } = await supabase
        .from('dropbox_tokens')
        .insert(tokenData);

      if (error) {
        console.error('Error inserting tokens in Supabase:', error);
        throw error;
      }

      console.log('✅ Tokens saved to Supabase');
    }
  } catch (error) {
    console.error('Error saving tokens to Supabase:', error);
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
