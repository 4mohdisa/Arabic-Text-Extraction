"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { minimalExtract } from "@/app/actions/minimal-action"
import { fixedExtract } from "@/app/actions/fixed-extract"
import { ExtractedText } from "@/types"

export default function TestAction() {
  const [result, setResult] = useState<ExtractedText | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testType, setTestType] = useState<'minimal' | 'fixed'>('minimal')

  const handleTest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create a simple base64 image for testing
      const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
      
      let response;
      if (testType === 'minimal') {
        // Call the minimal server action
        response = await minimalExtract()
      } else {
        // Call the fixed server action with a base64 image
        response = await fixedExtract(testBase64)
      }
      
      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Unknown error")
      }
    } catch (err) {
      console.error("Test action error:", err)
      setError(err instanceof Error ? err.message : "Failed to test server action")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-4">Server Action Test</h3>
      
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <input 
            type="radio" 
            id="minimal" 
            name="testType" 
            checked={testType === 'minimal'} 
            onChange={() => setTestType('minimal')}
          />
          <label htmlFor="minimal">Test Minimal Action</label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input 
            type="radio" 
            id="fixed" 
            name="testType" 
            checked={testType === 'fixed'} 
            onChange={() => setTestType('fixed')}
          />
          <label htmlFor="fixed">Test Fixed Action</label>
        </div>
      </div>
      
      <Button 
        onClick={handleTest}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? "Testing..." : `Test ${testType === 'minimal' ? 'Minimal' : 'Fixed'} Server Action`}
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
    </div>
  )
}
