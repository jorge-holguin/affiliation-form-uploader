# 🗄️ Configuración de Supabase para Tokens OAuth2

## 📋 Resumen

Esta guía te ayudará a configurar Supabase como base de datos persistente para almacenar los tokens OAuth2 de Dropbox.

**Ventajas de usar Supabase:**
- ✅ Persistencia en producción (Vercel tiene sistema de archivos efímero)
- ✅ Tokens encriptados en tránsito y en reposo
- ✅ Escalable y confiable
- ✅ Gratis hasta 500MB de base de datos
- ✅ Backups automáticos

---

## 🚀 Paso 1: Crear la Tabla en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn

2. Haz clic en **SQL Editor** en el menú lateral

3. Copia y pega el contenido del archivo `supabase/create-dropbox-tokens-table.sql`

4. Haz clic en **Run** para ejecutar el script

5. Verifica que la tabla se creó correctamente:
   - Ve a **Table Editor**
   - Deberías ver la tabla `dropbox_tokens`

---

## 🔑 Paso 2: Configurar Variables de Entorno

### Local (`.env`)

Ya está configurado en tu `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rmrofwmqltmhfgcbixwn.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Producción (Vercel)

Ejecuta estos comandos:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Pega: https://rmrofwmqltmhfgcbixwn.supabase.co

vercel env add SUPABASE_KEY production
# Pega: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcm9md21xbHRtaGZnY2JpeHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDc3ODIsImV4cCI6MjA3NTg4Mzc4Mn0.Qe2iQ00AexbWLtLju1rI6KL48pX8ohyxL2lPG1Fl8Tk
```

O configúralas desde el dashboard de Vercel:
- https://vercel.com/jorge-holguin/affiliation-form-uploader/settings/environment-variables

---

## 🧪 Paso 3: Probar la Integración

### Opción A: Desde el código

```typescript
import { supabase } from '@/lib/supabase';

// Probar conexión
const { data, error } = await supabase
  .from('dropbox_tokens')
  .select('count');

console.log('Conexión exitosa:', data);
```

### Opción B: Autorizar la app

1. Inicia tu servidor:
```bash
npm run dev
```

2. Visita: http://localhost:3000/api/dropbox/authorize

3. Autoriza la aplicación en Dropbox

4. Verifica en Supabase:
   - Ve a **Table Editor** → `dropbox_tokens`
   - Deberías ver un nuevo registro con tus tokens

---

## 📊 Estructura de la Tabla

```sql
CREATE TABLE dropbox_tokens (
  id BIGSERIAL PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL DEFAULT 'PDF_Defensor_Democracia',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_in INTEGER NOT NULL,
  token_type VARCHAR(50) NOT NULL DEFAULT 'bearer',
  scope TEXT NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  uid VARCHAR(255),
  obtained_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Campos Importantes

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `access_token` | Token de acceso (4 horas) | `sl.u.ABC123...` |
| `refresh_token` | Token de refresh (permanente) | `EZVYX5Jcrj8...` |
| `expires_in` | Duración en segundos | `14400` (4 horas) |
| `expires_at` | Timestamp de expiración | `2025-10-13T05:00:00Z` |
| `obtained_at` | Timestamp de obtención | `2025-10-13T01:00:00Z` |
| `account_id` | ID de cuenta Dropbox | `dbid:AAH4f99...` |

---

## 🔄 Flujo de Tokens con Supabase

```
1. Usuario autoriza la app
   ↓
2. /api/dropbox/callback recibe el código
   ↓
3. Intercambia código por tokens
   ↓
4. saveTokens() guarda en Supabase
   ↓
5. Tu código llama getDropboxClient()
   ↓
6. readTokens() lee desde Supabase
   ↓
7. Si expiró, refreshDropboxToken()
   ↓
8. saveTokens() actualiza en Supabase
   ↓
9. ✅ Cliente Dropbox listo
```

---

## 🔒 Seguridad

### Row Level Security (RLS)

La tabla tiene RLS habilitado con una política permisiva para desarrollo:

```sql
CREATE POLICY "Enable all access for anon" ON dropbox_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Para Producción (Recomendado)

Cambia la política para ser más restrictiva:

```sql
-- Eliminar política permisiva
DROP POLICY "Enable all access for anon" ON dropbox_tokens;

-- Crear política restrictiva
CREATE POLICY "Enable access for service role only" ON dropbox_tokens
  FOR ALL
  USING (auth.role() = 'service_role');
```

Luego usa el **Service Role Key** en lugar del **Anon Key**:

```env
# En .env y Vercel
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Service Role Key
```

⚠️ **Importante:** El Service Role Key tiene acceso completo a la base de datos. Nunca lo expongas en el frontend.

---

## 🧹 Mantenimiento

### Ver Tokens Actuales

```sql
SELECT 
  id,
  app_name,
  account_id,
  expires_at,
  created_at,
  updated_at
FROM dropbox_tokens
ORDER BY created_at DESC;
```

### Eliminar Tokens Antiguos

```sql
-- Eliminar tokens de hace más de 30 días
DELETE FROM dropbox_tokens
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Ver Historial de Refreshes

```sql
SELECT 
  id,
  account_id,
  obtained_at,
  expires_at,
  updated_at
FROM dropbox_tokens
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 📈 Monitoreo

### Verificar Última Actualización

```sql
SELECT 
  app_name,
  account_id,
  expires_at,
  updated_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 AS hours_until_expiry
FROM dropbox_tokens
WHERE app_name = 'PDF_Defensor_Democracia'
ORDER BY updated_at DESC
LIMIT 1;
```

### Alertas Recomendadas

Configura alertas en Supabase para:
- ✅ Tokens que no se han actualizado en 24 horas
- ✅ Errores de refresh
- ✅ Múltiples intentos de autorización

---

## 🔧 Troubleshooting

### Error: "relation dropbox_tokens does not exist"

**Solución:** Ejecuta el script SQL en el SQL Editor de Supabase.

### Error: "Invalid API key"

**Solución:** Verifica que `SUPABASE_KEY` sea correcto en `.env`.

### Error: "Row Level Security policy violation"

**Solución:** Verifica que la política RLS permita acceso con tu key.

### Tokens no se guardan

**Solución:** 
1. Verifica la conexión a Supabase
2. Revisa los logs en Supabase Dashboard → Logs
3. Verifica que las variables de entorno estén configuradas

---

## 📚 Recursos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn
- **Documentación Supabase:** https://supabase.com/docs
- **SQL Editor:** https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/sql
- **Table Editor:** https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/editor

---

## ✅ Checklist de Setup

- [ ] Tabla `dropbox_tokens` creada en Supabase
- [ ] Variables de entorno configuradas localmente
- [ ] Variables de entorno configuradas en Vercel
- [ ] Autorización de Dropbox completada
- [ ] Tokens guardados en Supabase verificados
- [ ] Auto-refresh probado
- [ ] Política RLS configurada para producción

---

**Implementado:** 2025-10-13  
**Proyecto:** democracy-corp  
**Base de datos:** Supabase (rmrofwmqltmhfgcbixwn)
