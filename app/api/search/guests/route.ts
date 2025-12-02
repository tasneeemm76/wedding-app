import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET(
  request: NextRequest
): Promise<NextResponse | NextResponse<ErrorResponse>> {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim() === '') {
    return NextResponse.json(
      { error: 'Query parameter required' },
      { status: 400 }
    )
  }

  try {
    // Use PostgreSQL case-insensitive search
    // First try exact case-insensitive match
    let guest = await prisma.guest.findFirst({
      where: {
        name: {
          equals: query,
          mode: 'insensitive'
        }
      },
      include: {
        invites: {
          include: {
            function: true
          }
        },
        rsvps: {
          include: {
            function: true
          }
        }
      }
    })

    // If no exact match, try contains search
    if (!guest) {
      const matchingGuests = await prisma.guest.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: {
          invites: {
            include: {
              function: true
            }
          },
          rsvps: {
            include: {
              function: true
            }
          }
        },
        take: 1
      })
      guest = matchingGuests[0]
    }

    if (!guest) {
      return NextResponse.json({ guest: null, message: 'Guest not found' })
    }

    // Get all functions to show which ones the guest is not invited to
    const allFunctions = await prisma.function.findMany({
      orderBy: { date: 'asc' }
    })

    // Create maps for invites and RSVPs
    const inviteMap = new Map(
      guest.invites.map(inv => [inv.functionId, inv])
    )
    const rsvpMap = new Map(
      guest.rsvps.map(rsvp => [rsvp.functionId, rsvp])
    )

    // Build per-function overview
    const functionOverview = allFunctions.map(func => {
      const invite = inviteMap.get(func.id)
      const rsvp = rsvpMap.get(func.id)

      return {
        functionId: func.id,
        functionName: func.name,
        invited: !!invite,
        ladiesInvited: invite?.ladiesInvited || 0,
        gentsInvited: invite?.gentsInvited || 0,
        childrenInvited: invite?.childrenInvited || 0,
        rsvpReceived: !!rsvp,
        ladiesFinal: rsvp?.ladiesFinal || 0,
        gentsFinal: rsvp?.gentsFinal || 0,
        childrenFinal: rsvp?.childrenFinal || 0,
        rsvpNotes: rsvp?.notes || null
      }
    })

    // Check if any RSVP was received
    const hasRSVP = guest.rsvps.length > 0

    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        ladies: guest.ladies,
        gents: guest.gents,
        children: guest.children
      },
      functionOverview,
      hasRSVP,
      allRSVPNotes: guest.rsvps
        .filter(rsvp => rsvp.notes)
        .map(rsvp => ({
          functionName: rsvp.function.name,
          notes: rsvp.notes!
        }))
    })
  } catch (error) {
    console.error('Error searching guest:', error)
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to search guest') },
      { status: 500 }
    )
  }
}

