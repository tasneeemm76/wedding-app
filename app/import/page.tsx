'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    // Validate group name
    const trimmedGroupName = groupName.trim()
    if (!trimmedGroupName) {
      alert('Group name is required')
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('groupName', trimmedGroupName)

    try {
      const response = await fetch('/api/import/guests', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: data.success || 0,
          failed: data.failed || 0,
          errors: data.errors || []
        })
        setFile(null)
        setGroupName('')
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Refresh guests page after a delay
        setTimeout(() => {
          router.push('/guests')
          router.refresh()
        }, 2000)
      } else {
        setResult({
          success: 0,
          failed: 0,
          errors: [data.error || 'Failed to import guests']
        })
      }
    } catch (error) {
      setResult({
        success: 0,
        failed: 0,
        errors: ['An error occurred while importing the file']
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Import Guests from Excel</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">File Format</h2>
            <p className="text-sm text-gray-600 mb-2">
              Your Excel file should have the following columns:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>name</strong> - Guest/family name (required)</li>
              <li><strong>ladies</strong> - Number of ladies (required, default: 0)</li>
              <li><strong>gents</strong> - Number of gents (required, default: 0)</li>
              <li><strong>children</strong> - Number of children (optional, default: 0)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx)
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
                required
              />
            </div>

            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
                Assign all uploaded guests to Group: <span className="text-red-500">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name (required)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                If the group doesn't exist, it will be created automatically. Case-insensitive matching.
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import Guests'}
            </button>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <h3 className="text-sm font-medium mb-2">
                Import Results
              </h3>
              <p className="text-sm">
                <span className="text-green-700 font-semibold">Success: {result.success}</span>
                {result.failed > 0 && (
                  <span className="text-red-700 font-semibold ml-4">Failed: {result.failed}</span>
                )}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

