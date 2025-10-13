# 🔌 Ejemplos de Integración - OAuth2 Dropbox

Esta guía muestra cómo integrar el sistema OAuth2 en tus rutas API existentes.

---

## 📤 Ejemplo 1: Ruta de Subida de PDF

### Antes (sin OAuth automático)

```typescript
// app/api/upload/route.ts (ANTES)
import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Token hardcoded o desde .env (expira cada 4 horas)
  const dbx = new Dropbox({ 
    accessToken: process.env.DROPBOX_ACCESS_TOKEN 
  });
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const result = await dbx.filesUpload({
    path: `/PDF_Defensor_Democracia/${file.name}`,
    contents: buffer,
  });
  
  return NextResponse.json({ success: true, file: result.result });
}
```

### Después (con OAuth automático)

```typescript
// app/api/upload/route.ts (DESPUÉS)
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
    
    // Subir usando el helper (auto-refresca token si expiró)
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

**Ventajas:**
- ✅ Token se refresca automáticamente
- ✅ No más errores 401 por token expirado
- ✅ Código más limpio y mantenible
- ✅ Manejo de errores incluido

---

## 📥 Ejemplo 2: Ruta de Descarga de Archivos

```typescript
// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { downloadFileFromDropbox } from '@/lib/dropboxClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Descargar archivo (auto-refresca token)
    const fileBuffer = await downloadFileFromDropbox(filePath);
    
    // Extraer nombre del archivo
    const fileName = filePath.split('/').pop() || 'download.pdf';
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

**Uso desde el frontend:**

```typescript
// Descargar archivo
const response = await fetch('/api/download?path=/PDF_Defensor_Democracia/documento.pdf');
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'documento.pdf';
a.click();
```

---

## 📋 Ejemplo 3: Listar Archivos en Carpeta

```typescript
// app/api/files/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listDropboxFiles } from '@/lib/dropboxClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || process.env.DROPBOX_FOLDER || '';
    
    // Listar archivos (auto-refresca token)
    const files = await listDropboxFiles(folder);
    
    // Formatear respuesta
    const formattedFiles = files.map((file: any) => ({
      name: file.name,
      path: file.path_display,
      type: file['.tag'],
      size: file.size,
      modified: file.server_modified,
      isFolder: file['.tag'] === 'folder',
    }));
    
    return NextResponse.json({
      success: true,
      folder: folder,
      count: formattedFiles.length,
      files: formattedFiles,
    });
    
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files', details: String(error) },
      { status: 500 }
    );
  }
}
```

**Uso desde el frontend:**

```typescript
const response = await fetch('/api/files/list?folder=/PDF_Defensor_Democracia');
const data = await response.json();
console.log(`Found ${data.count} files:`, data.files);
```

---

## 🗑️ Ejemplo 4: Eliminar Archivo

```typescript
// app/api/files/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropboxClient';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Obtener cliente (auto-refresca token)
    const dbx = await getDropboxClient();
    
    // Eliminar archivo
    const result = await dbx.filesDeleteV2({ path: filePath });
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      metadata: result.result.metadata,
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 📝 Ejemplo 5: Obtener Metadata de Archivo

```typescript
// app/api/files/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropboxClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Obtener cliente
    const dbx = await getDropboxClient();
    
    // Obtener metadata
    const result = await dbx.filesGetMetadata({ path: filePath });
    
    return NextResponse.json({
      success: true,
      metadata: {
        name: result.result.name,
        path: result.result.path_display,
        size: (result.result as any).size,
        modified: (result.result as any).server_modified,
        id: result.result.id,
      },
    });
    
  } catch (error) {
    console.error('Metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to get metadata', details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 🔄 Ejemplo 6: Mover/Renombrar Archivo

```typescript
// app/api/files/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropboxClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromPath, toPath } = body;
    
    if (!fromPath || !toPath) {
      return NextResponse.json(
        { error: 'Both fromPath and toPath are required' },
        { status: 400 }
      );
    }
    
    // Obtener cliente
    const dbx = await getDropboxClient();
    
    // Mover/renombrar archivo
    const result = await dbx.filesMoveV2({
      from_path: fromPath,
      to_path: toPath,
      autorename: false,
    });
    
    return NextResponse.json({
      success: true,
      message: 'File moved successfully',
      metadata: result.result.metadata,
    });
    
  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json(
      { error: 'Move failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

**Uso desde el frontend:**

```typescript
await fetch('/api/files/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromPath: '/PDF_Defensor_Democracia/old-name.pdf',
    toPath: '/PDF_Defensor_Democracia/new-name.pdf',
  }),
});
```

---

## 🔗 Ejemplo 7: Crear Link de Compartir

```typescript
// app/api/files/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropboxClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Obtener cliente
    const dbx = await getDropboxClient();
    
    // Crear link de compartir
    const result = await dbx.sharingCreateSharedLinkWithSettings({
      path: filePath,
      settings: {
        requested_visibility: { '.tag': 'public' },
      },
    });
    
    return NextResponse.json({
      success: true,
      url: result.result.url,
      name: result.result.name,
      expires: result.result.expires,
    });
    
  } catch (error: any) {
    // Si el link ya existe, obtenerlo
    if (error?.error?.error?.['.tag'] === 'shared_link_already_exists') {
      try {
        const dbx = await getDropboxClient();
        const links = await dbx.sharingListSharedLinks({ path: body.filePath });
        
        if (links.result.links.length > 0) {
          return NextResponse.json({
            success: true,
            url: links.result.links[0].url,
            name: links.result.links[0].name,
            message: 'Using existing shared link',
          });
        }
      } catch (listError) {
        console.error('Error listing shared links:', listError);
      }
    }
    
    console.error('Share error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link', details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Ejemplo 8: Componente React de Subida

```typescript
// components/DropboxUploader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function DropboxUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          accept=".pdf"
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild disabled={uploading}>
            <span>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar PDF
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {result && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Archivo subido: {result.file.name}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 Ejemplo 9: Verificar Estado de Autenticación

```typescript
// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { readTokens, isTokenExpired } from '@/lib/refreshDropboxToken';

export async function GET() {
  try {
    const tokens = await readTokens();
    
    if (!tokens) {
      return NextResponse.json({
        authenticated: false,
        message: 'No tokens found. Please authorize at /api/dropbox/authorize',
      });
    }
    
    const expired = isTokenExpired(tokens);
    
    return NextResponse.json({
      authenticated: true,
      tokenExpired: expired,
      expiresAt: tokens.expires_at,
      obtainedAt: tokens.obtained_at,
      accountId: tokens.account_id,
      scopes: tokens.scope.split(' '),
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check auth status', details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 🛡️ Ejemplo 10: Middleware de Autenticación

```typescript
// lib/middleware/requireDropboxAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { readTokens } from '@/lib/refreshDropboxToken';

/**
 * Middleware para verificar que existe autenticación de Dropbox
 */
export async function requireDropboxAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    const tokens = await readTokens();
    
    if (!tokens) {
      return NextResponse.json(
        { 
          error: 'Not authenticated with Dropbox',
          message: 'Please authorize at /api/dropbox/authorize',
          authUrl: '/api/dropbox/authorize',
        },
        { status: 401 }
      );
    }
    
    // Continuar con el handler
    return await handler(request);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication check failed', details: String(error) },
      { status: 500 }
    );
  }
}
```

**Uso del middleware:**

```typescript
// app/api/protected-route/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireDropboxAuth } from '@/lib/middleware/requireDropboxAuth';
import { getDropboxClient } from '@/lib/dropboxClient';

export async function GET(request: NextRequest) {
  return requireDropboxAuth(request, async (req) => {
    // Esta función solo se ejecuta si hay autenticación válida
    const dbx = await getDropboxClient();
    // ... hacer operaciones con Dropbox
    
    return NextResponse.json({ success: true });
  });
}
```

---

## 📊 Resumen de Patrones

### Patrón 1: Usar Helpers (Recomendado)
```typescript
import { uploadFileToDropbox } from '@/lib/dropboxClient';
await uploadFileToDropbox(path, buffer);
```

### Patrón 2: Usar Cliente Directo
```typescript
import { getDropboxClient } from '@/lib/dropboxClient';
const dbx = await getDropboxClient();
await dbx.filesUpload({ ... });
```

### Patrón 3: Verificar Token Manualmente
```typescript
import { getValidAccessToken } from '@/lib/refreshDropboxToken';
const token = await getValidAccessToken();
```

---

## ✅ Checklist de Migración

- [ ] Reemplazar `new Dropbox({ accessToken: ... })` por `getDropboxClient()`
- [ ] Eliminar tokens hardcoded del código
- [ ] Agregar manejo de errores apropiado
- [ ] Probar el flujo OAuth completo
- [ ] Verificar que `tokens.json` se crea correctamente
- [ ] Probar refresh automático (esperar 4 horas o modificar `expires_at`)
- [ ] Actualizar frontend para manejar errores 401
- [ ] Documentar las nuevas rutas API

---

¡Listo para integrar! 🚀
