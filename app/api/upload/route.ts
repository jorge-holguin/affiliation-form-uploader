// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Dropbox, DropboxResponse, files } from 'dropbox';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promises as fsPromises } from 'fs';
import { uploadTracker } from '@/lib/upload-tracker';
import { createDropboxClient } from '@/lib/dropbox-auth-vercel';

// ====== CONFIG ======
const LOCAL_STORAGE_PATH = 'C:\\Users\\Jorge-Chosica\\Documents\\PDFS';
const DROPBOX_FOLDER = (process.env.DROPBOX_FOLDER || '/PDF_Defensor_Democracia').startsWith('/')
  ? process.env.DROPBOX_FOLDER || '/PDF_Defensor_Democracia'
  : `/${process.env.DROPBOX_FOLDER}`;

// ====== HELPERS ======

// IP del cliente
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return '127.0.0.1';
}

// Extensión de archivo con default .pdf
function getExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext || '.pdf';
}

// Sanitizar texto para nombre de archivo
function sanitize(input: string, allowAtDot = false): string {
  if (!input) return '';
  const base = input.trim().replace(/\s+/g, '_');
  return allowAtDot ? base.replace(/[^a-zA-Z0-9_@.]/g, '') : base.replace(/[^a-zA-Z0-9_]/g, '');
}

// Parsear form-data con múltiples archivos
async function parseFormData(req: NextRequest) {
  const formData = await req.formData();
  const nombreCompleto = formData.get('nombreCompleto') as string;
  const dni = formData.get('dni') as string;
  const correo = formData.get('correo') as string;
  const totalArchivos = parseInt(formData.get('totalArchivos') as string || '0');
  
  const archivos: File[] = [];
  for (let i = 0; i < totalArchivos; i++) {
    const archivo = formData.get(`archivo${i}`) as File;
    if (archivo) {
      archivos.push(archivo);
    }
  }

  if (!nombreCompleto || !dni || !correo || archivos.length === 0) {
    throw new Error('Faltan campos requeridos');
  }
  return { nombreCompleto, dni, correo, archivos };
}

// Guardar temporal y copia local
async function saveFileToDisk(
  file: File,
  formattedFileName?: string
): Promise<{ tempPath: string; localPath?: string }> {
  const tempDir = os.tmpdir();
  const fileBuffer = await file.arrayBuffer();
  const tempFileName = `temp-${Date.now()}${getExtension(file.name)}`;
  const tempFilePath = path.join(tempDir, tempFileName);

  // Guardar archivo temporal
  await fsPromises.writeFile(tempFilePath, Buffer.from(fileBuffer));

  // Guardar copia local si se pidió
  let localFilePath: string | undefined;
  if (formattedFileName) {
    try {
      if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
        await fsPromises.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
      }
      localFilePath = path.join(LOCAL_STORAGE_PATH, formattedFileName);
      await fsPromises.copyFile(tempFilePath, localFilePath);
      console.log(`Copia local guardada en: ${localFilePath}`);
    } catch (err) {
      console.error('Error al guardar copia local:', err);
    }
  }

  return { tempPath: tempFilePath, localPath: localFilePath };
}

// Obtener o crear link compartido
async function getOrCreateSharedLink(dbx: Dropbox, filePathLower: string) {
  try {
    const created = await dbx.sharingCreateSharedLinkWithSettings({ path: filePathLower });
    return created.result.url.replace('?dl=0', '?dl=1');
  } catch (err: any) {
    const reason = err?.error?.error?.['.tag'];
    if (reason === 'shared_link_already_exists') {
      const list = await dbx.sharingListSharedLinks({ path: filePathLower, direct_only: true });
      const url = list.result.links?.[0]?.url;
      if (url) return url.replace('?dl=0', '?dl=1');
    }
    throw err;
  }
}

// ====== HANDLER ======
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  let tempFilePath: string | null = null;

  try {
    if (uploadTracker.hasExceededLimit(clientIp)) {
      uploadTracker.addUpload(clientIp, '', '', 'failed', 'Límite de subidas excedido');
      return NextResponse.json(
        { success: false, message: 'Has excedido el límite de 3 subidas por hora.', recentUploads: uploadTracker.getRecentUploads(clientIp) },
        { status: 429 }
      );
    }

    const { nombreCompleto, dni, correo, archivos } = await parseFormData(req);

    // Validar número de archivos
    if (archivos.length > 10) {
      return NextResponse.json(
        { success: false, message: 'Máximo 10 archivos permitidos', recentUploads: uploadTracker.getRecentUploads(clientIp) },
        { status: 400 }
      );
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validar cada archivo
    for (const archivo of archivos) {
      if (!allowed.includes(archivo.type)) {
        return NextResponse.json(
          { success: false, message: `Tipo de archivo no permitido: ${archivo.name}`, recentUploads: uploadTracker.getRecentUploads(clientIp) },
          { status: 400 }
        );
      }
      if (archivo.size > maxSize) {
        return NextResponse.json(
          { success: false, message: `Archivo ${archivo.name} excede el tamaño máximo de 5MB`, recentUploads: uploadTracker.getRecentUploads(clientIp) },
          { status: 400 }
        );
      }
    }

    const sanitizedName = sanitize(nombreCompleto);
    const sanitizedDni = sanitize(dni);
    const sanitizedCorreo = sanitize(correo, true);

    // Crear cliente Dropbox con token auto-renovable
    const dbx = await createDropboxClient();

    const uploadedFiles: Array<{ fileName: string; fileId: string; link: string | null }> = [];
    const tempFiles: string[] = [];

    // Subir cada archivo
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const ext = getExtension(archivo.name);
      const formattedFileName = archivos.length === 1
        ? `${sanitizedName}_${sanitizedDni}_${sanitizedCorreo}${ext}`
        : `${sanitizedName}_${sanitizedDni}_${sanitizedCorreo}_${i + 1}${ext}`;

      const saved = await saveFileToDisk(archivo, formattedFileName);
      tempFiles.push(saved.tempPath);

      // Subir a Dropbox
      const buffer = await fsPromises.readFile(saved.tempPath);
      const fullDropboxPath = `${DROPBOX_FOLDER}/${formattedFileName}`.replace(/\/+/g, '/');

      console.log(`📤 Subiendo archivo ${i + 1}/${archivos.length} a Dropbox:`, fullDropboxPath);

      const uploadResponse: DropboxResponse<files.FileMetadata> = await dbx.filesUpload({
        path: fullDropboxPath,
        contents: buffer,
        mode: { '.tag': 'add' },
        autorename: true,
        mute: false,
      });

      const uploadedMeta = uploadResponse.result;
      const finalPathLower = uploadedMeta.path_lower!;
      const fileId = uploadedMeta.id;

      // Link compartido
      let link: string | null = null;
      try {
        link = await getOrCreateSharedLink(dbx, finalPathLower);
      } catch (linkError) {
        console.error('❌ Error generando link compartido:', JSON.stringify(linkError, null, 2));
      }

      uploadedFiles.push({
        fileName: path.basename(finalPathLower),
        fileId: link || fileId,
        link,
      });
    }

    // Limpiar archivos temporales
    for (const tempFile of tempFiles) {
      try {
        await fsPromises.unlink(tempFile);
      } catch (e) {
        console.error('Error eliminando archivo temporal:', e);
      }
    }

    uploadTracker.addUpload(clientIp, uploadedFiles[0].fileId, uploadedFiles.map(f => f.fileName).join(', '), 'success');

    return NextResponse.json({
      success: true,
      message: `${archivos.length} archivo(s) subido(s) exitosamente a Dropbox`,
      files: uploadedFiles,
      totalFiles: archivos.length,
      localStoragePath: LOCAL_STORAGE_PATH,
      recentUploads: uploadTracker.getRecentUploads(clientIp),
    });
  } catch (error: any) {
    console.error('❌ Error al subir a Dropbox:', JSON.stringify(error, null, 2));
    const msg = error?.error_summary || error?.message || 'Error desconocido al subir a Dropbox';
    uploadTracker.addUpload(clientIp, '', 'error', 'failed', msg);

    return NextResponse.json(
      { success: false, message: msg, recentUploads: uploadTracker.getRecentUploads(clientIp) },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath);
        console.log('🧹 Archivo temporal eliminado');
      } catch (e) {
        console.error('Error eliminando archivo temporal:', e);
      }
    }
  }
}
