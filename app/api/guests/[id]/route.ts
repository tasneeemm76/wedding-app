import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    const { id } = await params

    // Check if guest exists first
    const existingGuest = await prisma.guest.findUnique({
      where: { id }
    })

    if (!existingGuest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    await prisma.guest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest:', error)

    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete guest') },
      { status: 500 }
    )
  }
}

