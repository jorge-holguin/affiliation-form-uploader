'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, FileText, RefreshCw } from 'lucide-react';

export default function DropboxAuthPage() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = () => {
    window.location.href = '/api/dropbox/authorize';
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/dropbox/test-auth');
      const data = await response.json();

      if (response.ok) {
        setTestResult(data);
      } else {
        setError(data.error || 'Test failed');
        setTestResult(data);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dropbox OAuth2 Authentication</h1>
        <p className="text-muted-foreground">
          Gestiona la autenticación de tu aplicación con Dropbox
        </p>
      </div>

      <div className="grid gap-6">
        {/* Card de Autorización */}
        <Card>
          <CardHeader>
            <CardTitle>1. Autorizar Aplicación</CardTitle>
            <CardDescription>
              Inicia el flujo OAuth2 para obtener acceso a Dropbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Haz clic en el botón para autorizar la aplicación <strong>PDF_Defensor_Democracia</strong> en Dropbox.
              Serás redirigido a Dropbox para aprobar los permisos.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAuthorize} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Autorizar con Dropbox
              </Button>
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Permisos solicitados:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Leer contenido de archivos</li>
                <li>Escribir contenido de archivos</li>
                <li>Leer metadatos de archivos</li>
                <li>Escribir metadatos de archivos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card de Prueba */}
        <Card>
          <CardHeader>
            <CardTitle>2. Probar Conexión</CardTitle>
            <CardDescription>
              Verifica que la autenticación funciona correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Después de autorizar, prueba la conexión para verificar que los tokens funcionan.
            </p>
            <Button 
              onClick={handleTest} 
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Probar Conexión
                </>
              )}
            </Button>

            {/* Resultado de la prueba */}
            {testResult && (
              <div className={`p-4 rounded-md border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">
                      {testResult.success ? '✅ Conexión exitosa' : '❌ Error de conexión'}
                    </h4>
                    
                    {testResult.success && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Cuenta:</strong> {testResult.account?.name} ({testResult.account?.email})
                        </div>
                        <div>
                          <strong>Carpeta:</strong> {testResult.folder || '/'}
                        </div>
                        <div>
                          <strong>Archivos encontrados:</strong> {testResult.filesCount}
                        </div>
                        <div>
                          <strong>Estado del token:</strong> {
                            testResult.tokenStatus?.wasExpired 
                              ? '🔄 Token refrescado automáticamente' 
                              : '✅ Token válido'
                          }
                        </div>
                        
                        {testResult.files && testResult.files.length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer font-semibold">
                              Ver archivos ({testResult.files.length})
                            </summary>
                            <ul className="mt-2 space-y-1 pl-4">
                              {testResult.files.map((file: any, idx: number) => (
                                <li key={idx} className="text-xs">
                                  📄 {file.name} ({file.type})
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="text-sm">
                        <strong>Error:</strong> {error}
                        {testResult.message && (
                          <div className="mt-2 text-xs">{testResult.message}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Información */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Información Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>App Name:</strong> PDF_Defensor_Democracia
            </div>
            <div>
              <strong>Client ID:</strong> <code className="bg-muted px-2 py-1 rounded">9luel6tahlh5d40</code>
            </div>
            <div>
              <strong>Redirect URI:</strong> <code className="bg-muted px-2 py-1 rounded">https://almip.com/oauth/callback</code>
            </div>
            <div>
              <strong>Token Type:</strong> Offline (con refresh token)
            </div>
            <div className="pt-2 border-t">
              <strong>Archivos creados:</strong>
              <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground space-y-1">
                <li><code>/app/api/dropbox/authorize/route.ts</code> - Inicia OAuth</li>
                <li><code>/app/api/dropbox/callback/route.ts</code> - Maneja callback</li>
                <li><code>/lib/refreshDropboxToken.ts</code> - Gestión de tokens</li>
                <li><code>/lib/dropboxClient.ts</code> - Cliente con auto-refresh</li>
                <li><code>/tokens.json</code> - Tokens guardados (gitignored)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
