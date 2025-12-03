import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ErrorResponse {
  error: string
}

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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { id } = await params

    await prisma.label.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting label:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete label') },
      { status: 500 }
    )
  }
}

