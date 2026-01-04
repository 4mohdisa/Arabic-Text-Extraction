"use client"

import { useState, useEffect, useRef } from "react"
import ImageUpload from "@/components/image-upload"
import type { ExtractedText, ExtractionHistoryItem } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Copy, 
  Download, 
  FileText, 
  ImageIcon, 
  Clock, 
  Loader2, 
  X,
  Sparkles,
  Zap,
  Shield,
  Globe2,
  ArrowRight,
  CheckCircle2,
  ScanLine,
  FileImage,
  Languages,
  Cpu,
  ChevronDown
} from "lucide-react"
import Image from "next/image"

export default function Home() {
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeTab, setActiveTab] = useState<'extracted' | 'preview'>('extracted')
  const [historyItems, setHistoryItems] = useState<ExtractionHistoryItem[]>([])
  const extractorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem("extractionHistory")
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as ExtractionHistoryItem[]
        setHistoryItems(parsedHistory)
      } catch (error) {
        console.error("Failed to parse history:", error)
      }
    }
  }, [])

  const scrollToExtractor = () => {
    extractorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDataExtracted = (data: ExtractedText) => {
    setExtractedText(data)
    
    if (data.previewUrl && !data.content) {
      setActiveTab("preview")
      setIsExtracting(false)
      return
    }
    
    if (data.content) {
      setActiveTab("extracted")
      setIsExtracting(false)
      
      const newHistoryItem: ExtractionHistoryItem = {
        id: Date.now().toString(),
        title: data.sourceFile || "Untitled Document",
        ...data
      }
      
      const updatedHistory = [newHistoryItem, ...historyItems].slice(0, 10)
      setHistoryItems(updatedHistory)
      
      try {
        localStorage.setItem("extractionHistory", JSON.stringify(updatedHistory))
      } catch (error) {
        console.error("Failed to save history:", error)
      }
    } else {
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
      a.download = `visionextract-${new Date().getTime()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  
  const loadHistoryItem = (item: ExtractionHistoryItem) => {
    setExtractedText(item)
    setActiveTab("extracted")
  }

  const features = [
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "AI-Powered OCR",
      description: "Leverages GPT-4o Vision for unmatched accuracy in text recognition across complex layouts."
    },
    {
      icon: <Languages className="h-6 w-6" />,
      title: "Multi-Language Support",
      description: "Extract text in Arabic, English, Chinese, and 50+ languages with native script preservation."
    },
    {
      icon: <FileImage className="h-6 w-6" />,
      title: "Smart Preprocessing",
      description: "Automatic image enhancement, rotation correction, and document boundary detection."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Optimized pipeline delivers results in seconds, not minutes. Batch processing supported."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy First",
      description: "Your documents are processed securely and never stored on our servers."
    },
    {
      icon: <Globe2 className="h-6 w-6" />,
      title: "Format Flexible",
      description: "Supports JPG, PNG, WebP, PDF and more. Handles photos, scans, and screenshots."
    }
  ]

  const stats = [
    { value: "99.2%", label: "Accuracy Rate" },
    { value: "50+", label: "Languages" },
    { value: "<3s", label: "Avg. Processing" },
    { value: "10MB", label: "Max File Size" }
  ]

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 noise-overlay pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ScanLine className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Vision<span className="text-primary">Extract</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#extractor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Extract</a>
            <Button variant="default" size="sm" onClick={scrollToExtractor}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by GPT-4o Vision</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Extract Text from
              <br />
              <span className="gradient-text">Any Document</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform images and documents into editable text with AI precision. 
              Support for 50+ languages, complex layouts, and handwritten content.
            </p>

            {/* CTA Button */}
            <div className="flex items-center justify-center pt-4">
              <Button size="lg" className="h-14 px-8 text-base animate-pulse-glow" onClick={scrollToExtractor}>
                <ScanLine className="mr-2 h-5 w-5" />
                Start Extracting
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center pt-16">
            <button 
              onClick={scrollToExtractor}
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-xs uppercase tracking-widest">Scroll to Extract</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Advanced document processing capabilities powered by cutting-edge AI technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extractor Section */}
      <section id="extractor" ref={extractorRef} className="py-24 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Document Extractor</Badge>
            <h2 className="text-4xl font-bold mb-4">Extract Text Now</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload your document and watch the AI extract text with remarkable accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Upload Section */}
            <div className="lg:col-span-3">
              <Card className="h-full border-border/50 bg-card/50">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Upload</h3>
                      <p className="text-xs text-muted-foreground">Drop your document</p>
                    </div>
                  </div>
                  <ImageUpload onDataExtracted={handleDataExtracted} />
                </div>
              </Card>
            </div>

            {/* Middle Column - Extracted Text */}
            <div className="lg:col-span-6">
              <Card className="h-full border-border/50 bg-card/50 min-h-[500px]">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold">Extracted Content</span>
                    </div>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'extracted' | 'preview')}>
                      <TabsList className="h-9">
                        <TabsTrigger value="extracted" className="text-xs px-3">Text</TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs px-3">Preview</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                
                <div className="p-4">
                  <Tabs value={activeTab} className="w-full">
                    <TabsContent value="extracted" className="m-0">
                      {extractedText?.content ? (
                        <div className="relative">
                          <div className="absolute top-0 right-0 flex items-center gap-1 z-10">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                              onClick={handleCopyText}
                              title="Copy text"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                              onClick={handleDownloadText}
                              title="Download text"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
                              onClick={() => setExtractedText(null)}
                              title="Clear text"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {extractedText.ocrEngine && (
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {extractedText.ocrEngine === 'gpt4o' ? 'GPT-4o Vision' : 
                                 extractedText.ocrEngine === 'tesseract' ? 'Tesseract OCR' : 
                                 extractedText.ocrEngine}
                              </Badge>
                              {extractedText.language && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  <Languages className="h-3 w-3 mr-1" />
                                  {extractedText.language}
                                </Badge>
                              )}
                              {extractedText.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {extractedText.confidence}% confidence
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <ScrollArea className="h-[380px] pr-4">
                            <div 
                              className="whitespace-pre-wrap leading-relaxed text-sm font-mono"
                            >
                              {extractedText.content}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : isExtracting ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20" />
                          </div>
                          <p className="mt-6 font-medium">Extracting text...</p>
                          <p className="text-sm text-muted-foreground mt-1">AI is analyzing your document</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <ScanLine className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-muted-foreground">No text extracted yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Upload a document to get started</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="preview" className="m-0">
                      <div className="flex items-center justify-center min-h-[400px]">
                        {extractedText?.previewUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-border/50">
                            <Image 
                              src={extractedText.previewUrl} 
                              alt="Document preview"
                              className="max-w-full h-auto max-h-[400px] object-contain"
                              width={500}
                              height={700}
                              style={{ width: 'auto', height: 'auto' }}
                            />
                          </div>
                        ) : isExtracting ? (
                          <div className="text-center">
                            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                            <p className="font-medium">Processing document...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-muted-foreground">No preview available</p>
                            <p className="text-sm text-muted-foreground mt-1">Upload a document to see preview</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            </div>

            {/* Right Column - History Panel */}
            <div className="lg:col-span-3">
              <Card className="h-full border-border/50 bg-card/50">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">History</h3>
                      <p className="text-xs text-muted-foreground">Recent extractions</p>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="h-[420px]">
                  <div className="p-4">
                    {historyItems.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No history yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Your extractions will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {historyItems.map((item, index) => (
                          <div key={item.id}>
                            <button 
                              className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                              onClick={() => loadHistoryItem(item)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(item.extractedAt).toLocaleDateString()} • {new Date(item.extractedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {item.content ? item.content.substring(0, 40) + "..." : ""}
                                  </p>
                                </div>
                              </div>
                            </button>
                            {index < historyItems.length - 1 && <Separator className="my-2" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ScanLine className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">VisionExtract</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VisionExtract. Built by{" "}
              <a 
                href="https://github.com/4mohdisa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                @4mohdisa
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
