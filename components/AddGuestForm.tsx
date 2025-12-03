'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Group, Function } from '@prisma/client'
import { showToast } from './Toast'

interface AddGuestFormProps {
  groups: Group[]
  functions: Function[]
  onSuccess?: () => void
}

interface FunctionInvite {
  functionId: string
  ladiesInvited: number
  gentsInvited: number
  childrenInvited: number
}

export default function AddGuestForm({ groups, functions, onSuccess }: AddGuestFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [selectedFunctions, setSelectedFunctions] = useState<Set<string>>(new Set())
  const [functionInvites, setFunctionInvites] = useState<Record<string, FunctionInvite>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize function invites when functions are selected
  useEffect(() => {
    const newInvites: Record<string, FunctionInvite> = { ...functionInvites }
    selectedFunctions.forEach(funcId => {
      if (!newInvites[funcId]) {
        newInvites[funcId] = {
          functionId: funcId,
          ladiesInvited: 0,
          gentsInvited: 0,
          childrenInvited: 0
        }
      }
    })
    // Remove invites for unselected functions
    Object.keys(newInvites).forEach(funcId => {
      if (!selectedFunctions.has(funcId)) {
        delete newInvites[funcId]
      }
    })
    setFunctionInvites(newInvites)
  }, [selectedFunctions])

  const handleFunctionToggle = (functionId: string) => {
    const newSelected = new Set(selectedFunctions)
    if (newSelected.has(functionId)) {
      newSelected.delete(functionId)
    } else {
      newSelected.add(functionId)
    }
    setSelectedFunctions(newSelected)
  }

  const updateFunctionInvite = (functionId: string, field: keyof FunctionInvite, value: number) => {
    setFunctionInvites(prev => ({
      ...prev,
      [functionId]: {
        ...prev[functionId],
        [field]: Math.max(0, value || 0)
      }
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      showToast('Please fix the errors before submitting', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const invites = Object.values(functionInvites).filter(inv => 
        selectedFunctions.has(inv.functionId)
      )

      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          groupId: groupId || undefined,
          functionInvites: invites.length > 0 ? invites : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create guest')
      }

      const guestName = name.trim()
      showToast(`Guest "${guestName}" added successfully!`, 'success')
      
      // Call onSuccess callback if provided (for inline forms)
      if (onSuccess) {
        // Reset form
        setName('')
        setGroupId('')
        setSelectedFunctions(new Set())
        setFunctionInvites({})
        setErrors({})
        onSuccess()
      } else {
        // Redirect to guests page (toast will persist in layout)
        router.push('/guests')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error creating guest:', error)
      showToast(error.message || 'Failed to create guest. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: '' }))
            }
          }}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
            ${errors.name ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Enter guest name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Group Selection */}
      <div>
        <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
          Group / Category
        </label>
        <select
          id="group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">Select a group (defaults to General)</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          If no group is selected, guest will be assigned to "General" group
        </p>
      </div>

      {/* Function Selection - Only show if name is entered */}
      {name.trim() && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Functions (Optional)
          </label>
          <div className="space-y-3">
            {functions.length === 0 ? (
              <p className="text-sm text-gray-500">No functions available. Create functions first.</p>
            ) : (
              functions.map(func => {
                const isSelected = selectedFunctions.has(func.id)
                const invite = functionInvites[func.id] || {
                  functionId: func.id,
                  ladiesInvited: 0,
                  gentsInvited: 0,
                  childrenInvited: 0
                }

                return (
                  <div
                    key={func.id}
                    className="border border-gray-200 rounded-lg p-3 space-y-2"
                  >
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFunctionToggle(func.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {func.name}
                        {func.date && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({new Date(func.date).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                    </label>

                    {/* Quantity inputs - only show if function is selected */}
                    {isSelected && (
                      <div className="ml-6 grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ladies</label>
                          <input
                            type="number"
                            min="0"
                            value={invite.ladiesInvited || ''}
                            onChange={(e) => updateFunctionInvite(func.id, 'ladiesInvited', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Gents</label>
                          <input
                            type="number"
                            min="0"
                            value={invite.gentsInvited || ''}
                            onChange={(e) => updateFunctionInvite(func.id, 'gentsInvited', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Children</label>
                          <input
                            type="number"
                            min="0"
                            value={invite.childrenInvited || ''}
                            onChange={(e) => updateFunctionInvite(func.id, 'childrenInvited', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            flex-1 px-4 py-2.5 rounded-md text-sm font-medium
            ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
            }
            text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            min-h-[44px] sm:min-h-0
          `}
        >
          {isSubmitting ? 'Adding Guest...' : 'Add Guest'}
        </button>
      </div>
    </form>
  )
}

