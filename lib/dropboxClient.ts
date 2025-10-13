import { Dropbox } from 'dropbox';
import { getValidAccessToken } from './refreshDropboxToken';

/**
 * Crea y retorna un cliente de Dropbox autenticado con un access_token válido.
 * Automáticamente refresca el token si ha expirado.
 * 
 * @returns Una instancia configurada del cliente Dropbox
 */
export async function getDropboxClient(): Promise<Dropbox> {
  try {
    // Obtener un access_token válido (se refresca automáticamente si es necesario)
    const accessToken = await getValidAccessToken();

    // Crear y retornar el cliente de Dropbox
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch, // Usar el fetch nativo de Node.js/Edge Runtime
    });

    return dbx;
  } catch (error) {
    console.error('Error creating Dropbox client:', error);
    throw new Error(`Failed to create Dropbox client: ${error}`);
  }
}

/**
 * Ejemplo de uso del cliente para subir un archivo
 * 
 * @param filePath - Ruta en Dropbox donde se guardará el archivo (ej: '/PDF_Defensor_Democracia/archivo.pdf')
 * @param fileContent - Contenido del archivo como Buffer o Uint8Array
 * @returns Metadata del archivo subido
 */
export async function uploadFileToDropbox(
  filePath: string,
  fileContent: Buffer | Uint8Array
): Promise<any> {
  const dbx = await getDropboxClient();

  try {
    const response = await dbx.filesUpload({
      path: filePath,
      contents: fileContent,
      mode: { '.tag': 'overwrite' }, // Sobrescribir si ya existe
      autorename: false,
      mute: false,
    });

    console.log('✅ File uploaded successfully:', response.result.name);
    return response.result;
  } catch (error) {
    console.error('Error uploading file to Dropbox:', error);
    throw error;
  }
}

/**
 * Ejemplo de uso del cliente para descargar un archivo
 * 
 * @param filePath - Ruta del archivo en Dropbox (ej: '/PDF_Defensor_Democracia/archivo.pdf')
 * @returns El contenido del archivo como Buffer
 */
export async function downloadFileFromDropbox(filePath: string): Promise<Buffer> {
  const dbx = await getDropboxClient();

  try {
    const response = await dbx.filesDownload({ path: filePath });
    
    // @ts-ignore - El tipo de fileBlob puede variar según el entorno
    const fileBlob = response.result.fileBlob;
    
    if (fileBlob) {
      const arrayBuffer = await fileBlob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    throw new Error('No file content received from Dropbox');
  } catch (error) {
    console.error('Error downloading file from Dropbox:', error);
    throw error;
  }
}

/**
 * Lista archivos en una carpeta de Dropbox
 * 
 * @param folderPath - Ruta de la carpeta (ej: '/PDF_Defensor_Democracia')
 * @returns Lista de archivos y carpetas
 */
export async function listDropboxFiles(folderPath: string = ''): Promise<any> {
  const dbx = await getDropboxClient();

  try {
    const response = await dbx.filesListFolder({
      path: folderPath,
      recursive: false,
      include_deleted: false,
      include_mounted_folders: true,
    });

    console.log(`✅ Listed ${response.result.entries.length} items in ${folderPath || 'root'}`);
    return response.result.entries;
  } catch (error) {
    console.error('Error listing Dropbox files:', error);
    throw error;
  }
}
