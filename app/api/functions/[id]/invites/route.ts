import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { guestId, ladiesInvited, gentsInvited, childrenInvited } = body

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
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

    return NextResponse.json(invite)
  } catch (error: any) {
    console.error('Error creating/updating invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invite' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { inviteId, ladiesInvited, gentsInvited, childrenInvited } = body

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 })
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
  } catch (error: any) {
    console.error('Error updating invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update invite' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const searchParams = request.nextUrl.searchParams
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 })
    }

    await prisma.invite.delete({
      where: { id: inviteId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete invite' },
      { status: 500 }
    )
  }
}

