# 🚨 PASOS INMEDIATOS - Resolver Error 401

## ✅ Cambios Realizados

He modificado el código para que el sistema use **Supabase** en lugar de variables de entorno. Ahora los tokens se guardan y renuevan automáticamente.

**Archivo modificado:**
- `app/api/upload/route.ts` - Ahora usa `getDropboxClient()` que lee desde Supabase

---

## 📝 PASOS A SEGUIR (EN ORDEN)

### 1️⃣ Despliega los Cambios a Vercel

```bash
# Asegúrate de estar en la carpeta del proyecto
cd c:\Users\Jorge-Chosica\Documents\democracy-corp

# Sube los cambios a git
git add .
git commit -m "Fix: Usar Supabase para tokens de Dropbox - Sistema 24/7"
git push
```

**⏱️ Espera** a que Vercel complete el despliegue (2-3 minutos)

---

### 2️⃣ Verifica Variables de Entorno en Vercel

Ve a: https://vercel.com/tu-proyecto/settings/environment-variables

Asegúrate de tener estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rmrofwmqltmhfgcbixwn.supabase.co
SUPABASE_KEY=tu_service_role_key_de_supabase
DROPBOX_CLIENT_ID=91ue1stahh5d48
DROPBOX_CLIENT_SECRET=tu_client_secret
DROPBOX_REDIRECT_URI=https://almip.com/api/dropbox/callback
```

**⚠️ IMPORTANTE:** Si agregas o cambias variables, debes hacer **"Redeploy"** en Vercel.

---

### 3️⃣ Verifica la Tabla en Supabase

1. Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn
2. **SQL Editor** → Nuevo query
3. Pega este código:

```sql
-- Verificar si la tabla existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'dropbox_tokens'
);
```

**Si devuelve `false`:**
1. Abre: `supabase/create-dropbox-tokens-table.sql`
2. Copia todo el contenido
3. Pégalo en SQL Editor de Supabase
4. Ejecuta el query

---

### 4️⃣ Autoriza la Aplicación (Solo Una Vez)

Visita: **https://almip.com/api/dropbox/authorize**

Esto te redirigirá a Dropbox para autorizar la app.

**✅ Mensaje de éxito esperado:**
```json
{
  "success": true,
  "message": "Dropbox authorization successful! Tokens saved.",
  "account_id": "dbid:...",
  "expires_in": 14400
}
```

**❌ Si ves un error:**
- Verifica que las variables de entorno estén correctas
- Verifica que la tabla `dropbox_tokens` exista
- Revisa los logs en Vercel

---

### 5️⃣ Verifica que los Tokens se Guardaron

En Supabase SQL Editor:

```sql
SELECT 
  app_name,
  account_id,
  expires_at,
  created_at
FROM dropbox_tokens
ORDER BY created_at DESC
LIMIT 1;
```

**Deberías ver:**
- `app_name`: "PDF_Defensor_Democracia"
- `account_id`: "dbid:AACvnXHSI2Eyc6ZrSUmy9dtPtIFx7RFG1ug"
- `expires_at`: Una fecha en el futuro (~4 horas desde now)

---

### 6️⃣ Prueba el Upload

1. Ve a: https://almip.com
2. Llena el formulario
3. Sube un archivo PDF
4. **Debe funcionar sin error 401** ✅

---

## 🔍 Verificar Estado del Sistema

Puedes verificar el estado en cualquier momento visitando:

**https://almip.com/api/dropbox/status**

Ejemplo de respuesta exitosa:
```json
{
  "status": "operational",
  "message": "System operational - tokens valid",
  "authorized": true,
  "token_info": {
    "account_id": "dbid:...",
    "expires_at": "2024-10-21T05:00:00Z",
    "is_expired": false,
    "hours_remaining": "3.85"
  }
}
```

---

## 🚨 Solución Rápida si Sigue Fallando

### Caso 1: Error "No tokens found"
```bash
# Vuelve a autorizar la app
# Visita: https://almip.com/api/dropbox/authorize
```

### Caso 2: Error "Missing SUPABASE_KEY"
```bash
# En Vercel, agrega la variable de entorno
SUPABASE_KEY=tu_service_role_key

# Luego haz Redeploy
```

### Caso 3: Error "Table does not exist"
```bash
# Ejecuta el SQL en Supabase:
# Archivo: supabase/create-dropbox-tokens-table.sql
```

### Caso 4: Sigue obteniendo 401
```bash
# 1. Verifica que desplegaste los cambios a Vercel
# 2. Verifica variables de entorno en Vercel
# 3. Re-autoriza la aplicación
# 4. Revisa los logs en Vercel para ver el error exacto
```

---

## 📊 Cronograma de Renovación Automática

```
Autorización Inicial
    ↓
Token válido por 4 horas
    ↓
Después de ~3h 55m (cuando quedan 5 min)
    ↓
Sistema detecta que va a expirar
    ↓
Refresca automáticamente
    ↓
Guarda nuevo token en Supabase
    ↓
Token válido por otras 4 horas
    ↓
(Se repite indefinidamente) ♾️
```

---

## 📞 Siguiente Paso

**Ejecuta el paso 1** (desplegar a Vercel) y luego continúa con los demás pasos en orden.

Si tienes algún error, revisa los logs en:
- **Vercel:** https://vercel.com/tu-proyecto/deployments
- **Supabase:** https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/logs/explorer

---

## ✅ ¿Cuándo Está Listo?

El sistema está 100% funcional cuando:

- ✅ Despliegue en Vercel completado
- ✅ Variables de entorno configuradas
- ✅ Tabla `dropbox_tokens` existe en Supabase
- ✅ Aplicación autorizada (tokens guardados)
- ✅ Upload funciona sin error 401
- ✅ `/api/dropbox/status` muestra "operational"

**¡Entonces tu sistema funcionará 24/7 sin intervención manual!** 🎉
