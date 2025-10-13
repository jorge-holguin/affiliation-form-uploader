-- Tabla para almacenar tokens de OAuth2 de Dropbox
-- Ejecuta este script en el SQL Editor de Supabase

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

-- Índice para búsqueda rápida por app_name
CREATE INDEX IF NOT EXISTS idx_dropbox_tokens_app_name ON dropbox_tokens(app_name);

-- Índice para búsqueda por account_id
CREATE INDEX IF NOT EXISTS idx_dropbox_tokens_account_id ON dropbox_tokens(account_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_dropbox_tokens_updated_at ON dropbox_tokens;
CREATE TRIGGER update_dropbox_tokens_updated_at
  BEFORE UPDATE ON dropbox_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE dropbox_tokens IS 'Almacena tokens OAuth2 de Dropbox con refresh automático';
COMMENT ON COLUMN dropbox_tokens.app_name IS 'Nombre de la aplicación Dropbox';
COMMENT ON COLUMN dropbox_tokens.access_token IS 'Token de acceso de corta duración (4 horas)';
COMMENT ON COLUMN dropbox_tokens.refresh_token IS 'Token de refresh de larga duración';
COMMENT ON COLUMN dropbox_tokens.expires_in IS 'Duración del access_token en segundos';
COMMENT ON COLUMN dropbox_tokens.expires_at IS 'Timestamp cuando expira el access_token';
COMMENT ON COLUMN dropbox_tokens.obtained_at IS 'Timestamp cuando se obtuvo el token';

-- Política de seguridad (Row Level Security)
ALTER TABLE dropbox_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Solo el servicio puede leer/escribir (usando service_role key)
-- Para desarrollo, permitimos acceso con anon key
CREATE POLICY "Enable all access for anon" ON dropbox_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- En producción, deberías cambiar esta política para ser más restrictiva
-- Por ejemplo:
-- CREATE POLICY "Enable read access for authenticated users" ON dropbox_tokens
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
