'use client'

import { useState } from 'react'
import { Function } from '@prisma/client'

interface FunctionWithCount extends Function {
  _count: {
    invites: number
    rsvps: number
  }
}

interface FunctionsListProps {
  functions: FunctionWithCount[]
}


export default function FunctionsList({ functions: initialFunctions }: FunctionsListProps) {
  const [functions, setFunctions] = useState(initialFunctions)
  const [showModal, setShowModal] = useState(false)
  const [editingFunction, setEditingFunction] = useState<Function | null>(null)

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">All Functions</h2>
        <button
          onClick={() => {
            setEditingFunction(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Function
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {functions.map((func) => (
          <div
            key={func.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{func.name}</h3>
            </div>
            {func.date && (
              <p className="text-sm text-gray-600 mb-2">{formatDate(func.date)}</p>
            )}
            <div className="space-y-1 text-sm text-gray-500">
              <p>{func._count.invites} invite{func._count.invites !== 1 ? 's' : ''}</p>
              <p>{func._count.rsvps} RSVP{func._count.rsvps !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>

      {functions.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No functions added yet. Click "Add Function" to get started.
        </div>
      )}
    </div>
  )
}

