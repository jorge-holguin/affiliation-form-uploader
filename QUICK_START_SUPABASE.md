# ⚡ Inicio Rápido - OAuth2 con Supabase

## 🎯 3 Pasos para Empezar

### Paso 1: Crear la Tabla en Supabase (2 minutos)

1. Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/sql

2. Copia y pega este SQL:

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

3. Haz clic en **Run**

4. ✅ Tabla creada

---

### Paso 2: Configurar Variables de Entorno (1 minuto)

Tu `.env` ya está configurado con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rmrofwmqltmhfgcbixwn.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Para Vercel, ejecuta:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Pega: https://rmrofwmqltmhfgcbixwn.supabase.co

vercel env add SUPABASE_KEY production
# Pega: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcm9md21xbHRtaGZnY2JpeHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDc3ODIsImV4cCI6MjA3NTg4Mzc4Mn0.Qe2iQ00AexbWLtLju1rI6KL48pX8ohyxL2lPG1Fl8Tk
```

---

### Paso 3: Autorizar y Probar (2 minutos)

```bash
# 1. Inicia el servidor
npm run dev

# 2. Visita en tu navegador
http://localhost:3000/api/dropbox/authorize

# 3. Autoriza la aplicación en Dropbox

# 4. Verifica en Supabase
# Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/editor
# Tabla: dropbox_tokens
# Deberías ver 1 registro con tus tokens
```

---

## ✅ Verificación

### Opción 1: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/rmrofwmqltmhfgcbixwn/editor
2. Selecciona la tabla `dropbox_tokens`
3. Deberías ver un registro con:
   - `app_name`: PDF_Defensor_Democracia
   - `account_id`: tu ID de Dropbox
   - `expires_at`: fecha futura (4 horas desde ahora)

### Opción 2: Desde tu App

Visita: http://localhost:3000/api/dropbox/test-auth

Deberías ver:

```json
{
  "success": true,
  "message": "Dropbox authentication is working correctly!",
  "account": {
    "name": "Tu Nombre",
    "email": "tu@email.com",
    "accountId": "dbid:..."
  },
  "filesCount": 0
}
```

---

## 🚀 Deploy a Producción

```bash
# 1. Commit y push
git add .
git commit -m "Add Supabase integration for OAuth tokens"
git push

# 2. Vercel desplegará automáticamente

# 3. Autoriza en producción
# Visita: https://almip.com/api/dropbox/authorize

# 4. Verifica
# Visita: https://almip.com/api/dropbox/test-auth
```

---

## 🎉 ¡Listo!

Tu sistema OAuth2 ahora:
- ✅ Guarda tokens en Supabase (persistente)
- ✅ Funciona en Vercel (sin problemas de archivos efímeros)
- ✅ Refresca tokens automáticamente
- ✅ Escala sin problemas

---

## 📚 Más Información

- **Setup completo:** `SUPABASE_SETUP.md`
- **Documentación OAuth:** `README_OAUTH.md`
- **Ejemplos de integración:** `INTEGRATION_EXAMPLES.md`

---

**¿Problemas?** Revisa `SUPABASE_SETUP.md` sección Troubleshooting.
