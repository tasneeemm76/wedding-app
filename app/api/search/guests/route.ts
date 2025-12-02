import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim() === '') {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    // SQLite doesn't support case-insensitive mode, so we'll fetch all and filter
    // For better performance with large datasets, consider using raw SQL with LOWER()
    // Try new field names, with fallback
    let allGuests
    try {
      allGuests = await prisma.guest.findMany({
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
    } catch (error: any) {
      // Fallback if client not regenerated
      console.warn('Prisma client needs regeneration')
      allGuests = await prisma.guest.findMany({
        include: {
          invitations: {
            include: {
              function: true,
              rsvp: true
            }
          }
        }
      }) as any
      // Map old structure to new
      allGuests = allGuests.map((g: any) => ({
        ...g,
        invites: g.invitations || [],
        rsvps: g.invitations?.filter((inv: any) => inv.rsvp).map((inv: any) => inv.rsvp) || []
      }))
    }

    // Case-insensitive search
    const queryLower = query.toLowerCase()
    const matchingGuests = allGuests.filter(g => 
      g.name.toLowerCase().includes(queryLower)
    )

    // Find the best match (exact match first, then first result)
    const guest = matchingGuests.find(g => g.name.toLowerCase() === queryLower) || matchingGuests[0]

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
  } catch (error: any) {
    console.error('Error searching guest:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search guest' },
      { status: 500 }
    )
  }
}

