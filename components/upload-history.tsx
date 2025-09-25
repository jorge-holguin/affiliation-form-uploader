"use client"

import React from "react"
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react"

interface UploadRecord {
  ip: string
  timestamp: number
  fileId: string
  fileName: string
  status: 'success' | 'failed'
  errorMessage?: string
}

interface UploadHistoryProps {
  uploads: UploadRecord[]
  className?: string
}

export default function UploadHistory({ uploads, className = "" }: UploadHistoryProps) {
  if (!uploads || uploads.length === 0) {
    return null
  }

  return (
    <div className={`mt-6 border rounded-md ${className}`}>
      <h3 className="font-medium p-3 border-b bg-muted/30">Historial de subidas recientes</h3>
      <div className="divide-y">
        {uploads.map((upload, index) => (
          <div key={index} className="p-3 flex items-start gap-3">
            {upload.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium truncate">{upload.fileName || "Archivo"}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(upload.timestamp), { addSuffix: true, locale: es })}
              </div>
              {upload.errorMessage && (
                <div className="text-sm text-destructive mt-1">{upload.errorMessage}</div>
              )}
            </div>
            {upload.status === 'success' && (
              <>
                {upload.fileId && (
                  <a 
                    href={upload.fileId.startsWith('http') 
                      ? upload.fileId 
                      : upload.fileId.startsWith('/') 
                        ? `https://www.dropbox.com/home${upload.fileId}` 
                        : `https://www.dropbox.com/home/${upload.fileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                    onClick={(e) => {
                      if (!upload.fileId || upload.fileId === 'error') {
                        e.preventDefault();
                        alert('No se puede acceder al archivo en este momento.');
                      }
                    }}
                  >
                    <span>Ver</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
