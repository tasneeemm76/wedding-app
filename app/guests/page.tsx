import { prisma } from '@/lib/prisma'
import GuestsTable from '@/components/GuestsTable'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    search?: string
    group?: string
    label?: string
  }>
}

export default async function GuestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const groupFilter = params.group || ''
  const labelFilter = params.label || ''

  // Build where clause with PostgreSQL case-insensitive search
  const where: any = {}
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    }
  }

  if (groupFilter) {
    where.groupId = groupFilter
  }

  // If label filter is provided, filter by groups that have this label
  if (labelFilter) {
    const groupsWithLabel = await prisma.groupLabel.findMany({
      where: { labelId: labelFilter },
      select: { groupId: true }
    })
    const groupIds = groupsWithLabel.map(gl => gl.groupId)
    
    if (groupIds.length > 0) {
      if (groupFilter) {
        // If both filters are set, ensure the group is in both lists
        where.groupId = groupFilter
        if (!groupIds.includes(groupFilter)) {
          // No guests match both filters
          where.id = 'no-match'
        }
      } else {
        where.groupId = { in: groupIds }
      }
    } else {
      // No groups have this label, return empty
      where.id = 'no-match'
    }
  }

  // Get all guests (no pagination)
  const guests = await prisma.guest.findMany({
    where,
    include: {
      group: {
        include: {
          labels: {
            include: {
              label: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get all groups for filter dropdown
  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { guests: true }
      },
      labels: {
        include: {
          label: true
        }
      }
    }
  })

  // Get all labels for filter dropdown
  const labels = await prisma.label.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { groups: true }
      }
    }
  })

  // Get all functions for table columns
  const functions = await prisma.function.findMany({
    orderBy: { date: 'asc' }
  })

  // Get all invites for guests
  const guestIds = guests.map(g => g.id)
  const invites = await prisma.invite.findMany({
    where: {
      guestId: { in: guestIds }
    },
    include: {
      function: true
    }
  })

  // Create a map of guestId -> functionId -> invite for quick lookup
  const inviteMap = new Map<string, Map<string, typeof invites[0]>>()
  invites.forEach(invite => {
    if (!inviteMap.has(invite.guestId)) {
      inviteMap.set(invite.guestId, new Map())
    }
    inviteMap.get(invite.guestId)!.set(invite.functionId, invite)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Guests</h1>
          <Link
            href="/guests/add"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            Add Guest
          </Link>
        </div>
        <GuestsTable 
          guests={guests} 
          groups={groups}
          labels={labels}
          functions={functions}
          inviteMap={inviteMap}
          totalGuests={guests.length}
          search={search}
          groupFilter={groupFilter}
          labelFilter={labelFilter}
        />
      </div>
    </div>
  )
}
