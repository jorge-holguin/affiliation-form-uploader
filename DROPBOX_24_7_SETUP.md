# 🚀 Configuración Dropbox 24/7 - Sistema de Autorización Automática

## ✅ Problema Resuelto

El sistema ahora guarda los tokens de Dropbox en **Supabase** y los refresca automáticamente cada 4 horas, permitiendo que el servicio funcione **24/7 sin intervención manual**.

### ❌ Antes (Sistema Antiguo):
- Tokens guardados en variables de entorno
- Expiraban cada 4 horas
- Requerían renovación manual
- Causaban errores 401

### ✅ Ahora (Sistema Nuevo):
- ✅ Tokens guardados en Supabase
- ✅ Renovación automática cada 4 horas
- ✅ Sin intervención manual
- ✅ Servicio 24/7 garantizado

---

## 📋 Pasos de Configuración

### 1️⃣ Verificar Tabla en Supabase

Ve a tu proyecto de Supabase: https://rmrofwmqltmhfgcbixwn.supabase.co

1. **SQL Editor** → Pega y ejecuta el contenido de: `supabase/create-dropbox-tokens-table.sql`
2. **Table Editor** → Verifica que existe la tabla `dropbox_tokens`

### 2️⃣ Variables de Entorno en Vercel

Asegúrate de tener estas variables configuradas en **Vercel**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rmrofwmqltmhfgcbixwn.supabase.co
SUPABASE_KEY=tu_supabase_service_role_key

# Dropbox OAuth
DROPBOX_CLIENT_ID=91ue1stahh5d48
DROPBOX_CLIENT_SECRET=tu_client_secret
DROPBOX_REDIRECT_URI=https://almip.com/api/dropbox/callback

# Configuración de carpeta (opcional)
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

**⚠️ IMPORTANTE:** Ya NO necesitas `DROPBOX_ACCESS_TOKEN` ni `DROPBOX_REFRESH_TOKEN` en las variables de entorno. Estos se guardan automáticamente en Supabase.

### 3️⃣ Autorizar la Aplicación (Una Sola Vez)

**Este paso solo se hace UNA vez**, después el sistema funciona automáticamente:

1. Ve a: `https://almip.com/api/dropbox/authorize`
2. Autoriza la aplicación en Dropbox
3. Serás redirigido al callback que guardará los tokens en Supabase
4. Verás un mensaje de éxito

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Dropbox authorization successful! Tokens saved.",
  "account_id": "dbid:AACvnXHSI2Eyc6ZrSUmy9dtPtIFx7RFG1ug",
  "expires_in": 14400,
  "scopes": "files.content.read files.content.write files.metadata.read"
}
```

### 4️⃣ Verificar Tokens en Supabase

1. Ve a **Table Editor** → `dropbox_tokens`
2. Deberías ver un registro con:
   - ✅ `access_token`
   - ✅ `refresh_token`
   - ✅ `expires_at` (fecha de expiración)
   - ✅ `account_id`

---

## 🔄 Cómo Funciona el Sistema Automático

```
┌─────────────────────────────────────────┐
│  Usuario sube archivo                    │
│  POST /api/upload                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  getDropboxClient()                      │
│  ├─ Lee tokens desde Supabase           │
│  ├─ Verifica si el token expiró         │
│  └─ Si expiró → refresca automáticamente│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ¿Token expiró?                          │
│  (Si faltan menos de 5 minutos)          │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
         ▼           ▼
       SI           NO
         │           │
         │           └────► Usa token actual
         │
         ▼
┌─────────────────────────────────────────┐
│  refreshDropboxToken()                   │
│  ├─ Llama a API de Dropbox              │
│  ├─ Obtiene nuevo access_token          │
│  └─ Guarda en Supabase                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Sube archivo a Dropbox ✅               │
└─────────────────────────────────────────┘
```

---

## 🧪 Probar el Sistema

### Test 1: Verificar que los tokens están en Supabase

```bash
# En Supabase SQL Editor
SELECT 
  app_name,
  account_id,
  expires_at,
  created_at,
  updated_at
FROM dropbox_tokens
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2: Subir un archivo de prueba

Ve a tu formulario: `https://almip.com`

1. Llena el formulario
2. Sube un archivo PDF
3. Verifica que se suba exitosamente

**Si funciona:** ✅ El sistema está configurado correctamente

**Si obtienes error 401:**
- ❌ Los tokens no están en Supabase
- ❌ Necesitas ejecutar el paso 3 (Autorizar la Aplicación)

### Test 3: Verificar renovación automática

```bash
# En Supabase SQL Editor
# Cambia manualmente la fecha de expiración a hace 1 hora
UPDATE dropbox_tokens
SET expires_at = NOW() - INTERVAL '1 hour',
    obtained_at = NOW() - INTERVAL '1 hour'
WHERE app_name = 'PDF_Defensor_Democracia';

# Ahora sube un archivo
# El sistema debería refrescar el token automáticamente
```

Después de subir el archivo, verifica:
```sql
SELECT 
  expires_at,
  updated_at
FROM dropbox_tokens
WHERE app_name = 'PDF_Defensor_Democracia';
```

**Deberías ver** que `expires_at` y `updated_at` se actualizaron recientemente.

---

## 🔍 Logs y Debugging

### Ver logs del sistema

Los logs de renovación de tokens aparecen en la consola:

```
✅ Access token is still valid
```
o
```
⚠️ Access token expired, refreshing...
✅ Access token refreshed successfully
✅ Tokens updated in Supabase
```

### Errores comunes

#### Error: "No tokens found. Please authorize the app first"
**Causa:** No hay tokens en Supabase  
**Solución:** Ejecuta el paso 3 (Autorizar la Aplicación)

#### Error: "Response failed with a 401 code"
**Causa:** El token en Supabase expiró y falló la renovación  
**Solución:** 
1. Verifica que `DROPBOX_CLIENT_SECRET` esté configurado en Vercel
2. Re-autoriza la aplicación (paso 3)

#### Error: "Missing SUPABASE_KEY environment variable"
**Causa:** Falta la variable de entorno en Vercel  
**Solución:** Agrega `SUPABASE_KEY` con tu service role key

---

## 🎯 Beneficios del Nuevo Sistema

| Característica | Sistema Antiguo | Sistema Nuevo |
|----------------|-----------------|---------------|
| **Duración del servicio** | 4 horas | 24/7 ♾️ |
| **Renovación de tokens** | Manual ❌ | Automática ✅ |
| **Almacenamiento** | Variables de entorno | Supabase DB |
| **Mantenimiento** | Alto 🔧 | Cero 🎉 |
| **Confiabilidad** | Baja 📉 | Alta 📈 |

---

## 📞 Soporte

Si después de seguir estos pasos aún tienes errores:

1. Verifica los logs en Vercel
2. Revisa la tabla `dropbox_tokens` en Supabase
3. Asegúrate de que todas las variables de entorno estén configuradas
4. Re-autoriza la aplicación desde el inicio

---

## ✅ Checklist Final

- [ ] Tabla `dropbox_tokens` creada en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Aplicación autorizada (una vez)
- [ ] Tokens guardados en Supabase (verificado)
- [ ] Test de upload funcionando
- [ ] Test de renovación automática funcionando

**¡Listo! Tu sistema ahora funciona 24/7 sin intervención manual.** 🎉
