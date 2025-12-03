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

export async function GET(): Promise<NextResponse> {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { groups: true }
        }
      }
    })

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch labels') },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      )
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error: any) {
    console.error('Error creating label:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Label with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create label') },
      { status: 500 }
    )
  }
}

