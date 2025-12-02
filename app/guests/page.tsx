import { prisma } from '@/lib/prisma'
import GuestsTable from '@/components/GuestsTable'

interface PageProps {
  searchParams: Promise<{
    search?: string
    group?: string
  }>
}

export default async function GuestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const groupFilter = params.group || ''

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

  // Get all guests (no pagination)
  const guests = await prisma.guest.findMany({
    where,
    include: {
      group: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get all groups for filter dropdown
  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { guests: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
        </div>
        <GuestsTable 
          guests={guests} 
          groups={groups}
          totalGuests={guests.length}
          search={search}
          groupFilter={groupFilter}
        />
      </div>
    </div>
  )
}
