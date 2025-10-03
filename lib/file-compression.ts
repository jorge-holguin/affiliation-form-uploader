/**
 * Utilidades para compresión y optimización de archivos
 * - Comprime imágenes a ~1MB manteniendo calidad
 * - Optimiza PDFs removiendo metadata innecesaria
 */

import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressed: boolean;
  compressionRatio: number;
}

/**
 * Comprime una imagen a máximo 1MB
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  
  const options = {
    maxSizeMB: 1,              // Máximo 1MB
    maxWidthOrHeight: 1920,     // Resolución máxima
    useWebWorker: true,         // Usar Web Worker para no bloquear UI
    fileType: file.type as any,
    initialQuality: 0.8,        // Calidad inicial
  };

  try {
    console.log(`🖼️ Comprimiendo imagen: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(file, options);
    const compressedSize = compressedFile.size;
    
    console.log(`✅ Comprimido: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reducción)`);
    
    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressed: compressedSize < originalSize,
      compressionRatio: compressedSize / originalSize,
    };
  } catch (error) {
    console.error('❌ Error al comprimir imagen:', error);
    // Retornar original si falla
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressed: false,
      compressionRatio: 1,
    };
  }
}

/**
 * Optimiza un PDF removiendo metadata y comprimiendo si es posible
 */
export async function optimizePDF(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  
  try {
    console.log(`📄 Optimizando PDF: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });
    
    // Remover metadata innecesaria
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setKeywords([]);
    
    // Guardar con compresión
    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    
    const optimizedFile = new File([optimizedBytes], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    
    const compressedSize = optimizedFile.size;
    
    console.log(`✅ PDF optimizado: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reducción)`);
    
    return {
      file: optimizedFile,
      originalSize,
      compressedSize,
      compressed: compressedSize < originalSize,
      compressionRatio: compressedSize / originalSize,
    };
  } catch (error) {
    console.error('❌ Error al optimizar PDF:', error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressed: false,
      compressionRatio: 1,
    };
  }
}

/**
 * Procesa un archivo según su tipo
 * - Imágenes > 1MB: comprime
 * - PDFs > 2MB: optimiza
 * - Otros: retorna sin cambios
 */
export async function processFile(file: File): Promise<CompressionResult> {
  const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
  const isPDF = file.type === 'application/pdf';
  
  // Comprimir imágenes mayores a 1MB
  if (isImage && file.size > 1024 * 1024) {
    return await compressImage(file);
  }
  
  // Optimizar PDFs mayores a 2MB
  if (isPDF && file.size > 2 * 1024 * 1024) {
    return await optimizePDF(file);
  }
  
  // No necesita procesamiento
  return {
    file,
    originalSize: file.size,
    compressedSize: file.size,
    compressed: false,
    compressionRatio: 1,
  };
}

/**
 * Procesa múltiples archivos en paralelo
 */
export async function processFiles(files: File[]): Promise<CompressionResult[]> {
  console.log(`📦 Procesando ${files.length} archivo(s)...`);
  
  const results = await Promise.all(
    files.map(file => processFile(file))
  );
  
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const savedBytes = totalOriginal - totalCompressed;
  
  console.log(`✅ Procesamiento completo:
    - Original: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB
    - Comprimido: ${(totalCompressed / 1024 / 1024).toFixed(2)}MB
    - Ahorro: ${(savedBytes / 1024 / 1024).toFixed(2)}MB (${((savedBytes / totalOriginal) * 100).toFixed(1)}%)`);
  
  return results;
}

/**
 * Valida que el archivo sea del tipo correcto
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  
  return allowedTypes.includes(file.type);
}

/**
 * Valida el tamaño del archivo
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Formatea el tamaño de bytes a formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
