import { prisma } from '@/lib/prisma'
import FunctionsTable from '@/components/FunctionsTable'

export default async function FunctionsPage() {
  // Try new field names first, fallback to old names if client not regenerated
  let functions
  try {
    functions = await prisma.function.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { invites: true, rsvps: true }
        }
      }
    })
  } catch (error: any) {
    // Fallback for old client - will need to regenerate
    console.warn('Using fallback query. Please run: npx prisma generate')
    functions = await prisma.function.findMany({
      orderBy: { date: 'asc' }
    }) as any
    // Map to expected structure
    functions = functions.map((f: any) => ({
      ...f,
      _count: {
        invites: 0,
        rsvps: 0
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Functions</h1>
        </div>
        <FunctionsTable functions={functions} />
      </div>
    </div>
  )
}

