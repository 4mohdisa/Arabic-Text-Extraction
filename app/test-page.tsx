"use client"

import TestAction from "@/components/test-action"

export default function TestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Server Action Test Page</h1>
      <p className="mb-6">This page tests minimal server actions to isolate the issue</p>
      
      <TestAction />
      
      <div className="mt-8">
        <a href="/" className="text-blue-500 hover:underline">Back to main page</a>
      </div>
    </div>
  )
}
