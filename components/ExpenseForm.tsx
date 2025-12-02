'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Expense } from '@prisma/client'

interface ExpenseFormProps {
  expenseData?: {
    id: string
    description: string
    amount: number
    paidBy: string
    note: string | null
  } | null
  onClose: () => void
}

export default function ExpenseForm({ expenseData, onClose }: ExpenseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: expenseData?.description || '',
    amount: expenseData?.amount || 0,
    paidBy: expenseData?.paidBy || '',
    note: expenseData?.note || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = expenseData
        ? `/api/expenses/${expenseData.id}`
        : '/api/expenses'
      const method = expenseData ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString()),
          note: formData.note || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save expense')
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error('Error saving expense:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save expense. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {expenseData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] sm:min-h-0"
              placeholder="e.g., Catering, Decorations, Photography"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] sm:min-h-0"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
              Paid By *
            </label>
            <select
              id="paidBy"
              required
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] sm:min-h-0"
            >
              <option value="">Select who paid...</option>
              <option value="bride">Bride</option>
              <option value="brother">Brother</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
            </select>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Additional notes (optional)"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

