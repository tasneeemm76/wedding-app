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

interface CreateGuestBody {
  name: string
  groupId?: string
  ladies?: number
  gents?: number
  children?: number
  notes?: string
  functionInvites?: Array<{
    functionId: string
    ladiesInvited?: number
    gentsInvited?: number
    childrenInvited?: number
  }>
}

export async function POST(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  try {
    const body: CreateGuestBody = await request.json()
    const { name, groupId, ladies, gents, children, notes, functionInvites } = body

    // Validate name
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Check for duplicate name (case-insensitive)
    const existingGuest = await prisma.guest.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    })

    if (existingGuest) {
      return NextResponse.json(
        { error: 'A guest with this name already exists' },
        { status: 400 }
      )
    }

    // Get or create "General" group if no group specified
    let finalGroupId = groupId
    if (!finalGroupId) {
      let generalGroup = await prisma.group.findFirst({
        where: {
          name: {
            equals: 'General',
            mode: 'insensitive'
          }
        }
      })

      if (!generalGroup) {
        try {
          generalGroup = await prisma.group.create({
            data: { name: 'General' }
          })
        } catch (error: any) {
          // Handle race condition - if another request created it, find it again
          if (error.code === 'P2002') {
            generalGroup = await prisma.group.findFirst({
              where: {
                name: {
                  equals: 'General',
                  mode: 'insensitive'
                }
              }
            })
            if (!generalGroup) {
              throw error // Re-throw if still not found
            }
          } else {
            throw error
          }
        }
      }
      finalGroupId = generalGroup.id
    } else {
      // Verify group exists
      const group = await prisma.group.findUnique({
        where: { id: finalGroupId }
      })
      if (!group) {
        return NextResponse.json(
          { error: 'Selected group does not exist' },
          { status: 400 }
        )
      }
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name: trimmedName,
        groupId: finalGroupId,
        ladies: Math.max(0, ladies || 0),
        gents: Math.max(0, gents || 0),
        children: Math.max(0, children || 0),
        notes: notes?.trim() || null
      }
    })

    // Create function invites if provided
    const createdInvites = []
    if (functionInvites && functionInvites.length > 0) {
      for (const invite of functionInvites) {
        // Verify function exists
        const func = await prisma.function.findUnique({
          where: { id: invite.functionId }
        })

        if (func) {
          try {
            const createdInvite = await prisma.invite.create({
              data: {
                guestId: guest.id,
                functionId: invite.functionId,
                ladiesInvited: Math.max(0, invite.ladiesInvited || 0),
                gentsInvited: Math.max(0, invite.gentsInvited || 0),
                childrenInvited: Math.max(0, invite.childrenInvited || 0)
              },
              include: {
                function: true
              }
            })
            createdInvites.push(createdInvite)
          } catch (error: any) {
            // Handle duplicate invite (shouldn't happen but handle gracefully)
            if (error.code === 'P2002') {
              // Invite already exists, skip
              continue
            }
            // Log but don't fail the entire request
            console.error(`Failed to create invite for function ${invite.functionId}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      guest,
      invites: createdInvites
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating guest:', error)

    // Handle Prisma unique constraint (duplicate name)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A guest with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create guest') },
      { status: 500 }
    )
  }
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


