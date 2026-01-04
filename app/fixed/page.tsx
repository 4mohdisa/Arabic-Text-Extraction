"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExtractedText } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function FixedPage() {
  const [result, setResult] = useState<ExtractedText | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create a simple base64 image for testing
      const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
      
      // Call the API route instead of server action
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image: testBase64 }),
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setResult(result.data)
      } else {
        setError(result.error || "Unknown error")
      }
    } catch (err) {
      console.error("API call error:", err)
      setError(err instanceof Error ? err.message : "Failed to call extraction API")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Fixed Server Action Test Page</h1>
      <p className="mb-6">This page tests the fixed server action implementation</p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Fixed Server Action</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleTest}
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : "Test Fixed Server Action"}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              <p className="font-medium">Success!</p>
              <p>Content: {result.content}</p>
              <p>OCR Engine: {result.ocrEngine}</p>
              <p>Extracted At: {result.extractedAt}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">Back to main page</Link>
      </div>
    </div>
  )
}
