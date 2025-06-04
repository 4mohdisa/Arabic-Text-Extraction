"use client"

import { useState, useEffect } from "react"
import ImageUpload from "@/components/image-upload"
import type { ExtractedText } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, FileText, ImageIcon, Clock, Loader2, X } from "lucide-react"

// Define a history item type
interface HistoryItem extends ExtractedText {
  id: string;
  title: string;
}

export default function Home() {
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeTab, setActiveTab] = useState("extracted")
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("extractionHistory")
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[]
        setHistoryItems(parsedHistory)
      } catch (error) {
        console.error("Failed to parse history:", error)
      }
    }
  }, [])

  const handleDataExtracted = (data: ExtractedText) => {
    setExtractedText(data)
    
    // If this is just a preview update (no content yet), switch to preview tab
    if (data.previewUrl && !data.content) {
      setActiveTab("preview")
      setIsExtracting(false)
      return
    }
    
    // If we have content, this is a completed extraction
    if (data.content) {
      console.log("Extracted text:", data.content.substring(0, 100) + "...")
      setActiveTab("extracted")
      setIsExtracting(false)
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        title: data.sourceFile || "Untitled Document",
        ...data
      }
      
      const updatedHistory = [newHistoryItem, ...historyItems].slice(0, 10) // Keep only 10 most recent
      setHistoryItems(updatedHistory)
      
      // Save to localStorage
      try {
        localStorage.setItem("extractionHistory", JSON.stringify(updatedHistory))
      } catch (error) {
        console.error("Failed to save history:", error)
      }
    } else {
      // If we don't have content yet, extraction is in progress
      setIsExtracting(true)
    }
  }

  const handleCopyText = () => {
    if (extractedText?.content) {
      navigator.clipboard.writeText(extractedText.content)
    }
  }

  const handleDownloadText = () => {
    if (extractedText?.content) {
      const blob = new Blob([extractedText.content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `arabic-text-${new Date().getTime()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  
  const loadHistoryItem = (item: HistoryItem) => {
    setExtractedText(item)
    setActiveTab("extracted")
  }

  return (
    <main className="container mx-auto p-6 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Arabic Text Extraction</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Upload an image or PDF containing Arabic text to extract the content using OpenAI Vision API. The extracted
          text will be displayed below and can be copied or downloaded.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Left Column - Upload Section */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload Document
              </CardTitle>
              <CardDescription>Upload an image or PDF file to extract Arabic text</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-120px)]">
              <div className="flex-1 flex items-center justify-center">
                <ImageUpload onDataExtracted={handleDataExtracted} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Tabs Section */}
        <div className="lg:col-span-6">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Tabs defaultValue="extracted" className="h-full flex flex-col">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="extracted" 
                      className="flex items-center gap-2"
                      onClick={() => setActiveTab("extracted")}
                    >
                      <FileText className="h-4 w-4" />
                      Extracted Text
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="flex items-center gap-2"
                      onClick={() => setActiveTab("preview")}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Document Preview
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="extracted" className="flex-1 px-6 pb-6 mt-4">
                  <div className="h-full flex flex-col">
                    {extractedText?.content ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={handleCopyText}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={handleDownloadText}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => {
                              setExtractedText(null);
                              setActiveTab('preview');
                              setIsExtracting(false);
                            }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Clear
                          </Button>
                        </div>
                        <ScrollArea className="flex-1 border rounded-md">
                          <Textarea
                            value={extractedText.content}
                            readOnly
                            className="min-h-[400px] resize-none border-0 focus-visible:ring-0"
                            style={{ direction: "rtl", fontSize: "1.2rem" }}
                          />
                        </ScrollArea>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No text extracted yet</p>
                          <p className="text-sm">Upload a document to see extracted text here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 px-6 pb-6 mt-4">
                  <div className="h-full flex items-center justify-center border rounded-md bg-muted/10 overflow-hidden">
                    {extractedText?.previewUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {extractedText.sourceFile?.toLowerCase().endsWith('.pdf') ? (
                          <div className="text-center p-4">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <p className="font-medium">PDF Preview</p>
                            <p className="text-sm text-muted-foreground mb-4">{extractedText.sourceFile}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(extractedText.previewUrl, '_blank')}
                            >
                              Open PDF
                            </Button>
                          </div>
                        ) : (
                          <img 
                            src={extractedText.previewUrl} 
                            alt="Document Preview" 
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    ) : isExtracting ? (
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                        <p>Analyzing document...</p>
                        <p className="text-sm text-muted-foreground">Extracting Arabic text with AI</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Document preview will appear here</p>
                        <p className="text-sm">Upload a document to see preview</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - History Panel */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                History
              </CardTitle>
              <CardDescription className="text-xs">Recent text extractions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="px-4 pb-4">
                  {historyItems.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">No extraction history yet</p>
                      <p className="text-xs mt-1">Extracted texts will appear here</p>
                    </div>
                  ) : (
                    historyItems.map((item, index) => (
                      <div key={item.id}>
                        <div 
                          className="py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                          onClick={() => loadHistoryItem(item)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-1 flex-shrink-0">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-medium text-xs truncate max-w-full">
                                {item.title.length > 18 ? item.title.substring(0, 18) + "..." : item.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate text-[10px]">
                                {new Date(item.extractedAt).toLocaleDateString()} {new Date(item.extractedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <div className="text-[10px] text-muted-foreground line-clamp-1 overflow-hidden" dir="rtl">
                                {item.content ? item.content.substring(0, 30) + "..." : ""}                                
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < historyItems.length - 1 && <Separator className="my-1" />}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
