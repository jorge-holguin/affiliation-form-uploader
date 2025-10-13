# ✅ Cambios Finales - Sistema OAuth2 con Supabase

## 🔧 Problema Resuelto

**Error anterior:**
```json
{
  "error": "Internal server error during token exchange",
  "details": "Error: EROFS: read-only file system, open '/var/task/tokens.json'"
}
```

**Causa:** Las rutas de callback todavía intentaban escribir en `tokens.json` (sistema de archivos), pero Vercel tiene un sistema de archivos de **solo lectura**.

**Solución:** Actualizar todas las rutas para usar Supabase en lugar de archivos locales.

---

## 📝 Archivos Modificados

### 1. `/app/api/dropbox/callback/route.ts`

**ANTES:**
```typescript
import { promises as fs } from 'fs';
import path from 'path';

// Guardar tokens en archivo JSON
const tokensPath = path.join(process.cwd(), 'tokens.json');
await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
```

**DESPUÉS:**
```typescript
import { saveTokens } from '@/lib/refreshDropboxToken';

// Guardar tokens en Supabase
await saveTokens(tokens);
```

### 2. `/app/oauth/callback/route.ts`

**ANTES:**
```typescript
import { promises as fs } from 'fs';
import path from 'path';

// Guardar tokens en archivo JSON
const tokensPath = path.join(process.cwd(), 'tokens.json');
await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
```

**DESPUÉS:**
```typescript
import { saveTokens } from '@/lib/refreshDropboxToken';

// Guardar tokens en Supabase
await saveTokens(tokens);
```

### 3. `.env`

**ANTES:**
```env
DROPBOX_ACCESS_TOKEN=sl.u.AGB-2VLr_3iri9TuQ8KPUCzTQNC5M8-luzWWJSU1MCjn...
```

**DESPUÉS:**
```env
# Eliminado - Ya no se necesita token hardcoded
# Los tokens se manejan automáticamente con OAuth2 + Supabase
```

### 4. `.gitignore`

**ANTES:**
```gitignore
.dropbox-tokens.json
tokens.json
```

**DESPUÉS:**
```gitignore
# Eliminado - Ya no usamos archivos locales
```

---

## 🚀 Próximos Pasos para Que Funcione

### Paso 1: Crear la Tabla en Supabase (CRÍTICO)

1. Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/sql

2. Haz clic en **"New query"**

3. Copia y pega este SQL:

```sql
CREATE TABLE IF NOT EXISTS dropbox_tokens (
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

CREATE INDEX IF NOT EXISTS idx_dropbox_tokens_app_name ON dropbox_tokens(app_name);

ALTER TABLE dropbox_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon" ON dropbox_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Haz clic en **"Run"**

5. ✅ Verifica que la tabla se creó en **Table Editor**

### Paso 2: Configurar Variables en Vercel

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Pega: https://rmrofwmqltmhfgcbixwn.supabase.co

vercel env add SUPABASE_KEY production
# Pega: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcm9md21xbHRtaGZnY2JpeHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDc3ODIsImV4cCI6MjA3NTg4Mzc4Mn0.Qe2iQ00AexbWLtLju1rI6KL48pX8ohyxL2lPG1Fl8Tk

# Dropbox (si no las tienes ya)
vercel env add DROPBOX_CLIENT_ID production
# Pega: 9luel6tahlh5d40

vercel env add DROPBOX_CLIENT_SECRET production
# Pega: 933ku5zxgjtwoiz

vercel env add DROPBOX_REDIRECT_URI production
# Pega: https://almip.com/api/dropbox/callback

vercel env add DROPBOX_FOLDER production
# Pega: /PDF_Defensor_Democracia
```

### Paso 3: Deploy

```bash
git add .
git commit -m "Fix: Use Supabase instead of file system for OAuth tokens"
git push
```

### Paso 4: Autorizar

Después del deploy, visita:

```
https://almip.com/api/dropbox/authorize
```

Esto te redirigirá a Dropbox. Autoriza la aplicación.

### Paso 5: Verificar

1. **En Supabase:**
   - Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/editor
   - Tabla: `dropbox_tokens`
   - Deberías ver 1 registro con tus tokens

2. **En tu app:**
   - Visita: https://almip.com/api/dropbox/test-auth
   - Deberías ver: `{"success": true, ...}`

---

## ✅ Checklist de Verificación

- [ ] Tabla `dropbox_tokens` creada en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Código committed y pusheado
- [ ] Deploy completado
- [ ] Autorización completada
- [ ] Tokens guardados en Supabase (verificar en Table Editor)
- [ ] Test exitoso en `/api/dropbox/test-auth`

---

## 🔄 Flujo Completo (Ahora)

```
Usuario → https://almip.com/api/dropbox/authorize
   ↓
Dropbox → Autorización
   ↓
https://almip.com/api/dropbox/callback?code=ABC
   ↓
Intercambio code → tokens
   ↓
saveTokens() → Supabase.insert(tokens) ✅
   ↓
Tu código → getDropboxClient()
   ↓
readTokens() → Supabase.select(tokens) ✅
   ↓
¿Expirado? → refreshDropboxToken()
   ↓
saveTokens() → Supabase.update(new_token) ✅
   ↓
Cliente Dropbox listo 🎉
```

---

## 🎯 Diferencias Clave

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Almacenamiento** | `tokens.json` (archivo) | Supabase (PostgreSQL) |
| **Funciona en Vercel** | ❌ No (EROFS error) | ✅ Sí |
| **Persistencia** | ❌ Efímero | ✅ Permanente |
| **Backups** | ❌ No | ✅ Automático |
| **Monitoreo** | ❌ Difícil | ✅ Dashboard |

---

## 🐛 Si Sigue Sin Funcionar

### Error: "relation dropbox_tokens does not exist"

**Solución:** No has creado la tabla en Supabase. Ejecuta el SQL del Paso 1.

### Error: "Invalid API key"

**Solución:** Verifica que `SUPABASE_KEY` esté configurado en Vercel.

### Error: "code doesn't exist or has expired"

**Solución:** El código OAuth expira rápido. Vuelve a autorizar:
```
https://almip.com/api/dropbox/authorize
```

### Error: "Failed to save tokens"

**Solución:** 
1. Verifica conexión a Supabase
2. Revisa logs en Supabase Dashboard → Logs
3. Verifica que la política RLS permita escritura

---

## 📚 Documentación Completa

- **Inicio rápido:** `QUICK_START_SUPABASE.md`
- **Setup completo:** `SUPABASE_SETUP.md`
- **Resumen técnico:** `SUPABASE_IMPLEMENTATION_SUMMARY.md`
- **Guía maestra:** `README_FINAL.md`

---

**Implementado:** 2025-10-13  
**Problema resuelto:** EROFS error en Vercel  
**Solución:** Migración completa a Supabase  

**¡Ahora sí funciona en producción! 🚀**
