/**
 * Tipos TypeScript para el flujo OAuth2 de Dropbox
 */

/**
 * Estructura de tokens OAuth2 de Dropbox guardados en tokens.json
 */
export interface DropboxTokens {
  /** Token de acceso para autenticar peticiones a la API */
  access_token: string;
  
  /** Token para refrescar el access_token cuando expire */
  refresh_token: string;
  
  /** Tiempo de vida del access_token en segundos (típicamente 14400 = 4 horas) */
  expires_in: number;
  
  /** Tipo de token (siempre "bearer") */
  token_type: string;
  
  /** Scopes autorizados separados por espacios */
  scope: string;
  
  /** ID de la cuenta de Dropbox */
  account_id?: string;
  
  /** ID de usuario (legacy) */
  uid?: string;
  
  /** Timestamp ISO 8601 de cuando se obtuvo el token */
  obtained_at: string;
  
  /** Timestamp ISO 8601 de cuando expira el token */
  expires_at: string;
}

/**
 * Respuesta de la API de Dropbox al refrescar un token
 */
export interface RefreshTokenResponse {
  /** Nuevo access token */
  access_token: string;
  
  /** Tipo de token */
  token_type: string;
  
  /** Tiempo de vida en segundos */
  expires_in: number;
}

/**
 * Respuesta de la API de Dropbox al intercambiar code por tokens
 */
export interface TokenExchangeResponse extends RefreshTokenResponse {
  /** Refresh token (solo en la primera autorización) */
  refresh_token: string;
  
  /** Scopes autorizados */
  scope: string;
  
  /** ID de la cuenta */
  account_id: string;
  
  /** ID de usuario */
  uid: string;
}

/**
 * Parámetros para subir un archivo a Dropbox
 */
export interface UploadFileParams {
  /** Ruta completa en Dropbox donde se guardará el archivo */
  path: string;
  
  /** Contenido del archivo */
  contents: Buffer | Uint8Array | string;
  
  /** Modo de escritura */
  mode?: {
    '.tag': 'add' | 'overwrite' | 'update';
  };
  
  /** Auto-renombrar si existe conflicto */
  autorename?: boolean;
  
  /** Silenciar notificaciones */
  mute?: boolean;
  
  /** Timestamp de modificación del cliente */
  client_modified?: string;
  
  /** Strict conflict resolution */
  strict_conflict?: boolean;
}

/**
 * Metadata de un archivo en Dropbox
 */
export interface DropboxFileMetadata {
  /** Tag del tipo (.tag: "file" o "folder") */
  '.tag': 'file' | 'folder';
  
  /** Nombre del archivo */
  name: string;
  
  /** Ruta completa del archivo */
  path_display: string;
  
  /** Ruta en minúsculas */
  path_lower: string;
  
  /** ID único del archivo */
  id: string;
  
  /** Timestamp de modificación del cliente */
  client_modified?: string;
  
  /** Timestamp de modificación del servidor */
  server_modified?: string;
  
  /** Revisión del archivo */
  rev?: string;
  
  /** Tamaño en bytes (solo para archivos) */
  size?: number;
  
  /** Indica si es descargable */
  is_downloadable?: boolean;
  
  /** Hash del contenido */
  content_hash?: string;
}

/**
 * Respuesta al listar archivos en una carpeta
 */
export interface ListFolderResponse {
  /** Lista de archivos y carpetas */
  entries: DropboxFileMetadata[];
  
  /** Cursor para paginación */
  cursor: string;
  
  /** Indica si hay más resultados */
  has_more: boolean;
}

/**
 * Información de la cuenta de Dropbox
 */
export interface DropboxAccountInfo {
  /** ID de la cuenta */
  account_id: string;
  
  /** Información del nombre */
  name: {
    /** Nombre para mostrar */
    display_name: string;
    
    /** Nombre familiar */
    familiar_name: string;
    
    /** Nombre */
    given_name: string;
    
    /** Apellido */
    surname: string;
  };
  
  /** Email de la cuenta */
  email: string;
  
  /** Email verificado */
  email_verified: boolean;
  
  /** Indica si es compañero de equipo */
  is_teammate: boolean;
  
  /** URL de la foto de perfil */
  profile_photo_url?: string;
  
  /** Tipo de cuenta */
  account_type: {
    '.tag': 'basic' | 'pro' | 'business';
  };
}

/**
 * Opciones para el cliente de Dropbox
 */
export interface DropboxClientOptions {
  /** Access token para autenticación */
  accessToken: string;
  
  /** Función fetch personalizada */
  fetch?: typeof fetch;
  
  /** URL base de la API (para testing) */
  selectUser?: string;
}

/**
 * Resultado de prueba de autenticación
 */
export interface AuthTestResult {
  /** Indica si la prueba fue exitosa */
  success: boolean;
  
  /** Mensaje descriptivo */
  message: string;
  
  /** Estado del token */
  tokenStatus?: {
    /** Indica si el token estaba expirado */
    wasExpired: boolean;
    
    /** Timestamp de expiración */
    expiresAt: string;
    
    /** Timestamp de obtención */
    obtainedAt: string;
  };
  
  /** Información de la cuenta */
  account?: {
    /** Nombre para mostrar */
    name: string;
    
    /** Email */
    email: string;
    
    /** ID de cuenta */
    accountId: string;
  };
  
  /** Carpeta configurada */
  folder?: string;
  
  /** Cantidad de archivos encontrados */
  filesCount?: number;
  
  /** Lista de archivos */
  files?: Array<{
    name: string;
    path: string;
    type: string;
    size?: number;
  }>;
  
  /** Error si hubo alguno */
  error?: string;
  
  /** Detalles del error */
  details?: string;
}

/**
 * Configuración de OAuth2
 */
export interface OAuthConfig {
  /** Client ID de la app de Dropbox */
  clientId: string;
  
  /** Client Secret de la app */
  clientSecret: string;
  
  /** URI de redirección configurada */
  redirectUri: string;
  
  /** Scopes solicitados */
  scopes: string[];
  
  /** Tipo de acceso al token */
  tokenAccessType: 'offline' | 'online';
}

/**
 * Constantes de OAuth2
 */
export const DROPBOX_OAUTH_CONSTANTS = {
  /** URL de autorización */
  AUTHORIZE_URL: 'https://www.dropbox.com/oauth2/authorize',
  
  /** URL de token */
  TOKEN_URL: 'https://api.dropboxapi.com/oauth2/token',
  
  /** Scopes por defecto */
  DEFAULT_SCOPES: [
    'files.content.write',
    'files.content.read',
    'files.metadata.read',
    'files.metadata.write',
  ],
  
  /** Tiempo de buffer antes de expiración (5 minutos en ms) */
  EXPIRATION_BUFFER_MS: 5 * 60 * 1000,
  
  /** Duración típica del token (4 horas en segundos) */
  TOKEN_DURATION_SECONDS: 14400,
} as const;
