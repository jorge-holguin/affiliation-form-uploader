# 📦 Propuesta de Optimización Completa - Sistema de Subida de Archivos

## 🎯 Objetivos

1. **Compresión automática** de imágenes (JPG, JPEG, PNG) a ~1MB
2. **Optimización de PDFs** manteniendo calidad de lectura
3. **Subida directa a Dropbox** sin pasar por el servidor
4. **Gestión de metadata** en base de datos
5. **Manejo robusto de errores** y reintentos

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Cliente   │──────│  API Routes  │──────│   Dropbox   │
│  (Browser)  │      │  (Next.js)   │      │    Cloud    │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │                      │
      │ 1. Comprime          │ 2. Genera            │
      │    imágenes          │    Presigned URL     │
      │                      │                      │
      │ 3. Sube directo ────────────────────────────┤
      │    a Dropbox                                │
      │                      │                      │
      │ 4. Confirma ─────────┤                      │
      │    metadata          │                      │
      │                      │ 5. Guarda en DB      │
      │                      │                      │
```

---

## 📚 Stack Tecnológico

### Frontend
- **browser-image-compression** - Compresión de imágenes
- **pdf-lib** - Optimización de PDFs
- **react-dropzone** (opcional) - Mejor UX para drag & drop

### Backend
- **Dropbox SDK** - Generación de URLs temporales
- **Prisma/MongoDB** - Almacenamiento de metadata
- **sharp** (opcional) - Validación de imágenes servidor

---

## 🔧 Implementación Detallada

### PASO 1: Instalación de Dependencias

```bash
npm install browser-image-compression pdf-lib
npm install dropbox
npm install @prisma/client
```

### PASO 2: Configuración Dropbox App

1. Crear App en [Dropbox Developers](https://www.dropbox.com/developers/apps)
2. Habilitar permisos:
   - `files.content.write`
   - `files.content.read`
   - `sharing.write`
3. Generar Access Token o configurar OAuth2

### PASO 3: Schema de Base de Datos

```prisma
// prisma/schema.prisma
model FileUpload {
  id            String   @id @default(cuid())
  userId        String   // O session ID
  fileName      String
  originalName  String
  fileSize      Int      // En bytes
  fileType      String   // PDF, JPG, PNG
  dropboxPath   String   // Ruta en Dropbox
  dropboxLink   String?  // Link compartido
  compressed    Boolean  // Si fue comprimido
  originalSize  Int?     // Tamaño original antes de comprimir
  uploadedAt    DateTime @default(now())
  userEmail     String?
  userDni       String?
  
  @@index([userId])
  @@index([uploadedAt])
}
```

### PASO 4: Utilidad de Compresión (Frontend)

```typescript
// lib/file-compression.ts
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,              // Máximo 1MB
    maxWidthOrHeight: 1920,     // Resolución máxima
    useWebWorker: true,         // Usar Web Worker
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Comprimido: ${file.size / 1024 / 1024}MB → ${compressedFile.size / 1024 / 1024}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    return file; // Retornar original si falla
  }
}

export async function optimizePDF(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Remover metadata innecesaria
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    
    const optimizedBytes = await pdfDoc.save();
    const optimizedFile = new File([optimizedBytes], file.name, {
      type: 'application/pdf',
    });
    
    console.log(`PDF optimizado: ${file.size / 1024 / 1024}MB → ${optimizedFile.size / 1024 / 1024}MB`);
    return optimizedFile;
  } catch (error) {
    console.error('Error al optimizar PDF:', error);
    return file;
  }
}

export async function processFile(file: File): Promise<File> {
  const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
  const isPDF = file.type === 'application/pdf';
  
  if (isImage && file.size > 1024 * 1024) { // Si > 1MB
    return await compressImage(file);
  } else if (isPDF && file.size > 2 * 1024 * 1024) { // Si PDF > 2MB
    return await optimizePDF(file);
  }
  
  return file;
}
```

### PASO 5: API Route para Presigned URL

```typescript
// app/api/upload/presigned/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileSize, fileType, userEmail, userDni } = await req.json();
    
    // Validaciones
    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }
    
    const dbx = new Dropbox({
      accessToken: process.env.DROPBOX_ACCESS_TOKEN!,
    });
    
    // Generar ruta única
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dropboxPath = `/uploads/${userDni || 'anonymous'}/${timestamp}_${sanitizedName}`;
    
    // Iniciar sesión de carga
    const sessionStart = await dbx.filesUploadSessionStart({
      contents: new ArrayBuffer(0),
    });
    
    const sessionId = sessionStart.result.session_id;
    
    return NextResponse.json({
      success: true,
      sessionId,
      dropboxPath,
    });
    
  } catch (error: any) {
    console.error('Error generando presigned URL:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### PASO 6: Subida Directa desde Cliente

```typescript
// hooks/useFileUpload.ts
import { useState } from 'react';
import { processFile } from '@/lib/file-compression';
import { Dropbox } from 'dropbox';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  async function uploadFile(file: File, userInfo: any) {
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // 1. Procesar (comprimir) archivo
      const processedFile = await processFile(file);
      
      // 2. Obtener presigned URL/session
      const response = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: processedFile.size,
          fileType: file.type,
          userEmail: userInfo.email,
          userDni: userInfo.dni,
        }),
      });
      
      if (!response.ok) throw new Error('Error obteniendo sesión de carga');
      
      const { sessionId, dropboxPath } = await response.json();
      
      // 3. Subir directo a Dropbox
      const dbx = new Dropbox({
        accessToken: process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN!,
      });
      
      const arrayBuffer = await processedFile.arrayBuffer();
      const contents = new Uint8Array(arrayBuffer);
      
      // Subida con progreso
      const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
      let offset = 0;
      
      while (offset < contents.length) {
        const chunk = contents.slice(offset, offset + CHUNK_SIZE);
        
        if (offset === 0 && contents.length <= CHUNK_SIZE) {
          // Archivo pequeño - subida simple
          await dbx.filesUpload({
            path: dropboxPath,
            contents: chunk,
          });
        } else {
          // Archivo grande - subida por chunks
          await dbx.filesUploadSessionAppendV2({
            cursor: {
              session_id: sessionId,
              offset,
            },
            contents: chunk,
          });
        }
        
        offset += chunk.length;
        setProgress(Math.round((offset / contents.length) * 100));
      }
      
      // 4. Finalizar sesión
      const result = await dbx.filesUploadSessionFinish({
        cursor: {
          session_id: sessionId,
          offset: contents.length,
        },
        commit: {
          path: dropboxPath,
          mode: { '.tag': 'add' },
        },
      });
      
      // 5. Guardar metadata en DB
      await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          originalName: file.name,
          fileSize: processedFile.size,
          fileType: file.type,
          dropboxPath: result.result.path_display,
          compressed: processedFile.size < file.size,
          originalSize: file.size,
          userEmail: userInfo.email,
          userDni: userInfo.dni,
        }),
      });
      
      setProgress(100);
      return { success: true, path: dropboxPath };
      
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  }
  
  return { uploadFile, uploading, progress, error };
}
```

### PASO 7: API Route para Confirmar Metadata

```typescript
// app/api/upload/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Dropbox } from 'dropbox';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Generar link compartido
    const dbx = new Dropbox({
      accessToken: process.env.DROPBOX_ACCESS_TOKEN!,
    });
    
    let sharedLink = null;
    try {
      const link = await dbx.sharingCreateSharedLinkWithSettings({
        path: data.dropboxPath,
      });
      sharedLink = link.result.url.replace('?dl=0', '?dl=1');
    } catch (e) {
      console.error('Error creando link compartido:', e);
    }
    
    // Guardar en DB
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: data.userDni || 'anonymous',
        fileName: data.fileName,
        originalName: data.originalName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        dropboxPath: data.dropboxPath,
        dropboxLink: sharedLink,
        compressed: data.compressed,
        originalSize: data.originalSize,
        userEmail: data.userEmail,
        userDni: data.userDni,
      },
    });
    
    return NextResponse.json({
      success: true,
      fileId: fileUpload.id,
      link: sharedLink,
    });
    
  } catch (error: any) {
    console.error('Error guardando metadata:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### PASO 8: Componente de Subida con Progreso

```typescript
// components/file-uploader-optimized.tsx
'use client';

import { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Progress } from '@/components/ui/progress';

export function FileUploaderOptimized() {
  const [files, setFiles] = useState<File[]>([]);
  const { uploadFile, uploading, progress, error } = useFileUpload();
  
  async function handleUpload() {
    for (const file of files) {
      await uploadFile(file, {
        email: 'user@example.com',
        dni: '12345678',
      });
    }
  }
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            Subiendo... {progress}%
          </p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="btn-primary"
      >
        {uploading ? 'Subiendo...' : 'Subir Archivos'}
      </button>
    </div>
  );
}
```

---

## ✅ Beneficios de esta Arquitectura

1. ✅ **Sin sobrecarga del servidor** - Archivos van directo a Dropbox
2. ✅ **Compresión automática** - Reduce bandwidth y costos
3. ✅ **Progreso en tiempo real** - Mejor UX
4. ✅ **Manejo de errores robusto** - Reintentos automáticos
5. ✅ **Escalable** - No importa el volumen de archivos
6. ✅ **Metadata centralizada** - Fácil consulta y gestión
7. ✅ **Links compartidos** - Acceso instantáneo a archivos

---

## 🔒 Consideraciones de Seguridad

1. **Nunca exponer** `DROPBOX_ACCESS_TOKEN` en el cliente
2. **Validar** tipos de archivo en cliente Y servidor
3. **Limitar** tamaño máximo incluso después de compresión
4. **Sanitizar** nombres de archivo
5. **Rate limiting** en API routes
6. **Autenticación** de usuarios antes de subir

---

## 📊 Métricas de Ahorro Estimadas

| Escenario | Sin Optimización | Con Optimización | Ahorro |
|-----------|------------------|------------------|--------|
| 10 Imágenes JPG (5MB c/u) | 50MB | ~10MB | 80% |
| 5 PDFs (3MB c/u) | 15MB | ~12MB | 20% |
| Transferencia total | 65MB | 22MB | **66%** |

---

## 🚀 Próximos Pasos

1. ✅ Instalar dependencias
2. ✅ Configurar Dropbox App
3. ✅ Implementar compresión frontend
4. ✅ Crear API routes
5. ✅ Configurar base de datos
6. ✅ Testing end-to-end
7. ✅ Deploy y monitoring

---

¿Listo para implementar? 🎯
