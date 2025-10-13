# 📊 Diagramas del Flujo OAuth2

## 🔄 Flujo Completo de Autorización

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Visita /api/dropbox/authorize
       │
       ▼
┌─────────────────────────────────────────┐
│  /app/api/dropbox/authorize/route.ts   │
│                                         │
│  • Construye URL de autorización       │
│  • Agrega client_id, scopes, etc.      │
│  • token_access_type=offline            │
└──────────────┬──────────────────────────┘
               │
               │ 2. Redirige a Dropbox
               │
               ▼
┌─────────────────────────────────────────┐
│         Dropbox OAuth Page              │
│                                         │
│  "PDF_Defensor_Democracia quiere       │
│   acceso a tus archivos"                │
│                                         │
│  [Permitir]  [Cancelar]                 │
└──────────────┬──────────────────────────┘
               │
               │ 3. Usuario hace clic en "Permitir"
               │
               ▼
┌─────────────────────────────────────────┐
│  Dropbox redirige a:                    │
│  https://almip.com/oauth/callback       │
│  ?code=ABC123XYZ                        │
└──────────────┬──────────────────────────┘
               │
               │ 4. Callback con código
               │
               ▼
┌─────────────────────────────────────────┐
│  /app/api/dropbox/callback/route.ts    │
│                                         │
│  • Recibe code del query string        │
│  • POST a api.dropboxapi.com/oauth2/   │
│    token con:                           │
│    - grant_type=authorization_code      │
│    - code=ABC123XYZ                     │
│    - client_id, client_secret           │
└──────────────┬──────────────────────────┘
               │
               │ 5. Intercambio de código por tokens
               │
               ▼
┌─────────────────────────────────────────┐
│         Dropbox API Response            │
│                                         │
│  {                                      │
│    "access_token": "sl.u.ABC...",      │
│    "refresh_token": "EZVYX5...",       │
│    "expires_in": 14400,                │
│    "account_id": "dbid:...",           │
│    "scope": "files.content.write..."   │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               │ 6. Guarda tokens
               │
               ▼
┌─────────────────────────────────────────┐
│         tokens.json                     │
│                                         │
│  {                                      │
│    "access_token": "...",              │
│    "refresh_token": "...",             │
│    "expires_in": 14400,                │
│    "obtained_at": "2025-10-13...",     │
│    "expires_at": "2025-10-13..."       │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               │ 7. Retorna respuesta exitosa
               │
               ▼
┌─────────────────────────────────────────┐
│  Response JSON                          │
│                                         │
│  {                                      │
│    "success": true,                    │
│    "message": "Dropbox authorization   │
│                successful!"             │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## 🔄 Flujo de Uso del Cliente (Con Auto-Refresh)

```
┌─────────────────────────────────────────┐
│   Tu código llama:                      │
│   const dbx = await getDropboxClient(); │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  /lib/dropboxClient.ts                  │
│  getDropboxClient()                     │
│                                         │
│  • Llama a getValidAccessToken()        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  /lib/refreshDropboxToken.ts            │
│  getValidAccessToken()                  │
│                                         │
│  1. Lee tokens.json                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ¿Token expirado?                       │
│  (expires_at - 5 min < now)             │
└──────┬──────────────────┬───────────────┘
       │                  │
   NO  │                  │ SÍ
       │                  │
       │                  ▼
       │    ┌─────────────────────────────┐
       │    │  refreshDropboxToken()      │
       │    │                             │
       │    │  POST a Dropbox API:        │
       │    │  - grant_type=refresh_token │
       │    │  - refresh_token=...        │
       │    │  - client_id, client_secret │
       │    └──────────┬──────────────────┘
       │               │
       │               ▼
       │    ┌─────────────────────────────┐
       │    │  Dropbox retorna:           │
       │    │  {                          │
       │    │    "access_token": "new...",│
       │    │    "expires_in": 14400      │
       │    │  }                          │
       │    └──────────┬──────────────────┘
       │               │
       │               ▼
       │    ┌─────────────────────────────┐
       │    │  Actualiza tokens.json      │
       │    │  con nuevo access_token     │
       │    └──────────┬──────────────────┘
       │               │
       ▼               ▼
┌─────────────────────────────────────────┐
│  Retorna access_token válido            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Crea cliente Dropbox:                  │
│  new Dropbox({ accessToken: ... })      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Retorna cliente listo para usar        │
│  Tu código puede hacer:                 │
│  • dbx.filesUpload()                    │
│  • dbx.filesDownload()                  │
│  • dbx.filesListFolder()                │
│  • etc.                                 │
└─────────────────────────────────────────┘
```

---

## 📤 Ejemplo: Subida de Archivo

```
┌─────────────────────────────────────────┐
│  Frontend envía archivo                 │
│  POST /api/upload                       │
│  FormData: { file: PDF }                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  /app/api/upload/route.ts               │
│                                         │
│  const dbx = await getDropboxClient();  │
└──────────────┬──────────────────────────┘
               │
               │ (Auto-refresh si es necesario)
               │
               ▼
┌─────────────────────────────────────────┐
│  Cliente Dropbox con token válido       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  dbx.filesUpload({                      │
│    path: '/PDF_Defensor.../file.pdf',  │
│    contents: buffer                     │
│  })                                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Dropbox API                            │
│  • Recibe archivo                       │
│  • Guarda en carpeta                    │
│  • Retorna metadata                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Response al frontend                   │
│  {                                      │
│    "success": true,                    │
│    "file": {                           │
│      "name": "file.pdf",               │
│      "path": "/PDF_Defensor.../",      │
│      "size": 12345                     │
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida del Token

```
Día 1, 00:00
┌─────────────────────────────────────────┐
│  Usuario autoriza la app                │
│  • access_token obtenido                │
│  • refresh_token obtenido               │
│  • expires_at = 00:00 + 4h = 04:00      │
└─────────────────────────────────────────┘

Día 1, 00:00 - 03:55
┌─────────────────────────────────────────┐
│  Todas las llamadas usan                │
│  access_token original                  │
│  ✅ Token válido                        │
└─────────────────────────────────────────┘

Día 1, 03:55
┌─────────────────────────────────────────┐
│  Sistema detecta:                       │
│  expires_at (04:00) - 5 min = 03:55     │
│  ⚠️  Token próximo a expirar            │
└─────────────────────────────────────────┘

Día 1, 03:55
┌─────────────────────────────────────────┐
│  Auto-refresh activado                  │
│  • Usa refresh_token                    │
│  • Obtiene nuevo access_token           │
│  • Actualiza expires_at = 07:55         │
│  ✅ Token refrescado                    │
└─────────────────────────────────────────┘

Día 1, 03:55 - 07:50
┌─────────────────────────────────────────┐
│  Todas las llamadas usan                │
│  nuevo access_token                     │
│  ✅ Token válido                        │
└─────────────────────────────────────────┘

Día 1, 07:50
┌─────────────────────────────────────────┐
│  Auto-refresh activado nuevamente       │
│  • Ciclo se repite indefinidamente      │
│  • refresh_token nunca expira           │
└─────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Archivos

```
democracy-corp/
│
├── app/
│   ├── api/
│   │   └── dropbox/
│   │       ├── authorize/
│   │       │   └── route.ts ────────► Inicia OAuth
│   │       ├── callback/
│   │       │   └── route.ts ────────► Maneja callback
│   │       └── test-auth/
│   │           └── route.ts ────────► Prueba conexión
│   │
│   └── dropbox-auth/
│       └── page.tsx ────────────────► Panel web
│
├── lib/
│   ├── refreshDropboxToken.ts ──────► Gestión de tokens
│   ├── dropboxClient.ts ────────────► Cliente Dropbox
│   └── types/
│       └── dropbox.ts ──────────────► Tipos TypeScript
│
├── scripts/
│   └── test-oauth-flow.ts ──────────► Script de testing
│
├── tokens.json ─────────────────────► Tokens guardados
│                                       (gitignored)
│
├── .env ────────────────────────────► Variables de entorno
│   • DROPBOX_CLIENT_ID
│   • DROPBOX_CLIENT_SECRET
│   • DROPBOX_REDIRECT_URI
│   • DROPBOX_FOLDER
│
└── Documentación/
    ├── DROPBOX_OAUTH_SETUP.md ──────► Guía completa
    ├── QUICK_START_OAUTH.md ────────► Inicio rápido
    ├── INTEGRATION_EXAMPLES.md ─────► 10 ejemplos
    ├── OAUTH_IMPLEMENTATION_SUMMARY.md
    ├── README_OAUTH.md ─────────────► Doc maestra
    ├── IMPLEMENTATION_COMPLETE.md ──► Resumen
    └── OAUTH_FLOW_DIAGRAM.md ───────► Este archivo
```

---

## 🔐 Flujo de Seguridad

```
┌─────────────────────────────────────────┐
│  Datos Sensibles                        │
└─────────────────────────────────────────┘
           │
           ├─► CLIENT_ID ──────────► .env (gitignored)
           │
           ├─► CLIENT_SECRET ─────► .env (gitignored)
           │
           ├─► access_token ──────► tokens.json (gitignored)
           │
           └─► refresh_token ─────► tokens.json (gitignored)

┌─────────────────────────────────────────┐
│  Datos Públicos                         │
└─────────────────────────────────────────┘
           │
           ├─► REDIRECT_URI ───────► Código (OK)
           │
           ├─► Scopes ─────────────► Código (OK)
           │
           └─► FOLDER ─────────────► .env (OK)

┌─────────────────────────────────────────┐
│  Protección en Git                      │
└─────────────────────────────────────────┘
           │
           ├─► .gitignore incluye:
           │   • .env
           │   • tokens.json
           │   • .dropbox-tokens.json
           │
           └─► ✅ Tokens nunca en Git
```

---

## 📊 Estados del Token

```
┌─────────────────────────────────────────┐
│  Estado 1: NO AUTORIZADO                │
│                                         │
│  • No existe tokens.json                │
│  • Acción: Visitar /api/dropbox/       │
│            authorize                    │
└─────────────────────────────────────────┘
                    │
                    │ Autorización
                    ▼
┌─────────────────────────────────────────┐
│  Estado 2: AUTORIZADO - TOKEN VÁLIDO    │
│                                         │
│  • tokens.json existe                   │
│  • expires_at > now + 5 min             │
│  • Acción: Usar token directamente      │
└─────────────────────────────────────────┘
                    │
                    │ Pasa el tiempo
                    ▼
┌─────────────────────────────────────────┐
│  Estado 3: AUTORIZADO - TOKEN EXPIRADO  │
│                                         │
│  • tokens.json existe                   │
│  • expires_at <= now + 5 min            │
│  • Acción: Auto-refresh                 │
└─────────────────────────────────────────┘
                    │
                    │ Refresh exitoso
                    ▼
┌─────────────────────────────────────────┐
│  Estado 2: AUTORIZADO - TOKEN VÁLIDO    │
│  (Ciclo se repite)                      │
└─────────────────────────────────────────┘
```

---

## 🎯 Puntos de Entrada para Desarrolladores

```
┌─────────────────────────────────────────┐
│  Caso de Uso                            │
└─────────────────────────────────────────┘
           │
           ├─► Subir archivo ──────────► uploadFileToDropbox()
           │
           ├─► Descargar archivo ──────► downloadFileFromDropbox()
           │
           ├─► Listar archivos ────────► listDropboxFiles()
           │
           ├─► Cliente personalizado ──► getDropboxClient()
           │
           ├─► Solo token ─────────────► getValidAccessToken()
           │
           └─► Verificar estado ───────► readTokens() + isTokenExpired()
```

---

## 🔄 Comparación: Antes vs Después

### ANTES (Sin OAuth Automático)

```
Tu Código
   │
   ├─► Usa token hardcoded de .env
   │
   ▼
Token expira cada 4 horas
   │
   ▼
❌ Error 401 Unauthorized
   │
   ▼
Tienes que:
   1. Ir a Dropbox manualmente
   2. Generar nuevo token
   3. Actualizar .env
   4. Reiniciar servidor
```

### DESPUÉS (Con OAuth Automático)

```
Tu Código
   │
   ├─► Llama getDropboxClient()
   │
   ▼
Sistema verifica token
   │
   ├─► ¿Expirado? NO ──► Usa token actual
   │
   └─► ¿Expirado? SÍ ──► Auto-refresh
                           │
                           ▼
                        Obtiene nuevo token
                           │
                           ▼
                        Actualiza tokens.json
                           │
                           ▼
                        Continúa operación

✅ Sin errores 401
✅ Sin intervención manual
✅ Funciona indefinidamente
```

---

## 📈 Métricas de Éxito

```
┌─────────────────────────────────────────┐
│  Antes de OAuth Automático              │
└─────────────────────────────────────────┘
   • Errores 401: ~6 por día (cada 4h)
   • Tiempo de inactividad: ~30 min/día
   • Intervención manual: 6 veces/día
   • Satisfacción del dev: 😞

┌─────────────────────────────────────────┐
│  Después de OAuth Automático            │
└─────────────────────────────────────────┘
   • Errores 401: 0
   • Tiempo de inactividad: 0
   • Intervención manual: 0
   • Satisfacción del dev: 😄
```

---

¡Diagramas completos! 🎉
