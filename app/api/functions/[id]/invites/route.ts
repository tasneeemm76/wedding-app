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

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { id } = await params
    const body = await request.json()
    const { guestId, ladiesInvited, gentsInvited, childrenInvited } = body

    if (!guestId || typeof guestId !== 'string') {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Check if invite already exists
    const existing = await prisma.invite.findUnique({
      where: {
        guestId_functionId: {
          guestId,
          functionId: id
        }
      }
    })

    if (existing) {
      // Update existing invite
      const updated = await prisma.invite.update({
        where: { id: existing.id },
        data: {
          ladiesInvited: ladiesInvited || 0,
          gentsInvited: gentsInvited || 0,
          childrenInvited: childrenInvited || 0
        },
        include: {
          guest: true,
          function: true
        }
      })
      return NextResponse.json(updated)
    }

    // Create new invite
    const invite = await prisma.invite.create({
      data: {
        guestId,
        functionId: id,
        ladiesInvited: ladiesInvited || 0,
        gentsInvited: gentsInvited || 0,
        childrenInvited: childrenInvited || 0
      },
      include: {
        guest: true,
        function: true
      }
    })

    return NextResponse.json(invite, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating invite:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create invite') },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const { id } = await params
    const body = await request.json()
    const { inviteId, ladiesInvited, gentsInvited, childrenInvited } = body

    if (!inviteId || typeof inviteId !== 'string') {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    // Check if invite exists and belongs to this function
    const existing = await prisma.invite.findUnique({
      where: { id: inviteId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    if (existing.functionId !== id) {
      return NextResponse.json(
        { error: 'Invite does not belong to this function' },
        { status: 403 }
      )
    }

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        ladiesInvited: ladiesInvited || 0,
        gentsInvited: gentsInvited || 0,
        childrenInvited: childrenInvited || 0
      },
      include: {
        guest: true,
        function: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating invite:', error)

    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to update does not exist')) {
      return NextResponse.json(
        { error: 'Invite not found' },
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
      { error: getErrorMessage(error, 'Failed to update invite') },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    // Check if invite exists and belongs to this function
    const existing = await prisma.invite.findUnique({
      where: { id: inviteId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    if (existing.functionId !== id) {
      return NextResponse.json(
        { error: 'Invite does not belong to this function' },
        { status: 403 }
      )
    }

    await prisma.invite.delete({
      where: { id: inviteId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invite:', error)

    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to delete invite') },
      { status: 500 }
    )
  }
}

