import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions for request/response
interface UpdateFunctionBody {
  name?: string
  type?: string | null
  date?: string | null // ISO date string
  venue?: string | null
}

interface FunctionResponse {
  id: string
  name: string
  type: string | null
  date: Date | null
  venue: string | null
}

interface ErrorResponse {
  error: string
}

// Type for params - In Next.js 15+, params are always Promise-based
type RouteParams = { params: Promise<{ id: string }> }

// Environment-safe error message helper
function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production') {
      return defaultMessage
    }
    return error.message
  }
  return defaultMessage
}

/**
 * GET /api/functions/[id]
 * Fetch a single function by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<FunctionResponse | ErrorResponse>> {
  try {
    // Await params - required in Next.js 15+
    const { id } = await params

    // Fetch Prisma data
    const func = await prisma.function.findUnique({
      where: { id }
    })

    // Handle not found
    if (!func) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    // Return typed JSON response
    return NextResponse.json(func)
  } catch (error) {
    console.error('Error fetching function:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch function') },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/functions/[id]
 * Update a function by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<FunctionResponse | ErrorResponse>> {
  try {
    // Await params - required in Next.js 15+
    const { id } = await params

    // Parse body in PUT request
    const body: UpdateFunctionBody = await request.json()
    const { name, type, date, venue } = body

    // Check if function exists first
    const existingFunction = await prisma.function.findUnique({
      where: { id }
    })

    // Handle not found
    if (!existingFunction) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: Partial<{
      name: string
      type: string | null
      date: Date | null
      venue: string | null
    }> = {}

    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type || null
    if (venue !== undefined) updateData.venue = venue || null
    if (date !== undefined) {
      updateData.date = date ? new Date(date) : null
    }

    // Update Prisma data
    const updatedFunction = await prisma.function.update({
      where: { id },
      data: updateData
    })

    // Return typed JSON response
    return NextResponse.json(updatedFunction)
  } catch (error) {
    console.error('Error updating function:', error)
    
    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to update does not exist')) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update function') },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/functions/[id]
 * Delete a function by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    // Await params - required in Next.js 15+
    const { id } = await params

    // Check if function exists first
    const existingFunction = await prisma.function.findUnique({
      where: { id }
    })

    // Handle not found
    if (!existingFunction) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    // Delete Prisma data
    await prisma.function.delete({
      where: { id }
    })

    // Return typed JSON response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting function:', error)
    
    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete function') },
      { status: 500 }
    )
  }
}

