import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CreateExpenseBody {
  description: string
  amount: number
  paidBy: string
  note?: string | null
}

interface ErrorResponse {
  error: string
}

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
 * GET /api/expenses
 * Fetch all expenses
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch expenses') },
      { status: 500 }
    )
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const body: CreateExpenseBody = await request.json()
    const { description, amount, paidBy, note } = body

    // Validation
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!paidBy || typeof paidBy !== 'string' || paidBy.trim() === '') {
      return NextResponse.json(
        { error: 'Paid by is required' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount,
        paidBy: paidBy.trim(),
        note: note?.trim() || null
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create expense') },
      { status: 500 }
    )
  }
}

