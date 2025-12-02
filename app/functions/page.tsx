import { prisma } from '@/lib/prisma'
import FunctionsTable from '@/components/FunctionsTable'

// Force dynamic rendering to ensure data is always fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FunctionsPage() {
  const functions = await prisma.function.findMany({
    orderBy: { date: 'asc' },
    include: {
      _count: {
        select: { invites: true, rsvps: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Functions</h1>
        </div>
        <FunctionsTable functions={functions} />
      </div>
    </div>
  )
}

