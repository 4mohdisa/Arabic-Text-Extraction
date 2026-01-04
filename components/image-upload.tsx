"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, File as FileIcon, X, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ExtractedText } from "@/types"
import Image from "next/image"

interface ImageUploadProps {
  onDataExtracted: (data: ExtractedText) => void
}

export default function ImageUpload({ onDataExtracted }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'enhancing' | 'processing' | 'success' | 'error'>('idle')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const statusResetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      createPreview(selectedFile)
    }
  }
  
  // Bug 1 Fix: Use ref to track previous URL and avoid circular dependency
  const prevPreviewUrlRef = useRef<string>('')
  
  const createPreview = useCallback((file: File) => {
    // Revoke the previous URL using the ref (not state)
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current)
    }
    
    const url = URL.createObjectURL(file)
    prevPreviewUrlRef.current = url
    setPreviewUrl(url)
    
    onDataExtracted({
      content: '',
      sourceFile: file.name,
      extractedAt: new Date().toISOString(),
      previewUrl: url
    } as ExtractedText)
  }, [onDataExtracted]) // Removed previewUrl from dependencies
  
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      createPreview(droppedFile)
    }
  }, [createPreview])
  
  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Clean up the preview URL
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current)
      prevPreviewUrlRef.current = ''
    }
    
    setFile(null)
    setPreviewUrl('')
    setUploadStatus('idle')
    setIsLoading(false)
    
    // Clear any pending timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current)
      statusResetTimeoutRef.current = null
    }
    
    onDataExtracted({
      content: '',
      sourceFile: '',
      extractedAt: new Date().toISOString(),
    })
  }

  // Helper to clear processing timeout
  const clearProcessingTimeout = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
  }

  // Helper to clear status reset timeout
  const clearStatusResetTimeout = () => {
    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current)
      statusResetTimeoutRef.current = null
    }
  }

  const handleUpload = async () => {
    if (!file) return

    // Clear any existing timeouts before starting
    clearProcessingTimeout()
    clearStatusResetTimeout()

    setIsLoading(true)
    setUploadStatus('uploading')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const buffer = await file.arrayBuffer()
      const base64Image = Buffer.from(buffer).toString('base64')
      
      setUploadStatus('enhancing')
      
      // Bug 2 Fix: Store timeout reference so we can cancel it
      processingTimeoutRef.current = setTimeout(() => {
        setUploadStatus('processing')
      }, 1500)
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image }),
      })
      
      const result = await response.json()

      // Bug 2 Fix: Clear the processing timeout before setting final status
      clearProcessingTimeout()

      if (!result.success || !result.data) {
        toast({
          title: "Extraction Failed",
          description: result.error || "Could not extract text from this document. Try a different image.",
          variant: "destructive",
        })
        setIsLoading(false)
        setUploadStatus('error')
        statusResetTimeoutRef.current = setTimeout(() => setUploadStatus('idle'), 2000)
        return
      }

      const extractedData: ExtractedText = {
        ...result.data,
        sourceFile: file.name,
        previewUrl: previewUrl || undefined
      }
      
      onDataExtracted(extractedData)
      setUploadStatus('success')
      
      toast({
        title: "Success",
        description: "Text successfully extracted from document",
      })
      
      statusResetTimeoutRef.current = setTimeout(() => setUploadStatus('idle'), 2000)
    } catch (error) {
      // Bug 2 Fix: Clear the processing timeout on error too
      clearProcessingTimeout()
      
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract text",
        variant: "destructive",
      })
      setUploadStatus('error')
      statusResetTimeoutRef.current = setTimeout(() => setUploadStatus('idle'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusContent = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <>
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <p className="text-sm font-medium mt-3">Uploading...</p>
            <p className="text-xs text-muted-foreground">Preparing your document</p>
          </>
        )
      case 'enhancing':
        return (
          <>
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary/20 animate-ping" />
              </div>
            </div>
            <p className="text-sm font-medium mt-3">Enhancing...</p>
            <p className="text-xs text-muted-foreground">Optimizing image quality</p>
          </>
        )
      case 'processing':
        return (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium mt-3">Extracting text...</p>
            <p className="text-xs text-muted-foreground">AI is analyzing content</p>
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium mt-3 text-green-500">Complete!</p>
            <p className="text-xs text-muted-foreground">Text extracted successfully</p>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium mt-3 text-destructive">Failed</p>
            <p className="text-xs text-muted-foreground">Please try again</p>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div 
        className={`
          relative flex flex-col items-center justify-center rounded-xl p-6 transition-all cursor-pointer
          border-2 border-dashed
          ${dragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'}
          ${isLoading ? 'pointer-events-none' : ''}
        `}
        onClick={!isLoading ? handleButtonClick : undefined}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadStatus !== 'idle' ? (
          <div className="flex flex-col items-center py-4">
            {getStatusContent()}
          </div>
        ) : !file ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">Drop your document here</p>
            <p className="text-xs text-muted-foreground text-center">
              or click to browse
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-3">
              {['JPG', 'PNG', 'PDF', 'WebP'].map((format) => (
                <span 
                  key={format} 
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {previewUrl ? (
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover" 
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0" 
                onClick={handleClear}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <Input
          ref={inputRef}
          id="picture"
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={isLoading}
          className="hidden"
        />
      </div>
      
      <Button 
        onClick={handleUpload}
        disabled={!file || isLoading}
        className="w-full h-11 font-medium"
        variant="default"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Extract Text
          </>
        )}
      </Button>
    </div>
  )
}
