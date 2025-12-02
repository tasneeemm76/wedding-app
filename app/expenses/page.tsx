import { prisma } from '@/lib/prisma'
import ExpensesList from '@/components/ExpensesList'

// Force dynamic rendering to ensure data is always fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <div className="text-xl sm:text-2xl font-semibold text-gray-900">
            Total: ₹{total.toFixed(2)}
          </div>
        </div>
        <ExpensesList expenses={expenses} />
      </div>
    </div>
  )
}

