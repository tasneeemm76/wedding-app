import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ErrorResponse {
  error: string
}

interface DeleteAllResponse {
  success: boolean
  deletedCount: number
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

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<DeleteAllResponse | ErrorResponse>> {
  try {
    // Delete all guests
    const result = await prisma.guest.deleteMany({})

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error deleting all guests:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete all guests') },
      { status: 500 }
    )
  }
}


