# 🔐 Configuración de Tokens de Dropbox

## Problema: Token Expirado (Error 401)

Los tokens de acceso de Dropbox expiran cada **4 horas**. Este documento explica cómo solucionarlo.

---

## ✅ Solución Rápida (Temporal)

Si solo necesitas que funcione ahora:

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Selecciona tu aplicación
3. Ve a la pestaña **"Settings"**
4. Busca la sección **"OAuth 2"**
5. Haz clic en **"Generate"** para crear un nuevo Access Token
6. Copia el token generado
7. Actualiza tu archivo `.env.local`:
   ```env
   DROPBOX_ACCESS_TOKEN=tu_nuevo_token_aqui
   ```
8. Reinicia el servidor de desarrollo

⚠️ **Nota:** Este token expirará en 4 horas y tendrás que repetir el proceso.

---

## 🔄 Solución Permanente (Refresh Tokens)

Para que los tokens se renueven automáticamente, necesitas configurar OAuth 2.0 con refresh tokens:

### Paso 1: Configurar App de Dropbox

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Selecciona tu aplicación
3. En **"Settings"**, busca **"OAuth 2"**
4. Asegúrate de tener estos permisos habilitados:
   - `files.content.write`
   - `files.content.read`
   - `sharing.write` (para links compartidos)

### Paso 2: Obtener Refresh Token

Necesitas hacer el flujo OAuth completo una vez:

1. Construye esta URL (reemplaza `YOUR_APP_KEY`):
   ```
   https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&token_access_type=offline&response_type=code
   ```

2. Abre la URL en tu navegador
3. Autoriza la aplicación
4. Copia el **código** que aparece en la URL de redirección

5. Intercambia el código por tokens usando curl (reemplaza los valores):
   ```bash
   curl https://api.dropbox.com/oauth2/token \
     -d code=TU_CODIGO_AQUI \
     -d grant_type=authorization_code \
     -d client_id=TU_APP_KEY \
     -d client_secret=TU_APP_SECRET
   ```

6. La respuesta incluirá:
   ```json
   {
     "access_token": "sl.xxx...",
     "token_type": "bearer",
     "expires_in": 14400,
     "refresh_token": "xxx...",
     "scope": "...",
     "uid": "...",
     "account_id": "..."
   }
   ```

### Paso 3: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local`:

```env
# Credenciales de la App
DROPBOX_CLIENT_ID=tu_app_key
DROPBOX_CLIENT_SECRET=tu_app_secret

# Tokens (del paso anterior)
DROPBOX_ACCESS_TOKEN=sl.xxx...
DROPBOX_REFRESH_TOKEN=xxx...

# Configuración
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

### Paso 4: Reiniciar Servidor

```bash
npm run dev
```

---

## 🔍 Cómo Funciona

El sistema ahora:

1. **Verifica** si el token está expirado antes de cada operación
2. **Refresca** automáticamente el token usando el refresh token
3. **Guarda** los nuevos tokens en `.dropbox-tokens.json`
4. **Reutiliza** el token válido en siguientes requests

### Archivo de Tokens

El archivo `.dropbox-tokens.json` se crea automáticamente y contiene:

```json
{
  "access_token": "sl.xxx...",
  "refresh_token": "xxx...",
  "expires_at": 1759576139355
}
```

⚠️ **Este archivo está en `.gitignore`** - no se subirá a Git por seguridad.

---

## 🧪 Verificar que Funciona

1. Reinicia el servidor
2. Intenta subir un archivo
3. Revisa los logs del servidor:
   - Si ves `🔄 Access token expirado, refrescando...` → Está funcionando
   - Si ves `⚠️ Usando access token sin refresh...` → Falta configurar refresh token

---

## 🆘 Troubleshooting

### Error: "No se encontró DROPBOX_ACCESS_TOKEN ni DROPBOX_REFRESH_TOKEN"
- Verifica que tu archivo `.env.local` existe
- Asegúrate de que las variables están correctamente definidas
- Reinicia el servidor después de modificar `.env.local`

### Error: "Failed to refresh token"
- Verifica que `DROPBOX_CLIENT_ID` y `DROPBOX_CLIENT_SECRET` sean correctos
- Asegúrate de que el refresh token no haya sido revocado
- Genera un nuevo refresh token siguiendo el Paso 2

### Los archivos se suben pero no se genera link compartido
- Verifica que tu app tenga el permiso `sharing.write`
- Revisa los logs del servidor para ver el error específico

---

## 📚 Referencias

- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide)
- [Dropbox API Explorer](https://dropbox.github.io/dropbox-api-v2-explorer/)
- [Token Types](https://developers.dropbox.com/oauth-guide#token-types)
