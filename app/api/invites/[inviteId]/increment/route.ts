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

// Increment count by 1 in specified category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { inviteId } = await params
    const body = await request.json()
    const { category } = body // 'ladies' | 'gents' | 'children'

    if (!category || !['ladies', 'gents', 'children'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be ladies, gents, or children' },
        { status: 400 }
      )
    }

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    const fieldMap = {
      ladies: 'ladiesInvited',
      gents: 'gentsInvited',
      children: 'childrenInvited'
    } as const

    const field = fieldMap[category as keyof typeof fieldMap]
    const currentValue = invite[field] || 0

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        [field]: currentValue + 1
      },
      include: {
        guest: true,
        function: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error incrementing invite count:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to increment count') },
      { status: 500 }
    )
  }
}

// Decrement count by 1 (reverse order: children -> gents -> ladies)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { inviteId } = await params

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Decrement in reverse order: children -> gents -> ladies
    let updatedData: { childrenInvited?: number; gentsInvited?: number; ladiesInvited?: number } = {}

    if (invite.childrenInvited > 0) {
      updatedData.childrenInvited = invite.childrenInvited - 1
    } else if (invite.gentsInvited > 0) {
      updatedData.gentsInvited = invite.gentsInvited - 1
    } else if (invite.ladiesInvited > 0) {
      updatedData.ladiesInvited = invite.ladiesInvited - 1
    } else {
      // Already at 0, can't decrement
      return NextResponse.json(
        { error: 'Count is already at zero' },
        { status: 400 }
      )
    }

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: updatedData,
      include: {
        guest: true,
        function: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error decrementing invite count:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to decrement count') },
      { status: 500 }
    )
  }
}

