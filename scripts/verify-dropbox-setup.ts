#!/usr/bin/env tsx
/**
 * Script de verificación de configuración de Dropbox
 * 
 * Verifica que:
 * 1. Las variables de entorno estén configuradas
 * 2. La tabla de Supabase exista y tenga tokens
 * 3. Los tokens sean válidos
 * 4. El sistema pueda refrescar tokens
 * 
 * Uso:
 *   npx tsx scripts/verify-dropbox-setup.ts
 */

import { config } from 'dotenv';
import { readTokens, isTokenExpired, getValidAccessToken } from '../lib/refreshDropboxToken';
import { supabase } from '../lib/supabase';

// Cargar variables de entorno
config({ path: '.env.local' });

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_KEY',
  'DROPBOX_CLIENT_ID',
  'DROPBOX_CLIENT_SECRET',
  'DROPBOX_REDIRECT_URI'
];

interface CheckResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: CheckResult[] = [];

function printResult(result: CheckResult) {
  const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`⚠️  Advertencias: ${warningCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('\n🎉 ¡Todo está configurado correctamente!');
    console.log('   El sistema está listo para funcionar 24/7');
  } else if (errorCount > 0) {
    console.log('\n❌ Hay errores críticos que deben ser corregidos');
    console.log('   Consulta el archivo DROPBOX_24_7_SETUP.md para más información');
  } else {
    console.log('\n⚠️  Hay advertencias que deberías revisar');
    console.log('   El sistema puede funcionar pero no de manera óptima');
  }
  console.log('='.repeat(60) + '\n');
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Verificando Variables de Entorno...');
  
  const missingVars: string[] = [];
  const presentVars: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length === 0) {
    results.push({
      name: 'Variables de Entorno',
      status: 'success',
      message: `Todas las ${REQUIRED_ENV_VARS.length} variables requeridas están configuradas`
    });
  } else {
    results.push({
      name: 'Variables de Entorno',
      status: 'error',
      message: `Faltan ${missingVars.length} variables de entorno`,
      details: { missing: missingVars }
    });
  }
}

async function checkSupabaseConnection() {
  console.log('\n🔍 Verificando Conexión a Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('dropbox_tokens')
      .select('count')
      .limit(1);
    
    if (error) {
      results.push({
        name: 'Conexión a Supabase',
        status: 'error',
        message: 'Error al conectar con Supabase',
        details: error
      });
      return false;
    }
    
    results.push({
      name: 'Conexión a Supabase',
      status: 'success',
      message: 'Conexión exitosa a Supabase'
    });
    return true;
  } catch (error) {
    results.push({
      name: 'Conexión a Supabase',
      status: 'error',
      message: 'Excepción al conectar con Supabase',
      details: error
    });
    return false;
  }
}

async function checkDropboxTable() {
  console.log('\n🔍 Verificando Tabla dropbox_tokens...');
  
  try {
    const { data, error } = await supabase
      .from('dropbox_tokens')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        results.push({
          name: 'Tabla dropbox_tokens',
          status: 'error',
          message: 'La tabla dropbox_tokens no existe en Supabase',
          details: { 
            solution: 'Ejecuta el SQL en supabase/create-dropbox-tokens-table.sql'
          }
        });
        return false;
      }
      
      results.push({
        name: 'Tabla dropbox_tokens',
        status: 'error',
        message: 'Error al verificar la tabla',
        details: error
      });
      return false;
    }
    
    results.push({
      name: 'Tabla dropbox_tokens',
      status: 'success',
      message: 'Tabla dropbox_tokens existe y es accesible'
    });
    return true;
  } catch (error) {
    results.push({
      name: 'Tabla dropbox_tokens',
      status: 'error',
      message: 'Excepción al verificar la tabla',
      details: error
    });
    return false;
  }
}

async function checkStoredTokens() {
  console.log('\n🔍 Verificando Tokens Guardados...');
  
  try {
    const tokens = await readTokens();
    
    if (!tokens) {
      results.push({
        name: 'Tokens en Supabase',
        status: 'error',
        message: 'No hay tokens guardados en Supabase',
        details: {
          solution: 'Autoriza la aplicación en: /api/dropbox/authorize'
        }
      });
      return null;
    }
    
    results.push({
      name: 'Tokens en Supabase',
      status: 'success',
      message: 'Tokens encontrados en Supabase',
      details: {
        account_id: tokens.account_id,
        obtained_at: tokens.obtained_at,
        expires_at: tokens.expires_at,
        scope: tokens.scope
      }
    });
    
    return tokens;
  } catch (error) {
    results.push({
      name: 'Tokens en Supabase',
      status: 'error',
      message: 'Error al leer tokens',
      details: error
    });
    return null;
  }
}

async function checkTokenExpiration(tokens: any) {
  console.log('\n🔍 Verificando Expiración de Tokens...');
  
  if (!tokens) {
    results.push({
      name: 'Expiración de Tokens',
      status: 'error',
      message: 'No se pueden verificar tokens inexistentes'
    });
    return;
  }
  
  try {
    const expired = isTokenExpired(tokens);
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const minutesRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
    
    if (expired) {
      results.push({
        name: 'Expiración de Tokens',
        status: 'warning',
        message: 'El access token ha expirado o está por expirar',
        details: {
          expires_at: tokens.expires_at,
          minutes_remaining: minutesRemaining,
          will_refresh: true
        }
      });
    } else {
      results.push({
        name: 'Expiración de Tokens',
        status: 'success',
        message: `Token válido por ${minutesRemaining} minutos más`,
        details: {
          expires_at: tokens.expires_at,
          minutes_remaining: minutesRemaining
        }
      });
    }
  } catch (error) {
    results.push({
      name: 'Expiración de Tokens',
      status: 'error',
      message: 'Error al verificar expiración',
      details: error
    });
  }
}

async function testTokenRefresh() {
  console.log('\n🔍 Probando Renovación de Tokens...');
  
  try {
    const accessToken = await getValidAccessToken();
    
    if (accessToken) {
      results.push({
        name: 'Sistema de Renovación',
        status: 'success',
        message: 'El sistema puede obtener y renovar tokens correctamente',
        details: {
          token_length: accessToken.length,
          token_preview: accessToken.substring(0, 20) + '...'
        }
      });
    } else {
      results.push({
        name: 'Sistema de Renovación',
        status: 'error',
        message: 'No se pudo obtener un token válido'
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Sistema de Renovación',
      status: 'error',
      message: 'Error al probar renovación de tokens',
      details: {
        error: error.message
      }
    });
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🔧 VERIFICACIÓN DE CONFIGURACIÓN DE DROPBOX 24/7');
  console.log('═'.repeat(60));
  
  // Paso 1: Variables de entorno
  await checkEnvironmentVariables();
  printResult(results[results.length - 1]);
  
  // Paso 2: Conexión a Supabase
  const supabaseConnected = await checkSupabaseConnection();
  printResult(results[results.length - 1]);
  
  if (!supabaseConnected) {
    printSummary();
    process.exit(1);
  }
  
  // Paso 3: Verificar tabla
  const tableExists = await checkDropboxTable();
  printResult(results[results.length - 1]);
  
  if (!tableExists) {
    printSummary();
    process.exit(1);
  }
  
  // Paso 4: Verificar tokens guardados
  const tokens = await checkStoredTokens();
  printResult(results[results.length - 1]);
  
  // Paso 5: Verificar expiración
  await checkTokenExpiration(tokens);
  printResult(results[results.length - 1]);
  
  // Paso 6: Probar renovación
  if (tokens) {
    await testTokenRefresh();
    printResult(results[results.length - 1]);
  }
  
  // Resumen final
  printSummary();
  
  // Exit code
  const hasErrors = results.some(r => r.status === 'error');
  process.exit(hasErrors ? 1 : 0);
}

main().catch((error) => {
  console.error('\n💥 Error fatal durante la verificación:', error);
  process.exit(1);
});
