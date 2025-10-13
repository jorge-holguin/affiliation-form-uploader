# 🚀 Guía de Deployment - almip.com

## 📋 Variables de Entorno para Producción

### En tu plataforma de hosting (Vercel/Netlify/etc.)

Configura estas variables de entorno:

```bash
DROPBOX_CLIENT_ID=9luel6tahlh5d40
DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

---

## 🔧 Configuración en Dropbox

### 1. Actualizar Redirect URIs en Dropbox App Console

Ve a: https://www.dropbox.com/developers/apps

1. Selecciona tu app: **PDF_Defensor_Democracia**
2. En la sección **OAuth 2**
3. En **Redirect URIs**, asegúrate de tener:
   - ✅ `https://almip.com/oauth/callback` (producción)
   - ✅ `http://localhost:3000/oauth/callback` (desarrollo)

---

## 📦 Deployment en Vercel

### Opción 1: Desde la UI de Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `DROPBOX_CLIENT_ID` | `9luel6tahlh5d40` | Production, Preview, Development |
| `DROPBOX_CLIENT_SECRET` | `933ku5zxgjtwoiz` | Production, Preview, Development |
| `DROPBOX_REDIRECT_URI` | `https://almip.com/oauth/callback` | Production |
| `DROPBOX_FOLDER` | `/PDF_Defensor_Democracia` | Production, Preview, Development |

4. Redeploy tu aplicación

### Opción 2: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Agregar variables de entorno
vercel env add DROPBOX_CLIENT_ID production
# Pega: 9luel6tahlh5d40

vercel env add DROPBOX_CLIENT_SECRET production
# Pega: 933ku5zxgjtwoiz

vercel env add DROPBOX_REDIRECT_URI production
# Pega: https://almip.com/oauth/callback

vercel env add DROPBOX_FOLDER production
# Pega: /PDF_Defensor_Democracia

# Deploy
vercel --prod
```

---

## 🔄 Después del Deployment

### 1. Verificar Variables

Visita: `https://almip.com/api/dropbox/authorize`

Si ves un error con información de debug, revisa qué variable falta.

### 2. Autorizar la Aplicación

Una vez que las variables estén configuradas:

1. Visita: `https://almip.com/dropbox-auth`
2. Haz clic en **"Autorizar con Dropbox"**
3. Aprueba los permisos en Dropbox
4. Serás redirigido de vuelta a tu app
5. Los tokens se guardarán en `tokens.json`

### 3. Probar la Conexión

Visita: `https://almip.com/api/dropbox/test-auth`

Deberías ver:
```json
{
  "success": true,
  "message": "Dropbox authentication is working correctly!",
  "account": { ... },
  "files": [ ... ]
}
```

---

## 🐛 Troubleshooting en Producción

### Error: "Missing environment variables"

**Causa:** Las variables no están configuradas en tu plataforma de hosting.

**Solución:**
1. Verifica en Settings → Environment Variables
2. Asegúrate de que estén en el environment correcto (Production)
3. Redeploy después de agregar variables

### Error: "redirect_uri_mismatch"

**Causa:** El redirect URI no coincide con el configurado en Dropbox.

**Solución:**
1. Ve a Dropbox App Console
2. Verifica que `https://almip.com/oauth/callback` esté en la lista
3. Asegúrate de que no haya espacios o caracteres extra

### Error: "invalid_client"

**Causa:** CLIENT_ID o CLIENT_SECRET incorrectos.

**Solución:**
1. Verifica los valores en Dropbox App Console
2. Actualiza las variables de entorno
3. Redeploy

### tokens.json no persiste entre deploys

**Causa:** Vercel y otras plataformas serverless tienen filesystem efímero.

**Solución para producción:**

Opción 1: Usar Vercel KV (Redis)
```typescript
// lib/tokenStorage.ts
import { kv } from '@vercel/kv';

export async function saveTokens(tokens: DropboxTokens) {
  await kv.set('dropbox_tokens', tokens);
}

export async function readTokens(): Promise<DropboxTokens | null> {
  return await kv.get('dropbox_tokens');
}
```

Opción 2: Usar Base de Datos (PostgreSQL, MongoDB, etc.)
```typescript
// lib/tokenStorage.ts
import { prisma } from './prisma';

export async function saveTokens(tokens: DropboxTokens) {
  await prisma.settings.upsert({
    where: { key: 'dropbox_tokens' },
    update: { value: JSON.stringify(tokens) },
    create: { key: 'dropbox_tokens', value: JSON.stringify(tokens) },
  });
}
```

---

## 📊 Verificación Post-Deployment

### Checklist

- [ ] Variables de entorno configuradas en plataforma de hosting
- [ ] Redirect URI agregado en Dropbox App Console
- [ ] Aplicación deployada exitosamente
- [ ] `/api/dropbox/authorize` funciona (no muestra error de variables)
- [ ] Autorización completada en Dropbox
- [ ] `/api/dropbox/test-auth` retorna success
- [ ] Subida de archivos funciona
- [ ] Listado de archivos funciona

---

## 🔐 Seguridad en Producción

### Variables Sensibles

**NUNCA** expongas estas variables en el código:
- ❌ `DROPBOX_CLIENT_SECRET`
- ❌ `DROPBOX_ACCESS_TOKEN`
- ❌ `DROPBOX_REFRESH_TOKEN`

**Siempre** usa variables de entorno del servidor.

### HTTPS

Asegúrate de que tu sitio use HTTPS:
- ✅ `https://almip.com` 
- ❌ `http://almip.com`

Dropbox OAuth requiere HTTPS en producción.

---

## 📝 Comandos Útiles

```bash
# Build local (para probar antes de deploy)
npm run build
npm start

# Deploy a Vercel
vercel --prod

# Ver logs en Vercel
vercel logs

# Ver variables de entorno
vercel env ls
```

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de tu plataforma de hosting
2. Visita `/api/dropbox/authorize` para ver el debug info
3. Verifica la configuración en Dropbox App Console
4. Consulta `OAUTH_IMPLEMENTATION_SUMMARY.md`

---

**Deployment exitoso:** ✅  
**URL de producción:** https://almip.com  
**Panel OAuth:** https://almip.com/dropbox-auth
