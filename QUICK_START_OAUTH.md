# 🚀 Quick Start - Dropbox OAuth2

## Inicio Rápido en 3 Pasos

### 1️⃣ Autorizar la Aplicación

Visita en tu navegador:

```
http://localhost:3000/dropbox-auth
```

O directamente:

```
http://localhost:3000/api/dropbox/authorize
```

Esto te redirigirá a Dropbox para autorizar la app.

### 2️⃣ Verificar que Funcionó

Después de autorizar, verifica que se creó el archivo `tokens.json` en la raíz del proyecto.

O visita:

```
http://localhost:3000/api/dropbox/test-auth
```

### 3️⃣ Usar en tu Código

```typescript
import { getDropboxClient } from '@/lib/dropboxClient';

// En cualquier ruta API
export async function POST(request: Request) {
  const dbx = await getDropboxClient();
  
  // Usar Dropbox API
  const result = await dbx.filesUpload({
    path: '/PDF_Defensor_Democracia/archivo.pdf',
    contents: fileBuffer,
  });
  
  return Response.json({ success: true });
}
```

---

## 📝 Ejemplo Completo: Subir PDF

```typescript
// app/api/upload-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToDropbox } from '@/lib/dropboxClient';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Dropbox (auto-refresca token si expiró)
    const result = await uploadFileToDropbox(
      `/PDF_Defensor_Democracia/${file.name}`,
      buffer
    );

    return NextResponse.json({
      success: true,
      file: {
        name: result.name,
        path: result.path_display,
        size: result.size,
        id: result.id,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 🔄 Refresh Automático

**No necesitas hacer nada.** El sistema automáticamente:

1. ✅ Detecta cuando el token expira
2. ✅ Usa el `refresh_token` para obtener uno nuevo
3. ✅ Actualiza `tokens.json` con el nuevo token
4. ✅ Continúa la operación sin errores

---

## 🛠️ Comandos Útiles

### Iniciar servidor de desarrollo

```bash
npm run dev
```

### Ver variables de entorno

```bash
npm run show:env
```

### Probar autenticación Dropbox

```bash
npm run test:dropbox
```

---

## 📂 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `tokens.json` | Tokens OAuth guardados (gitignored) |
| `.env` | Variables de entorno (CLIENT_ID, SECRET, etc.) |
| `/lib/dropboxClient.ts` | Cliente Dropbox con auto-refresh |
| `/lib/refreshDropboxToken.ts` | Lógica de refresh de tokens |
| `/app/api/dropbox/authorize/route.ts` | Inicia OAuth flow |
| `/app/api/dropbox/callback/route.ts` | Maneja callback y guarda tokens |

---

## ❓ Problemas Comunes

### "No tokens found"

**Solución:** Visita `/api/dropbox/authorize` para autorizar la app.

### "Token refresh failed"

**Solución:** 
1. Elimina `tokens.json`
2. Vuelve a autorizar en `/api/dropbox/authorize`

### "Missing environment variables"

**Solución:** Verifica que `.env` tenga todas las variables:

```env
DROPBOX_CLIENT_ID=9luel6tahlh5d40
DROPBOX_CLIENT_SECRET=933ku5zxgjtwoiz
DROPBOX_REDIRECT_URI=https://almip.com/oauth/callback
DROPBOX_FOLDER=/PDF_Defensor_Democracia
```

---

## 🎯 Funciones Principales

### `getDropboxClient()`

Retorna un cliente Dropbox autenticado con token válido.

```typescript
const dbx = await getDropboxClient();
```

### `uploadFileToDropbox(path, buffer)`

Sube un archivo a Dropbox.

```typescript
await uploadFileToDropbox('/folder/file.pdf', buffer);
```

### `downloadFileFromDropbox(path)`

Descarga un archivo de Dropbox.

```typescript
const buffer = await downloadFileFromDropbox('/folder/file.pdf');
```

### `listDropboxFiles(folderPath)`

Lista archivos en una carpeta.

```typescript
const files = await listDropboxFiles('/PDF_Defensor_Democracia');
```

### `getValidAccessToken()`

Obtiene un access token válido (refresca si expiró).

```typescript
const token = await getValidAccessToken();
```

---

## 📚 Documentación Completa

Para más detalles, consulta: **`DROPBOX_OAUTH_SETUP.md`**

---

¡Listo para usar! 🎉
