import { prisma } from '@/lib/prisma'
import GroupsManager from '@/components/GroupsManager'

export default async function GroupsPage() {
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

  const labels = await prisma.label.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { groups: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Groups & Labels</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage groups and add labels like "school friends", "work colleagues", etc.
          </p>
        </div>
        <GroupsManager groups={groups} labels={labels} />
      </div>
    </div>
  )
}

