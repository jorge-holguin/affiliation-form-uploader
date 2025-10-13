import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { TokenExchangeResponse, DropboxTokens } from '@/lib/types/dropbox';
import { DROPBOX_OAUTH_CONSTANTS } from '@/lib/types/dropbox';

/**
 * GET /api/dropbox/callback
 * 
 * Maneja el callback de OAuth2 de Dropbox.
 * Recibe el código de autorización y lo intercambia por access_token y refresh_token.
 * Guarda los tokens en tokens.json para uso futuro.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Verificar si hubo un error en la autorización
  if (error) {
    return NextResponse.json(
      { error: `Dropbox authorization error: ${error}` },
      { status: 400 }
    );
  }

  // Verificar que se recibió el código
  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    );
  }

  const clientId = process.env.DROPBOX_CLIENT_ID;
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
  let redirectUri = process.env.DROPBOX_REDIRECT_URI;

  // Si no hay redirect URI en .env, construirlo dinámicamente
  if (!redirectUri) {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    redirectUri = `${protocol}://${host}/oauth/callback`;
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { 
        error: 'Missing Dropbox credentials in environment variables',
        debug: {
          clientId: clientId ? 'present' : 'missing',
          clientSecret: clientSecret ? 'present' : 'missing',
          redirectUri: redirectUri,
          env: process.env.NODE_ENV,
        }
      },
      { status: 500 }
    );
  }

  try {
    // Intercambiar el código por tokens
    const tokenResponse = await fetch(DROPBOX_OAUTH_CONSTANTS.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Dropbox token exchange error:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens', details: errorData },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json() as TokenExchangeResponse;

    // Estructura de tokens a guardar
    const tokens: DropboxTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      account_id: tokenData.account_id,
      uid: tokenData.uid,
      obtained_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    };

    // Guardar tokens en archivo JSON
    const tokensPath = path.join(process.cwd(), 'tokens.json');
    await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');

    console.log('✅ Tokens saved successfully to tokens.json');

    // Retornar respuesta exitosa (sin exponer los tokens completos)
    return NextResponse.json({
      success: true,
      message: 'Dropbox authorization successful! Tokens saved.',
      account_id: tokenData.account_id,
      expires_in: tokenData.expires_in,
      scopes: tokenData.scope,
    });

  } catch (error) {
    console.error('Error in Dropbox callback:', error);
    return NextResponse.json(
      { error: 'Internal server error during token exchange', details: String(error) },
      { status: 500 }
    );
  }
}
