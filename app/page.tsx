"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Upload, Shield, CheckCircle, FileText, Users, Eye, AlertCircle, X } from "lucide-react"
import { generateAffiliationPDF } from "@/components/pdf-generator"
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer"
import UploadHistory from "@/components/upload-history"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HomePage() {
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    email: "",
    archivos: [] as File[],
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<{ current: number; total: number } | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    fileId?: string
    link?: string
    localPath?: string
    localStoragePath?: string
    recentUploads?: Array<{
      ip: string
      timestamp: number
      fileId: string
      fileName: string
      status: "success" | "failed"
      errorMessage?: string
    }>
  } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validar número de archivos
    if (files.length > 10) {
      alert("Solo puedes subir un máximo de 10 archivos")
      e.target.value = ""
      return
    }
    
    // Validar tamaño de cada archivo (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024
    const invalidFiles = files.filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      alert(`Los siguientes archivos exceden el tamaño máximo de 5MB:\n${invalidFiles.map(f => `- ${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join('\n')}`)
      e.target.value = ""
      return
    }
    
    setFormData((prev) => ({ ...prev, archivos: files }))
  }

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== index)
    }))
    
    // Limpiar el input si no quedan archivos
    if (formData.archivos.length === 1) {
      const fileInput = document.getElementById('archivo') as HTMLInputElement
      if (fileInput) fileInput.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.dni || !formData.email || formData.archivos.length === 0) {
      alert("Por favor complete todos los campos y adjunte al menos un archivo")
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // PASO 1: Comprimir archivos si es necesario
      setIsCompressing(true)
      console.log('📦 Comprimiendo archivos...')
      
      const archivosOptimizados: File[] = []
      for (let i = 0; i < formData.archivos.length; i++) {
        setCompressionProgress({ current: i + 1, total: formData.archivos.length })
        const archivo = formData.archivos[i]
        
        // Importar dinámicamente la librería de compresión
        try {
          const { processFile } = await import('@/lib/file-compression')
          const resultado = await processFile(archivo)
          archivosOptimizados.push(resultado.file)
          
          if (resultado.compressed) {
            console.log(`✅ ${archivo.name}: ${(resultado.originalSize / 1024 / 1024).toFixed(2)}MB → ${(resultado.compressedSize / 1024 / 1024).toFixed(2)}MB`)
          }
        } catch (error) {
          console.warn('⚠️ No se pudo comprimir, usando archivo original:', error)
          archivosOptimizados.push(archivo)
        }
      }
      
      setIsCompressing(false)
      setCompressionProgress(null)
      console.log('✅ Compresión completada')
      
      // PASO 2: Enviar archivos
      console.log('Preparando formulario para envío...')
      const apiFormData = new FormData()
      apiFormData.append("nombreCompleto", formData.nombre)
      apiFormData.append("dni", formData.dni)
      apiFormData.append("correo", formData.email)
      
      // Agregar archivos optimizados
      archivosOptimizados.forEach((file, index) => {
        apiFormData.append(`archivo${index}`, file)
      })
      apiFormData.append("totalArchivos", archivosOptimizados.length.toString())

      console.log('Enviando archivo a Dropbox...')
      const response = await fetch("/api/upload", {
        method: "POST",
        body: apiFormData,
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Respuesta recibida:', result)
      setUploadResult(result)

      if (result.success) {
        console.log('Archivo subido exitosamente a Dropbox')
        setIsSubmitted(true)
        setFormData({
          nombre: "",
          dni: "",
          email: "",
          archivos: [],
        })
        // Limpiar el input de archivos
        const fileInput = document.getElementById('archivo') as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        console.error('Error en la respuesta:', result.message)
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error)
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al enviar el formulario",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    try {
      await generateAffiliationPDF()
      console.log('PDF generado correctamente')
    } catch (error) {
      console.error('Error al generar el PDF:', error)
      alert('Hubo un problema al generar el PDF. Por favor intente nuevamente.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="RENMIP Logo" 
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <div>
              {/* Acrónimo como nombre corto principal */}
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                RENMIP
              </h1>

              {/* Nombre completo como subtítulo */}
              <p className="mt-2 text-base md:text-lg font-medium leading-snug text-primary-foreground/90 max-w-3xl">
                Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías que defendieron la Democracia entre 1980 - 1997
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Mission Statement */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Únete a Nuestra Red</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            RENMIP agrupa a los Técnicos, Sub Oficiales y Licenciados de las Fuerzas Armadas y de la Policía Nacional 
            que defendieron la democracia entre 1980 y 1997. Nuestra misión es preservar 
            la memoria, velar por los derechos de nuestros integrantes y contribuir a un Perú 
            más justo y seguro.
          </p>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-accent mx-auto mb-2" />
              <CardTitle>Unidad y Hermandad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fortalecemos los lazos entre licenciados y sus familias, promoviendo la solidaridad y el respeto mutuo.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-accent mx-auto mb-2" />
              <CardTitle>Defensa del Legado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Custodiamos el honor de quienes sirvieron a la Patria y defendieron la democracia en tiempos difíciles.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 text-accent mx-auto mb-2" />
              <CardTitle>Derechos y Reconocimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Impulsamos iniciativas para el reconocimiento social, histórico y legal de nuestros miembros.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Download Section */}
        <section>
          <Card className="bg-secondary/10 border-secondary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Download className="w-6 h-6 text-accent" />
                Descarga tu Ficha de Afiliación
              </CardTitle>
              <CardDescription className="text-lg">
                Forma parte de RENMIP y únete al reconocimiento de los hombres y mujeres que defendieron la democracia
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 font-semibold px-6 py-3 text-lg">
                      <Eye className="w-5 h-5 mr-2" />
                      Vista Previa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/90 to-primary/70 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-6 h-6 text-white/90" />
                          <DialogTitle className="text-xl font-semibold">Ficha de Afiliación</DialogTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={handleDownload} size="sm" variant="secondary" className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30">
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDF
                          </Button>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="p-0 h-[calc(90vh-80px)] overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
                      <div className="h-full overflow-y-auto overflow-x-auto px-8 py-8 flex justify-center items-start">
                        <div className="w-full max-w-[750px] bg-white shadow-xl rounded-lg border border-gray-200 mx-auto print:shadow-none print:border-0">
                          <div className="relative">
                            <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity">
                              <Button 
                                onClick={handleDownload} 
                                size="sm" 
                                variant="outline" 
                                className="bg-white/80 hover:bg-white border border-gray-200"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                            <MarkdownRenderer filePath="/md/afiliacion-renmip.md" hideHeader={true} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleDownload} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Ficha
                </Button>
              </div>
              <p className="text-muted-foreground">Descarga el documento, complétalo y fírmalo</p>
            </CardContent>
          </Card>
        </section>

        {/* Upload Section */}
        <section>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Envía tu Ficha Firmada
              </CardTitle>
              <CardDescription className="text-lg">
                Con tu afiliación reafirmas tu compromiso con RENMIP y con la defensa de la democracia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="py-8 space-y-4 text-center">
                  <CheckCircle className="w-16 h-16 text-success mx-auto" />
                  <h3 className="text-xl font-semibold text-success mt-4">¡Tus documentos han sido recibidos correctamente!</h3>
                  <p className="text-muted-foreground">Gracias por afiliarte a RENMIP. Nos pondremos en contacto contigo pronto.</p>

                  {uploadResult && 'totalFiles' in uploadResult && (uploadResult as any).totalFiles && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        📦 {(uploadResult as any).totalFiles} archivo(s) subido(s) exitosamente
                      </p>
                    </div>
                  )}

                  {uploadResult?.recentUploads && uploadResult.recentUploads.length > 0 && (
                    <div className="mt-8">
                      <UploadHistory uploads={uploadResult.recentUploads} />
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI *</Label>
                      <Input
                        id="dni"
                        name="dni"
                        type="text"
                        required
                        value={formData.dni}
                        onChange={handleInputChange}
                        placeholder="Número de documento"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archivo">Documentos (Ficha Firmada + Documentos Requeridos) *</Label>
                    <Input
                      id="archivo"
                      name="archivo"
                      type="file"
                      required
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
                    />
                    {formData.archivos.length > 0 && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">Archivos seleccionados ({formData.archivos.length}/10):</p>
                        <ul className="text-sm space-y-2">
                          {formData.archivos.map((file, index) => (
                            <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 group">
                              <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                              <span className="truncate flex-1">{file.name}</span>
                              <span className="text-muted-foreground text-xs flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="ml-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                aria-label="Remover archivo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">Formatos: PDF, JPG, PNG | Máximo: 10 archivos de 5MB cada uno</p>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary-hover font-semibold" disabled={isUploading || isCompressing}>
                    {isCompressing ? (
                      <>
                        <div className="animate-spin w-5 h-5 mr-2 border-2 border-t-transparent border-white rounded-full" />
                        Comprimiendo archivos... {compressionProgress && `(${compressionProgress.current}/${compressionProgress.total})`}
                      </>
                    ) : isUploading ? (
                      <>
                        <div className="animate-spin w-5 h-5 mr-2 border-2 border-t-transparent border-white rounded-full" />
                        Subiendo a Dropbox...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Enviar Documentos
                      </>
                    )}
                  </Button>

                  {uploadResult && !uploadResult.success && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle />
                      <AlertTitle>Error al subir el archivo</AlertTitle>
                      <AlertDescription>{uploadResult.message}</AlertDescription>
                    </Alert>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              © 2025 RENMIP – Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías que defendieron la Democracia entre 1980 - 1997
            </p>
            <p className="text-sm text-muted-foreground">
              Honrando a quienes defendieron la democracia. Unidad, memoria y justicia.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
