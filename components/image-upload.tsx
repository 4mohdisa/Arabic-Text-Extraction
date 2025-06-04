"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, File as FileIcon, X, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { extractDataFromImage } from "@/app/actions/openai.action"
import type { ExtractedText } from "@/types"

interface ImageUploadProps {
  onDataExtracted: (data: ExtractedText) => void
}

export default function ImageUpload({ onDataExtracted }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'enhancing'>('idle');
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      createPreview(selectedFile)
    }
  }
  
  const createPreview = (file: File) => {
    // Clear previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Create new preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Pass the preview URL to the parent component
    onDataExtracted({
      content: '',
      sourceFile: file.name,
      extractedAt: new Date().toISOString(),
      previewUrl: url
    } as ExtractedText)
  }
  
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
  }, [])
  
  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setExtractedText(null);
    setUploadStatus('idle');
    setIsLoading(false);
  };

  const handleUpload = async () => {
    if (!file) return

    setIsLoading(true)
    setUploadStatus('uploading')
    
    try {
      // Show uploading state for a moment
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Convert file to base64
      const buffer = await file.arrayBuffer()
      const base64Image = Buffer.from(buffer).toString('base64')
      
      // Show enhancing state
      setUploadStatus('enhancing')
      
      // After a short delay, change to processing status
      setTimeout(() => setUploadStatus('processing'), 2000)
      
      // Call OpenAI API
      const result = await extractDataFromImage(base64Image)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract Arabic text')
      }

      // Update the extracted text with the file name and preview URL
      const extractedData: ExtractedText = {
        ...result.data,
        sourceFile: file.name,
        previewUrl: previewUrl || undefined
      }
      
      setExtractedText(extractedData)
      onDataExtracted(extractedData)
      
      toast({
        title: "Success",
        description: "Arabic text successfully extracted from image",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract Arabic text",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setUploadStatus('idle')
    }
  }

  const handleCopyToClipboard = () => {
    if (extractedText?.content) {
      navigator.clipboard.writeText(extractedText.content)
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      })
    }
  }

  const handleDownloadText = () => {
    if (extractedText?.content) {
      const blob = new Blob([extractedText.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `extracted-arabic-text-${new Date().getTime()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div 
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
          ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
        onClick={handleButtonClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadStatus === 'idle' && !file && (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports JPG, PNG, and PDF files</p>
          </>
        )}
        
        {uploadStatus === 'idle' && file && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover rounded-md" 
                  />
                ) : (
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between w-full mb-2">
              <div>
                <p className="text-sm font-medium truncate max-w-[180px]">
                  {file.name.length > 25 ? file.name.substring(0, 22) + "..." : file.name}
                </p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={handleClear}
                type="button"
                disabled={isLoading}
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        
        {uploadStatus === 'uploading' && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium mb-1">Uploading document...</p>
            <p className="text-xs text-muted-foreground">Please wait while we prepare your file</p>
          </>
        )}
        
        {uploadStatus === 'enhancing' && (
          <>
            <div className="relative mb-3">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-primary/20"></div>
              </div>
            </div>
            <p className="text-sm font-medium mb-1">Enhancing image quality...</p>
            <p className="text-xs text-muted-foreground">Improving contrast and clarity for better extraction</p>
          </>
        )}
        
        {uploadStatus === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium mb-1">Extracting Arabic text...</p>
            <p className="text-xs text-muted-foreground">Analyzing document content with AI</p>
          </>
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
        className="w-full"
        variant="default"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Extracting text...'}
          </>
        ) : (
          'Extract Arabic Text'
        )}
      </Button>
    </div>
  )
}
