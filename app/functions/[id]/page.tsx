import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import FunctionInviteManager from '@/components/FunctionInviteManager'

export default async function FunctionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const func = await prisma.function.findUnique({
    where: { id },
    include: {
      invites: {
        include: {
          guest: true
        }
      },
      _count: {
        select: {
          invites: true,
          rsvps: true
        }
      }
    }
  })

  if (!func) {
    notFound()
  }

  // Sort invites by guest name (after checking func exists)
  func.invites.sort((a, b) => {
    if (!a.guest || !b.guest) return 0
    return a.guest.name.localeCompare(b.guest.name)
  })

  // Get all guests to show in dropdown
  const allGuests = await prisma.guest.findMany({
    orderBy: { name: 'asc' }
  })

  // Get guests already invited
  const invitedGuestIds = new Set(func.invites.map(inv => inv.guestId))
  const availableGuests = allGuests.filter(g => !invitedGuestIds.has(g.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{func.name}</h1>
          <div className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0 sm:space-x-4">
            {func.type && <span className="block sm:inline">Type: {func.type}</span>}
            {func.date && (
              <span className="block sm:inline">
                Date: {new Date(func.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
            {func.venue && <span className="block sm:inline">Venue: {func.venue}</span>}
          </div>
        </div>
        <FunctionInviteManager
          function={func}
          invites={func.invites}
          availableGuests={availableGuests}
        />
      </div>
    </div>
  )
}

