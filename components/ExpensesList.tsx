'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Expense } from '@prisma/client'
import ExpenseForm from './ExpenseForm'

interface ExpensesListProps {
  expenses: Expense[]
}

export default function ExpensesList({ expenses: initialExpenses }: ExpensesListProps) {
  const router = useRouter()
  const [expenses, setExpenses] = useState(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Update expenses when initialExpenses changes (after router.refresh())
  useEffect(() => {
    setExpenses(initialExpenses)
  }, [initialExpenses])

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPaidBy = (paidBy: string) => {
    return paidBy.charAt(0).toUpperCase() + paidBy.slice(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setExpenses(expenses.filter(e => e.id !== id))
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to delete expense: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">All Expenses</h2>
          <button
            onClick={() => {
              setEditingExpense(null)
              setShowForm(true)
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            Add Expense
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid By
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.createdAt)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 max-w-[150px] sm:max-w-none truncate sm:truncate-none">
                      {expense.description}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPaidBy(expense.paidBy)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {expense.note || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-900 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0 text-left sm:text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0 text-left sm:text-center"
                        >
                          {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {expenses.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No expenses recorded yet. Click "Add Expense" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          expenseData={editingExpense ? {
            id: editingExpense.id,
            description: editingExpense.description,
            amount: editingExpense.amount,
            paidBy: editingExpense.paidBy,
            note: editingExpense.note
          } : null}
          onClose={() => {
            setShowForm(false)
            setEditingExpense(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

