/**
 * GET /api/dropbox/status
 * 
 * Endpoint para verificar el estado del sistema de tokens de Dropbox
 * Útil para monitoreo y debugging
 */

import { NextResponse } from 'next/server';
import { readTokens, isTokenExpired } from '@/lib/refreshDropboxToken';

export async function GET() {
  try {
    // Leer tokens desde Supabase
    const tokens = await readTokens();

    if (!tokens) {
      return NextResponse.json({
        status: 'error',
        message: 'No tokens found in database',
        authorized: false,
        action_required: 'Visit /api/dropbox/authorize to authorize the application',
      }, { status: 404 });
    }

    // Verificar expiración
    const expired = isTokenExpired(tokens);
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const minutesRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
    const hoursRemaining = (minutesRemaining / 60).toFixed(2);

    // Estado general
    const systemStatus = expired ? 'token_expired' : 'operational';
    const statusMessage = expired 
      ? 'Token expired but will be auto-refreshed on next upload'
      : 'System operational - tokens valid';

    return NextResponse.json({
      status: systemStatus,
      message: statusMessage,
      authorized: true,
      token_info: {
        account_id: tokens.account_id,
        obtained_at: tokens.obtained_at,
        expires_at: tokens.expires_at,
        is_expired: expired,
        minutes_remaining: expired ? 0 : minutesRemaining,
        hours_remaining: expired ? 0 : hoursRemaining,
        scope: tokens.scope,
      },
      auto_refresh: {
        enabled: true,
        description: 'Tokens will be automatically refreshed when needed',
      },
      next_steps: expired 
        ? 'Token will auto-refresh on next file upload. No action needed.'
        : 'System ready. No action needed.',
    });

  } catch (error: any) {
    console.error('Error checking Dropbox status:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Error checking token status',
      authorized: false,
      error: error.message,
      action_required: 'Check server logs and verify Supabase configuration',
    }, { status: 500 });
  }
}
