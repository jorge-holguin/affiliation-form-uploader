# 🚀 Guía de Deployment en Vercel

## Problema Actual

El error **401 (expired_access_token)** en producción ocurre porque:
1. Las variables de entorno no están configuradas en Vercel
2. El archivo `.env` solo funciona en desarrollo local

---

## ✅ Solución: Configurar Variables de Entorno

### Paso 1: Acceder a la Configuración

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **almip.com**
3. Haz clic en **Settings** (en el menú superior)
4. En el menú lateral, selecciona **Environment Variables**

### Paso 2: Agregar las Variables

Haz clic en **Add New** y agrega cada una de estas variables:

#### Variable 1: DROPBOX_CLIENT_ID
```
Name: DROPBOX_CLIENT_ID
Value: 9luel6tahlh5d40
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 2: DROPBOX_CLIENT_SECRET
```
Name: DROPBOX_CLIENT_SECRET
Value: 933ku5zxgjtwoiz
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 3: DROPBOX_ACCESS_TOKEN
```
Name: DROPBOX_ACCESS_TOKEN
Value: [Copia el valor completo de tu archivo .env]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 4: DROPBOX_REFRESH_TOKEN
```
Name: DROPBOX_REFRESH_TOKEN
Value: EZVYX5Jcrj8AAAAAAAAALra5CrcTZU94WEL3OinmSUA
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 5: DROPBOX_FOLDER
```
Name: DROPBOX_FOLDER
Value: /PDF_Defensor_Democracia
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### Paso 3: Guardar y Re-deployar

1. Después de agregar todas las variables, haz clic en **Save**
2. Ve a la pestaña **Deployments**
3. Encuentra el último deployment
4. Haz clic en el menú de 3 puntos `⋮`
5. Selecciona **Redeploy**
6. Confirma el redeploy

---

## 🔄 Alternativa: Re-deploy desde Git

Si prefieres hacer push desde tu terminal:

```bash
# Hacer un commit vacío para forzar redeploy
git commit --allow-empty -m "Redeploy con variables de entorno configuradas"
git push
```

---

## 📝 Verificar que Funciona

Después del redeploy:

1. Ve a https://almip.com/
2. Intenta subir un archivo
3. Verifica que no aparezca el error 401
4. Revisa los logs en Vercel:
   - Ve a tu proyecto → **Deployments**
   - Haz clic en el deployment activo
   - Ve a la pestaña **Functions**
   - Busca `/api/upload` y revisa los logs

Deberías ver mensajes como:
- `✅ Usando token en cache (válido)` 
- `🔄 Refrescando access token de Dropbox...`
- `✅ Token refrescado exitosamente`

---

## 🔐 Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Variables de entorno separadas**: Las credenciales no están en el código
2. **Refresh tokens**: Los tokens se renuevan automáticamente cada 4 horas
3. **Cache en memoria**: Reduce llamadas innecesarias a la API de Dropbox
4. **`.gitignore` configurado**: Los archivos sensibles no se suben a Git

### ⚠️ Importante

- **NUNCA** hagas commit del archivo `.env` a Git
- **NUNCA** compartas tus tokens en público
- Si crees que tus tokens fueron comprometidos, revócalos inmediatamente en [Dropbox App Console](https://www.dropbox.com/developers/apps)

---

## 🐛 Troubleshooting

### Error: "No se encontró DROPBOX_ACCESS_TOKEN ni DROPBOX_REFRESH_TOKEN"

**Causa**: Las variables de entorno no están configuradas en Vercel

**Solución**: 
1. Verifica que agregaste todas las variables en Settings → Environment Variables
2. Asegúrate de haber seleccionado "Production" en cada variable
3. Haz un redeploy después de agregar las variables

### Error: "Failed to refresh token: 400"

**Causa**: El `DROPBOX_CLIENT_ID` o `DROPBOX_CLIENT_SECRET` son incorrectos

**Solución**:
1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Verifica que los valores coincidan con tu app
3. Actualiza las variables en Vercel si es necesario

### Error: "Failed to refresh token: 401"

**Causa**: El `DROPBOX_REFRESH_TOKEN` ha sido revocado o es inválido

**Solución**:
1. Genera un nuevo refresh token siguiendo la guía en `DROPBOX_TOKEN_SETUP.md`
2. Actualiza la variable `DROPBOX_REFRESH_TOKEN` en Vercel
3. Haz un redeploy

### Los archivos se suben pero no aparecen en Dropbox

**Causa**: La ruta `DROPBOX_FOLDER` no existe o no tienes permisos

**Solución**:
1. Verifica que la carpeta `/PDF_Defensor_Democracia` existe en tu Dropbox
2. Si no existe, créala manualmente
3. Verifica que tu app tenga permisos de escritura

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. Ve a tu proyecto en Vercel
2. Haz clic en **Deployments**
3. Selecciona el deployment activo
4. Ve a **Functions** → `/api/upload`
5. Aquí verás todos los logs de las subidas

### Métricas Útiles

- **Invocations**: Número de veces que se llamó a la API
- **Errors**: Errores que ocurrieron
- **Duration**: Tiempo promedio de ejecución
- **Bandwidth**: Datos transferidos

---

## 🎯 Checklist de Deployment

Antes de hacer deploy, verifica:

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] El archivo `.env` está en `.gitignore`
- [ ] Has probado la subida en local y funciona
- [ ] Has verificado que la carpeta de Dropbox existe
- [ ] Has hecho redeploy después de agregar las variables

---

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
