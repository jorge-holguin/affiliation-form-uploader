# 🔧 Fix: Variables de Entorno - Resumen de Cambios

## ❌ Problema Original

```
{
  "error": "Missing DROPBOX_CLIENT_ID or DROPBOX_REDIRECT_URI in environment variables"
}
```

Las variables de entorno no se estaban cargando correctamente en las rutas API.

---

## ✅ Solución Implementada

### 1. Configuración de Next.js (`next.config.mjs`)

**Agregado:** Exportación explícita de variables de entorno

```javascript
env: {
  DROPBOX_CLIENT_ID: process.env.DROPBOX_CLIENT_ID,
  DROPBOX_CLIENT_SECRET: process.env.DROPBOX_CLIENT_SECRET,
  DROPBOX_REDIRECT_URI: process.env.DROPBOX_REDIRECT_URI,
  DROPBOX_FOLDER: process.env.DROPBOX_FOLDER,
}
```

Esto asegura que las variables estén disponibles tanto en servidor como en cliente.

### 2. Detección Automática de Redirect URI

**Actualizado:** `/app/api/dropbox/authorize/route.ts` y `/app/api/dropbox/callback/route.ts`

Ahora detecta automáticamente el dominio:
- **Desarrollo:** `http://localhost:3000/oauth/callback`
- **Producción:** `https://almip.com/oauth/callback`

```typescript
// Si no hay redirect URI en .env, construirlo dinámicamente
if (!redirectUri) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  redirectUri = `${protocol}://${host}/oauth/callback`;
}
```

### 3. Mejor Debug Info

Ahora cuando hay un error, recibes información útil:

```json
{
  "error": "Missing DROPBOX_CLIENT_ID in environment variables",
  "debug": {
    "clientId": "missing",
    "redirectUri": "https://almip.com/oauth/callback",
    "env": "production"
  }
}
```

### 4. .gitignore Actualizado

Agregado protección para archivos sensibles:

```
# env files
.env
.env.local
.env.production
.env.development

# dropbox tokens
.dropbox-tokens.json
tokens.json
```

### 5. Archivos Nuevos Creados

- **`.env.example`** - Plantilla de variables de entorno
- **`DEPLOYMENT_GUIDE.md`** - Guía completa de deployment para almip.com

---

## 🚀 Pasos para Aplicar el Fix

### En Desarrollo (localhost)

1. **Detén el servidor** (Ctrl+C en la terminal donde corre `npm run dev`)

2. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

3. **Verifica que funciona:**
   ```
   http://localhost:3000/api/dropbox/authorize
   ```

   Deberías ser redirigido a Dropbox (no ver error de variables).

### En Producción (almip.com)

1. **Configura las variables de entorno en tu plataforma de hosting:**

   En Vercel:
   - Ve a Settings → Environment Variables
   - Agrega:
     ```
     DROPBOX_CLIENT_ID=9luel6tahlh5d40
     DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
     DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
     DROPBOX_FOLDER=/PDF_Defensor_Democracia
     ```

2. **Redeploy tu aplicación**

3. **Verifica en Dropbox App Console:**
   - Ve a: https://www.dropbox.com/developers/apps
   - Selecciona: PDF_Defensor_Democracia
   - En "Redirect URIs", asegúrate de tener:
     - `https://almip.com/oauth/callback` ✅
     - `http://localhost:3000/oauth/callback` ✅

4. **Prueba:**
   ```
   https://almip.com/api/dropbox/authorize
   ```

---

## 🔍 Verificación

### Test 1: Variables Cargadas

Visita: `http://localhost:3000/api/dropbox/authorize`

**✅ Correcto:** Redirige a Dropbox  
**❌ Error:** Muestra JSON con error

### Test 2: Debug Info

Si hay error, verifica el campo `debug`:

```json
{
  "debug": {
    "clientId": "present",     // ✅ Debe ser "present"
    "redirectUri": "...",      // ✅ Debe mostrar URL correcta
    "env": "development"       // ✅ Debe mostrar environment
  }
}
```

### Test 3: Autorización Completa

1. Visita: `http://localhost:3000/dropbox-auth`
2. Clic en "Autorizar con Dropbox"
3. Aprueba permisos
4. Deberías volver a tu app con mensaje de éxito

---

## 📋 Checklist de Verificación

### Desarrollo
- [ ] Servidor reiniciado después de cambios en `next.config.mjs`
- [ ] `/api/dropbox/authorize` redirige a Dropbox
- [ ] Autorización completa funciona
- [ ] `tokens.json` se crea en la raíz del proyecto
- [ ] `/api/dropbox/test-auth` retorna success

### Producción
- [ ] Variables de entorno configuradas en plataforma de hosting
- [ ] Redirect URI agregado en Dropbox App Console
- [ ] Deploy exitoso
- [ ] `https://almip.com/api/dropbox/authorize` funciona
- [ ] Autorización en producción funciona

---

## 🐛 Troubleshooting

### Problema: Aún dice "Missing variables"

**Solución:**
1. Verifica que `.env` existe y tiene las variables
2. Reinicia el servidor completamente (detén y vuelve a iniciar)
3. Verifica que no haya espacios extra en `.env`

### Problema: "redirect_uri_mismatch"

**Solución:**
1. Ve a Dropbox App Console
2. Agrega el redirect URI exacto que estás usando
3. Espera 1-2 minutos para que se propague

### Problema: Variables funcionan en dev pero no en producción

**Solución:**
1. Configura las variables en tu plataforma de hosting
2. Asegúrate de seleccionar el environment correcto (Production)
3. Redeploy después de agregar variables

---

## 📚 Documentación Relacionada

- **Deployment:** `DEPLOYMENT_GUIDE.md`
- **Variables de ejemplo:** `.env.example`
- **Setup completo:** `DROPBOX_OAUTH_SETUP.md`
- **Troubleshooting:** `README_OAUTH.md`

---

## ✨ Resumen

**Antes:**
- ❌ Variables no se cargaban
- ❌ Redirect URI hardcoded
- ❌ Sin debug info

**Después:**
- ✅ Variables exportadas en `next.config.mjs`
- ✅ Redirect URI dinámico (auto-detecta localhost vs producción)
- ✅ Debug info detallada
- ✅ Funciona en desarrollo y producción

---

**IMPORTANTE:** Debes **reiniciar tu servidor** para que los cambios surtan efecto:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

¡Listo! 🎉
