# 🔧 Solución al Error 401 en Vercel

## 🔴 Error Actual

```
"error": "invalid_grant"
"error_description": "refresh token is malformed"
```

**Causa:** El refresh token en Vercel está mal formado (probablemente se copiaron espacios o caracteres extra).

---

## ✅ Solución Rápida (5 minutos)

### Opción 1: Usar Solo Access Token (Más Simple)

1. **Genera un nuevo token en Dropbox:**
   - Ve a https://www.dropbox.com/developers/apps
   - Selecciona tu app
   - Settings → OAuth 2 → **Generate Access Token**
   - Copia el token generado

2. **Actualiza Vercel:**
   - Ve a https://vercel.com/dashboard
   - Selecciona **almip.com**
   - Settings → Environment Variables
   - Busca `DROPBOX_ACCESS_TOKEN` → Edit → Pega el nuevo token
   - **ELIMINA** la variable `DROPBOX_REFRESH_TOKEN` (haz clic en el menú `⋮` → Delete)

3. **Redeploy:**
   - Deployments → Menú `⋮` → Redeploy

⚠️ **Nota:** Este token expirará en 4 horas. Tendrás que regenerarlo manualmente.

---

## ✅ Solución Permanente (15 minutos)

### Generar Nuevo Refresh Token

Ejecuta este comando en tu terminal:

```bash
npm run refresh-token
```

Esto abrirá un asistente interactivo que te guiará paso a paso:

1. Te dará una URL para autorizar la app
2. Te pedirá el código de autorización
3. Generará automáticamente los nuevos tokens
4. Te mostrará exactamente qué copiar y dónde

### Actualizar en Vercel

Después de obtener los nuevos tokens:

1. Ve a https://vercel.com/dashboard → **almip.com**
2. Settings → Environment Variables
3. Actualiza estas dos variables:
   - `DROPBOX_ACCESS_TOKEN` → Nuevo valor
   - `DROPBOX_REFRESH_TOKEN` → Nuevo valor
4. **Importante:** Al pegar, asegúrate de NO incluir espacios al inicio o final
5. Redeploy

---

## 🔍 Verificar Variables en Vercel

Para asegurarte de que las variables están bien configuradas:

### Checklist de Variables

Ve a Vercel → Settings → Environment Variables y verifica:

- [ ] `DROPBOX_CLIENT_ID` = `9luel6tahlh5d40`
- [ ] `DROPBOX_CLIENT_SECRET` = `933ku5zxgjtwoiz`
- [ ] `DROPBOX_ACCESS_TOKEN` = (token largo, empieza con `sl.`)
- [ ] `DROPBOX_REFRESH_TOKEN` = (token corto, ~40 caracteres)
- [ ] `DROPBOX_FOLDER` = `/PDF_Defensor_Democracia`

### Verificar que NO hay espacios

Al editar cada variable en Vercel:
1. Haz clic en **Edit**
2. Selecciona TODO el valor (Ctrl+A)
3. Copia a un editor de texto
4. Verifica que NO haya espacios al inicio o final
5. Si hay espacios, elimínalos
6. Copia el valor limpio y pégalo de nuevo en Vercel

---

## 🧪 Probar en Local Primero

Antes de hacer deploy, prueba que funciona en local:

```bash
# 1. Actualiza tu .env con los nuevos tokens
# 2. Reinicia el servidor
npm run dev

# 3. Prueba subir un archivo en http://localhost:3000
```

Si funciona en local, funcionará en Vercel.

---

## 📊 Ver Logs en Vercel

Para diagnosticar problemas:

1. Ve a Vercel → **almip.com**
2. Deployments → Selecciona el deployment activo
3. Functions → `/api/upload`
4. Aquí verás los logs en tiempo real

Busca estos mensajes:
- ✅ `Usando token en cache (válido)` → Funcionando
- ✅ `Token refrescado exitosamente` → Funcionando
- ⚠️ `Usando DROPBOX_ACCESS_TOKEN como fallback` → Refresh token falló, usando fallback
- ❌ `Error refrescando token` → Problema con el refresh token

---

## 🆘 Si Nada Funciona

### Plan B: Configuración Mínima

1. **Elimina todas las variables de Dropbox en Vercel**
2. **Genera un token nuevo en Dropbox App Console**
3. **Agrega SOLO estas 2 variables en Vercel:**
   ```
   DROPBOX_ACCESS_TOKEN=tu_nuevo_token
   DROPBOX_FOLDER=/PDF_Defensor_Democracia
   ```
4. **Redeploy**

Esto funcionará por 4 horas. Luego tendrás que regenerar el token.

---

## 📞 Comandos Útiles

```bash
# Ver tus variables de entorno actuales
npm run show:env

# Generar nuevo refresh token (interactivo)
npm run refresh-token

# Probar conexión con Dropbox
npm run test:dropbox
```

---

## 🎯 Resumen de Acciones

1. **Ahora mismo:** Usa la Opción 1 (Solo Access Token) para que funcione YA
2. **Después:** Usa `npm run refresh-token` para configurar refresh automático
3. **Siempre:** Verifica que no haya espacios al copiar tokens en Vercel

---

## ✅ Checklist Final

Antes de cerrar este issue, verifica:

- [ ] La app funciona en https://almip.com/
- [ ] Puedes subir archivos sin error 401
- [ ] Los archivos aparecen en Dropbox
- [ ] Las variables están configuradas en Vercel
- [ ] Has hecho commit de los cambios de código
- [ ] Has actualizado tu `.env` local con los nuevos tokens
