# 🔐 Sistema OAuth2 para Dropbox - Documentación Completa

## 📖 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Inicio Rápido](#inicio-rápido)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Archivos Creados](#archivos-creados)
5. [Guías de Uso](#guías-de-uso)
6. [Comandos Disponibles](#comandos-disponibles)
7. [Solución de Problemas](#solución-de-problemas)
8. [Seguridad](#seguridad)

---

## 🎯 Resumen Ejecutivo

Se ha implementado un **sistema completo de autenticación OAuth2** con Dropbox que incluye:

✅ **Autorización automática** - Flujo OAuth2 completo  
✅ **Refresh automático** - Los tokens se renuevan automáticamente  
✅ **Persistencia** - Tokens guardados en archivo JSON  
✅ **Cliente listo** - Helpers para usar Dropbox API  
✅ **Interfaz web** - Panel de gestión de autenticación  
✅ **TypeScript** - Tipos completos para seguridad de tipos  
✅ **Documentación** - Guías y ejemplos completos  

**Beneficio principal:** Ya no tendrás errores 401 por tokens expirados. El sistema maneja todo automáticamente.

---

## 🚀 Inicio Rápido

### Paso 1: Verificar Configuración

Asegúrate de tener estas variables en `.env`:

```env
DROPBOX_CLIENT_ID=9luel6tahlh5d40
DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

### Paso 2: Iniciar Servidor

```bash
npm run dev
```

### Paso 3: Autorizar la Aplicación

Visita en tu navegador:

```
http://localhost:3000/dropbox-auth
```

O directamente:

```
http://localhost:3000/api/dropbox/authorize
```

Esto te redirigirá a Dropbox. Autoriza la aplicación.

### Paso 4: Verificar que Funcionó

```bash
npm run test:oauth
```

Este comando verificará:
- ✅ Variables de entorno
- ✅ Tokens guardados
- ✅ Conexión con Dropbox
- ✅ Listado de archivos

### Paso 5: Usar en tu Código

```typescript
import { getDropboxClient } from '@/lib/dropboxClient';

export async function POST(request: Request) {
  const dbx = await getDropboxClient();
  // Usar Dropbox API...
}
```

**¡Listo!** 🎉

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO OAUTH2                             │
└─────────────────────────────────────────────────────────────┘

1. Usuario visita /api/dropbox/authorize
   ↓
2. Redirige a Dropbox para autorizar
   ↓
3. Usuario aprueba permisos
   ↓
4. Dropbox redirige a /oauth/callback?code=ABC123
   ↓
5. /api/dropbox/callback intercambia code por tokens
   ↓
6. Guarda access_token y refresh_token en tokens.json
   ↓
7. ✅ Aplicación autenticada

┌─────────────────────────────────────────────────────────────┐
│                 USO DEL CLIENTE                             │
└─────────────────────────────────────────────────────────────┘

1. Tu código llama getDropboxClient()
   ↓
2. Sistema lee tokens.json
   ↓
3. ¿Token expirado?
   ├─ NO → Retorna cliente con token actual
   └─ SÍ → Refresca token automáticamente
           ↓
           Guarda nuevo token en tokens.json
           ↓
           Retorna cliente con token nuevo
```

---

## 📁 Archivos Creados

### Rutas API

| Archivo | Función | URL |
|---------|---------|-----|
| `/app/api/dropbox/authorize/route.ts` | Inicia OAuth | `/api/dropbox/authorize` |
| `/app/api/dropbox/callback/route.ts` | Maneja callback | `/oauth/callback` |
| `/app/api/dropbox/test-auth/route.ts` | Prueba conexión | `/api/dropbox/test-auth` |

### Helpers y Utilidades

| Archivo | Función |
|---------|---------|
| `/lib/refreshDropboxToken.ts` | Gestión de tokens y refresh |
| `/lib/dropboxClient.ts` | Cliente Dropbox con auto-refresh |
| `/lib/types/dropbox.ts` | Tipos TypeScript |

### Interfaz de Usuario

| Archivo | Función | URL |
|---------|---------|-----|
| `/app/dropbox-auth/page.tsx` | Panel de gestión OAuth | `/dropbox-auth` |

### Documentación

| Archivo | Contenido |
|---------|-----------|
| `DROPBOX_OAUTH_SETUP.md` | Guía completa de configuración |
| `QUICK_START_OAUTH.md` | Guía rápida de inicio |
| `INTEGRATION_EXAMPLES.md` | 10 ejemplos de integración |
| `OAUTH_IMPLEMENTATION_SUMMARY.md` | Resumen de implementación |
| `README_OAUTH.md` | Este archivo |

### Scripts

| Archivo | Comando | Función |
|---------|---------|---------|
| `/scripts/test-oauth-flow.ts` | `npm run test:oauth` | Prueba completa del flujo |

### Configuración

| Archivo | Cambios |
|---------|---------|
| `.env` | Agregado `DROPBOX_REDIRECT_URI` |
| `.gitignore` | Agregado `tokens.json` |
| `package.json` | Agregado script `test:oauth` |

---

## 📚 Guías de Uso

### Para Desarrolladores Nuevos

1. **Lee primero:** `QUICK_START_OAUTH.md`
2. **Autoriza la app:** Visita `/dropbox-auth`
3. **Prueba:** Ejecuta `npm run test:oauth`
4. **Integra:** Revisa `INTEGRATION_EXAMPLES.md`

### Para Desarrolladores Experimentados

1. **Arquitectura:** Revisa `DROPBOX_OAUTH_SETUP.md`
2. **Tipos:** Consulta `/lib/types/dropbox.ts`
3. **Ejemplos:** Usa `INTEGRATION_EXAMPLES.md` como referencia
4. **Personaliza:** Modifica los helpers según necesites

### Para DevOps/Producción

1. **Seguridad:** Lee la sección de seguridad en `DROPBOX_OAUTH_SETUP.md`
2. **Variables:** Configura las variables de entorno en tu plataforma
3. **Migración:** Considera migrar `tokens.json` a base de datos
4. **Monitoreo:** Implementa logging y alertas

---

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Probar flujo OAuth completo
npm run test:oauth

# Ver variables de entorno
npm run show:env
```

### Producción

```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

### URLs Importantes

```
# Desarrollo
http://localhost:3000/dropbox-auth          # Panel de gestión
http://localhost:3000/api/dropbox/authorize # Iniciar OAuth
http://localhost:3000/api/dropbox/test-auth # Probar conexión

# Producción
https://almip.com/dropbox-auth
https://almip.com/api/dropbox/authorize
https://almip.com/api/dropbox/test-auth
```

---

## 🔧 Solución de Problemas

### Error: "No tokens found"

**Causa:** No se ha completado el flujo OAuth.

**Solución:**
```bash
# 1. Inicia el servidor
npm run dev

# 2. Visita en el navegador
http://localhost:3000/api/dropbox/authorize

# 3. Autoriza la aplicación

# 4. Verifica que se creó tokens.json
ls tokens.json
```

### Error: "Failed to refresh token"

**Causa:** El refresh token es inválido o expiró.

**Solución:**
```bash
# 1. Elimina tokens.json
rm tokens.json

# 2. Vuelve a autorizar
# Visita: http://localhost:3000/api/dropbox/authorize
```

### Error: "Missing environment variables"

**Causa:** Faltan variables en `.env`.

**Solución:**
```bash
# Verifica que .env tenga:
cat .env

# Debe contener:
# DROPBOX_CLIENT_ID=9luel6tahlh5d40
# DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
# DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
```

### Error: "EACCES: permission denied"

**Causa:** No hay permisos de escritura para crear `tokens.json`.

**Solución:**
```bash
# En Linux/Mac
chmod 755 .

# En Windows (PowerShell como admin)
icacls . /grant Users:F
```

### Token no se refresca automáticamente

**Causa:** Puede que el token no esté realmente expirado.

**Verificación:**
```bash
# Ejecuta el test
npm run test:oauth

# Revisa la sección "Paso 3: Verificando estado del token"
# Debe mostrar cuántos minutos quedan
```

**Forzar refresh (para testing):**
```typescript
// Modifica tokens.json manualmente
// Cambia "expires_at" a una fecha pasada
{
  "expires_at": "2020-01-01T00:00:00.000Z"
}

// Luego ejecuta cualquier operación
npm run test:oauth
```

---

## 🔒 Seguridad

### ✅ Implementado

- ✅ **Tokens en archivo separado** (`tokens.json`) excluido de Git
- ✅ **Variables sensibles en `.env`** (CLIENT_SECRET)
- ✅ **Refresh automático** antes de expiración (buffer de 5 min)
- ✅ **No exposición de tokens** en respuestas API
- ✅ **Uso de `offline` access** para refresh tokens persistentes
- ✅ **TypeScript** para validación de tipos

### 🔄 Recomendado para Producción

#### 1. Migrar a Base de Datos

```typescript
// Ejemplo con PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function saveTokens(tokens: DropboxTokens) {
  await pool.query(
    'UPDATE app_settings SET dropbox_tokens = $1 WHERE id = 1',
    [JSON.stringify(tokens)]
  );
}
```

#### 2. Encriptar Tokens

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export function encryptToken(token: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  return cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
}
```

#### 3. Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function middleware(request: Request) {
  if (request.url.includes('/api/dropbox/')) {
    const { success } = await ratelimit.limit(ip);
    if (!success) return new Response('Too Many Requests', { status: 429 });
  }
}
```

#### 4. CSRF Protection

```typescript
// Agregar state parameter al OAuth flow
const state = crypto.randomBytes(32).toString('hex');

// Guardar en sesión
session.set('oauth_state', state);

// Verificar en callback
if (request.query.state !== session.get('oauth_state')) {
  throw new Error('Invalid state parameter');
}
```

#### 5. Logging y Monitoreo

```typescript
// lib/logger.ts
export function logOAuthEvent(event: string, data: any) {
  console.log({
    timestamp: new Date().toISOString(),
    event,
    data,
    environment: process.env.NODE_ENV,
  });
  
  // Enviar a servicio de monitoreo
  // Sentry, LogRocket, etc.
}
```

---

## 📊 Métricas y Monitoreo

### Eventos a Monitorear

- ✅ **Autorizaciones exitosas** - Contador
- ✅ **Refresh de tokens** - Contador y latencia
- ✅ **Errores de autenticación** - Alertas
- ✅ **Uso de API** - Rate limiting
- ✅ **Tamaño de archivos subidos** - Métricas

### Ejemplo de Implementación

```typescript
// lib/metrics.ts
export const metrics = {
  authSuccess: () => console.log('AUTH_SUCCESS'),
  authFailure: (error: string) => console.error('AUTH_FAILURE', error),
  tokenRefresh: () => console.log('TOKEN_REFRESH'),
  apiCall: (endpoint: string) => console.log('API_CALL', endpoint),
};
```

---

## 🎓 Recursos Adicionales

### Documentación Oficial

- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide)
- [Dropbox API Reference](https://www.dropbox.com/developers/documentation/http/documentation)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Documentación del Proyecto

- **Guía completa:** `DROPBOX_OAUTH_SETUP.md`
- **Inicio rápido:** `QUICK_START_OAUTH.md`
- **Ejemplos:** `INTEGRATION_EXAMPLES.md`
- **Resumen:** `OAUTH_IMPLEMENTATION_SUMMARY.md`

### Soporte

Si encuentras problemas:

1. Revisa la sección de **Solución de Problemas** arriba
2. Ejecuta `npm run test:oauth` para diagnóstico
3. Revisa los logs de la consola
4. Consulta la documentación oficial de Dropbox

---

## ✨ Resumen

Tu aplicación Next.js ahora tiene:

1. ✅ **Flujo OAuth2 completo** con Dropbox
2. ✅ **Refresh automático** de tokens (cada 4 horas)
3. ✅ **Cliente Dropbox** listo para usar
4. ✅ **Interfaz web** para gestión (`/dropbox-auth`)
5. ✅ **Documentación completa** y ejemplos
6. ✅ **TypeScript** con tipos completos
7. ✅ **Scripts de testing** para verificación

**Todo funciona automáticamente. Solo necesitas:**

1. Autorizar una vez visitando `/api/dropbox/authorize`
2. Usar `getDropboxClient()` en tu código
3. ¡Listo! El sistema maneja el resto.

---

**Implementado:** 2025-10-13  
**Proyecto:** democracy-corp (PDF_Defensor_Democracia)  
**Versión:** 1.0.0

🎉 **¡Disfruta de tu sistema OAuth2 completamente funcional!**
