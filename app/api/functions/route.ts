import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CreateFunctionBody {
  name: string
  type?: string | null
  date?: string | null
  venue?: string | null
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

export async function POST(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const body: CreateFunctionBody = await request.json()
    const { name, type, date, venue } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Function name is required' },
        { status: 400 }
      )
    }

    const functionData: {
      name: string
      type: string | null
      venue: string | null
      date?: Date
    } = {
      name: name.trim(),
      type: type || null,
      venue: venue || null
    }

    if (date) {
      functionData.date = new Date(date)
    }

    const newFunction = await prisma.function.create({
      data: functionData
    })

    return NextResponse.json(newFunction, { status: 201 })
  } catch (error) {
    console.error('Error creating function:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create function') },
      { status: 500 }
    )
  }
}

