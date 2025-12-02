'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Function } from '@prisma/client'
import FunctionForm from './FunctionForm'

interface FunctionWithCount extends Function {
  _count: {
    invites: number
    rsvps: number
  }
}

interface FunctionsTableProps {
  functions: FunctionWithCount[]
}

export default function FunctionsTable({ functions: initialFunctions }: FunctionsTableProps) {
  const router = useRouter()
  const [functions, setFunctions] = useState(initialFunctions)
  const [showForm, setShowForm] = useState(false)
  const [editingFunction, setEditingFunction] = useState<FunctionWithCount | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Update functions when initialFunctions changes (after router.refresh())
  useEffect(() => {
    setFunctions(initialFunctions)
  }, [initialFunctions])

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this function? This will also delete all invites and RSVPs.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/functions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local state immediately
        setFunctions(functions.filter(f => f.id !== id))
        // Refresh server data
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to delete function: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting function:', error)
      alert('Failed to delete function. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (func: FunctionWithCount) => {
    setEditingFunction(func)
    setShowForm(true)
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">All Functions</h2>
          <button
            onClick={() => {
              setEditingFunction(null)
              setShowForm(true)
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            Add Function
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invites
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RSVPs
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {functions.map((func) => (
                  <tr key={func.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {func.name}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.type || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(func.date)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.venue || '-'}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func._count.invites}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func._count.rsvps}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <button
                          onClick={() => router.push(`/functions/${func.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0 text-left sm:text-center"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleEdit(func)}
                          className="text-blue-600 hover:text-blue-900 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0 text-left sm:text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(func.id)}
                          disabled={deletingId === func.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0 text-left sm:text-center"
                        >
                          {deletingId === func.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {functions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No functions added yet. Click "Add Function" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <FunctionForm
          functionData={editingFunction ? {
            id: editingFunction.id,
            name: editingFunction.name,
            type: editingFunction.type,
            date: editingFunction.date ? new Date(editingFunction.date).toISOString() : null,
            venue: editingFunction.venue
          } : null}
          onClose={() => {
            setShowForm(false)
            setEditingFunction(null)
            // Refresh to get updated data from server
            router.refresh()
          }}
        />
      )}
    </>
  )
}

