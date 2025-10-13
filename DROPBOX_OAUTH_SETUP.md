# 🔐 Dropbox OAuth2 - Guía Completa de Implementación

Esta guía documenta el flujo completo de autenticación OAuth2 con Dropbox implementado en este proyecto Next.js.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Flujo de Autenticación](#flujo-de-autenticación)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Uso del Cliente Dropbox](#uso-del-cliente-dropbox)
5. [Manejo de Tokens](#manejo-de-tokens)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
DROPBOX_CLIENT_ID=9luel6tahlh5d40
DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

### 2. Configuración de la App en Dropbox

- **App Name:** PDF_Defensor_Democracia
- **Client ID:** 9luel6tahlh5d40
- **Redirect URI:** https://almip.com/oauth/callback
- **Scopes requeridos:**
  - `files.content.write`
  - `files.content.read`
  - `files.metadata.read`
  - `files.metadata.write`
- **Token Access Type:** `offline` (para obtener refresh tokens)

---

## 🔄 Flujo de Autenticación

### Paso 1: Iniciar Autorización

Visita la siguiente URL en tu navegador (o crea un botón en tu UI):

```
https://tu-dominio.com/api/dropbox/authorize
```

O en desarrollo local:

```
http://localhost:3000/api/dropbox/authorize
```

**¿Qué sucede?**
- La ruta `/api/dropbox/authorize` redirige automáticamente a Dropbox
- El usuario verá la página de autorización de Dropbox
- Dropbox pedirá permiso para acceder a los archivos

### Paso 2: Callback Automático

Después de que el usuario autorice la app:

1. Dropbox redirige a: `https://almip.com/oauth/callback?code=AUTHORIZATION_CODE`
2. La ruta `/api/dropbox/callback` intercepta esta petición
3. Intercambia el `code` por `access_token` y `refresh_token`
4. Guarda los tokens en `tokens.json`

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Dropbox authorization successful! Tokens saved.",
  "account_id": "dbid:...",
  "expires_in": 14400,
  "scopes": "files.content.write files.content.read ..."
}
```

### Paso 3: Uso Automático

Una vez autorizados, todos los clientes Dropbox usarán automáticamente los tokens guardados y los refrescarán cuando expiren.

---

## 📁 Estructura de Archivos

```
democracy-corp/
├── app/
│   └── api/
│       └── dropbox/
│           ├── authorize/
│           │   └── route.ts          # Inicia OAuth flow
│           └── callback/
│               └── route.ts          # Maneja callback y guarda tokens
├── lib/
│   ├── refreshDropboxToken.ts        # Funciones de refresh de tokens
│   └── dropboxClient.ts              # Cliente Dropbox con auto-refresh
├── tokens.json                       # Tokens guardados (gitignored)
└── .env                              # Variables de entorno
```

---

## 💻 Uso del Cliente Dropbox

### Importar el Cliente

```typescript
import { getDropboxClient, uploadFileToDropbox, downloadFileFromDropbox, listDropboxFiles } from '@/lib/dropboxClient';
```

### Ejemplo 1: Subir un Archivo

```typescript
import { uploadFileToDropbox } from '@/lib/dropboxClient';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Convertir archivo a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Subir a Dropbox
  const result = await uploadFileToDropbox(
    `/PDF_Defensor_Democracia/${file.name}`,
    buffer
  );
  
  return Response.json({ success: true, file: result });
}
```

### Ejemplo 2: Listar Archivos

```typescript
import { listDropboxFiles } from '@/lib/dropboxClient';

export async function GET() {
  const files = await listDropboxFiles('/PDF_Defensor_Democracia');
  
  return Response.json({ files });
}
```

### Ejemplo 3: Descargar un Archivo

```typescript
import { downloadFileFromDropbox } from '@/lib/dropboxClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  
  const fileBuffer = await downloadFileFromDropbox(filePath!);
  
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filePath}"`,
    },
  });
}
```

### Ejemplo 4: Cliente Personalizado

```typescript
import { getDropboxClient } from '@/lib/dropboxClient';

export async function customDropboxOperation() {
  const dbx = await getDropboxClient();
  
  // Usar cualquier método de la API de Dropbox
  const response = await dbx.filesGetMetadata({
    path: '/PDF_Defensor_Democracia/documento.pdf'
  });
  
  return response.result;
}
```

---

## 🔑 Manejo de Tokens

### Estructura de `tokens.json`

```json
{
  "access_token": "sl.u.ABC123...",
  "refresh_token": "EZVYX5Jcrj8...",
  "expires_in": 14400,
  "token_type": "bearer",
  "scope": "files.content.write files.content.read ...",
  "account_id": "dbid:...",
  "uid": "12345",
  "obtained_at": "2025-10-13T05:30:00.000Z",
  "expires_at": "2025-10-13T09:30:00.000Z"
}
```

### Funciones Disponibles

#### `getValidAccessToken()`

Obtiene un access token válido, refrescándolo automáticamente si expiró.

```typescript
import { getValidAccessToken } from '@/lib/refreshDropboxToken';

const token = await getValidAccessToken();
```

#### `refreshDropboxToken(refreshToken)`

Refresca manualmente un token.

```typescript
import { refreshDropboxToken } from '@/lib/refreshDropboxToken';

const newTokenData = await refreshDropboxToken('REFRESH_TOKEN_HERE');
```

#### `readTokens()` y `saveTokens()`

Lee o guarda tokens en `tokens.json`.

```typescript
import { readTokens, saveTokens } from '@/lib/refreshDropboxToken';

const tokens = await readTokens();
await saveTokens(updatedTokens);
```

#### `isTokenExpired(tokens)`

Verifica si un token ha expirado (con buffer de 5 minutos).

```typescript
import { isTokenExpired, readTokens } from '@/lib/refreshDropboxToken';

const tokens = await readTokens();
if (isTokenExpired(tokens)) {
  console.log('Token expired!');
}
```

---

## 🔄 Refresh Automático

El sistema refresca automáticamente los tokens cuando:

1. Se llama a `getValidAccessToken()`
2. El token expira en menos de 5 minutos
3. Se usa `getDropboxClient()` (que internamente llama a `getValidAccessToken()`)

**No necesitas preocuparte por refrescar tokens manualmente.** El sistema lo hace automáticamente.

---

## 🚨 Solución de Problemas

### Error: "No tokens found"

**Causa:** No se ha completado el flujo OAuth.

**Solución:**
1. Visita `/api/dropbox/authorize`
2. Autoriza la aplicación
3. Verifica que `tokens.json` se creó correctamente

### Error: "Failed to refresh token"

**Causa:** El refresh token es inválido o expiró.

**Solución:**
1. Elimina `tokens.json`
2. Vuelve a autorizar visitando `/api/dropbox/authorize`

### Error: "Missing environment variables"

**Causa:** Faltan variables en `.env`.

**Solución:**
Verifica que `.env` tenga:
- `DROPBOX_CLIENT_ID`
- `DROPBOX_CLIENT_SECRET`
- `DROPBOX_REDIRECT_URI`

### Tokens no se guardan

**Causa:** Permisos de escritura o ruta incorrecta.

**Solución:**
1. Verifica que el servidor tenga permisos de escritura en el directorio raíz
2. Revisa los logs de la consola para errores específicos

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas

- ✅ Tokens guardados en `tokens.json` (excluido de Git)
- ✅ Variables sensibles en `.env` (excluido de Git)
- ✅ Refresh automático antes de expiración
- ✅ No se exponen tokens en respuestas API
- ✅ Uso de `token_access_type=offline` para refresh tokens persistentes

### ⚠️ Recomendaciones Adicionales

Para producción, considera:

1. **Encriptar `tokens.json`** con una clave secreta
2. **Usar una base de datos** en lugar de archivos JSON
3. **Implementar rate limiting** en las rutas OAuth
4. **Agregar CSRF protection** al flujo OAuth
5. **Rotar refresh tokens** periódicamente

---

## 📚 Referencias

- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide)
- [Dropbox API Reference](https://www.dropbox.com/developers/documentation/http/documentation)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🎯 Resumen Rápido

1. **Autorizar:** Visita `/api/dropbox/authorize`
2. **Usar:** Importa `getDropboxClient()` en tus rutas API
3. **Olvidar:** El sistema maneja automáticamente el refresh de tokens

¡Listo! 🚀
