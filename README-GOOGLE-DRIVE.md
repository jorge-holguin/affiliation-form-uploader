# Google Drive Integration

Este proyecto incluye integración con Google Drive para subir archivos de afiliación.

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
# Credenciales de Google Drive
GOOGLE_PROJECT_ID=tu-project-id
GOOGLE_CLIENT_EMAIL=tu-service-account-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu-clave-privada-con-saltos-de-linea\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=id-de-la-carpeta-en-google-drive

# Configuración de entorno
NODE_ENV=development  # o 'production' en producción

# Variables para desarrollo
BYPASS_JWT_VALIDATION=true  # Evita el error de JWT en desarrollo
UPLOAD_LIMIT_BYPASS=true    # Evita el límite de subidas en desarrollo
```

### Configuración para Desarrollo vs Producción

En **desarrollo**:
- Establece `NODE_ENV=development`
- Establece `BYPASS_JWT_VALIDATION=true` para evitar errores de JWT expirado
- Establece `UPLOAD_LIMIT_BYPASS=true` para evitar límites de subidas

En **producción**:
- Establece `NODE_ENV=production`
- Elimina o establece a `false` las variables `BYPASS_JWT_VALIDATION` y `UPLOAD_LIMIT_BYPASS`
- Esto activará la validación de JWT y el límite de 3 subidas por hora

## Cómo obtener las credenciales de Google Drive

1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Drive
4. Crea una cuenta de servicio
5. Genera una clave JSON para la cuenta de servicio
6. Comparte la carpeta de Google Drive con la dirección de correo de la cuenta de servicio

## Estructura del API

El endpoint `/api/upload` acepta solicitudes POST con los siguientes campos:

- `nombreCompleto` (string): Nombre completo del afiliado
- `dni` (string): DNI del afiliado
- `correo` (string): Correo electrónico del afiliado
- `archivo` (File): Archivo PDF o imagen de la ficha firmada

### Ejemplo de uso con FormData

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('nombreCompleto', 'Juan Pérez');
  formData.append('dni', '12345678');
  formData.append('correo', 'juan@example.com');
  formData.append('archivo', fileInput.files[0]);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Archivo subido exitosamente');
      console.log('ID del archivo:', result.fileId);
      console.log('Link al archivo:', result.link);
    } else {
      console.error('Error al subir archivo:', result.message);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
};
```
