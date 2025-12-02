import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface UpdateExpenseBody {
  description?: string
  amount?: number
  paidBy?: string
  note?: string | null
}

interface ExpenseResponse {
  id: string
  description: string
  amount: number
  paidBy: string
  note: string | null
  createdAt: Date
}

interface ErrorResponse {
  error: string
}

type RouteParams = { params: Promise<{ id: string }> }

// Environment-safe error message helper
function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'production') {
      return defaultMessage
    }
    return error.message
  }
  return defaultMessage
}

/**
 * GET /api/expenses/[id]
 * Fetch a single expense by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ExpenseResponse | ErrorResponse>> {
  try {
    const { id } = await params

    const expense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch expense') },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/expenses/[id]
 * Update an expense by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ExpenseResponse | ErrorResponse>> {
  try {
    const { id } = await params
    const body: UpdateExpenseBody = await request.json()
    const { description, amount, paidBy, note } = body

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Partial<{
      description: string
      amount: number
      paidBy: string
      note: string | null
    }> = {}

    if (description !== undefined) {
      if (!description.trim()) {
        return NextResponse.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        )
      }
      updateData.description = description.trim()
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        )
      }
      updateData.amount = amount
    }

    if (paidBy !== undefined) {
      if (!paidBy.trim()) {
        return NextResponse.json(
          { error: 'Paid by cannot be empty' },
          { status: 400 }
        )
      }
      updateData.paidBy = paidBy.trim()
    }

    if (note !== undefined) {
      updateData.note = note?.trim() || null
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)

    if (error instanceof Error && error.message.includes('Record to update does not exist')) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update expense') },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    const { id } = await params

    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete expense') },
      { status: 500 }
    )
  }
}

