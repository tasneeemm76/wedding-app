import { prisma } from '@/lib/prisma'
import AddGuestForm from '@/components/AddGuestForm'
import Link from 'next/link'

export default async function AddGuestPage() {
  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' }
  })

  const functions = await prisma.function.findMany({
    orderBy: { date: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/guests"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              ← Back to Guests
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Guest</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new guest and optionally invite them to wedding functions
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <AddGuestForm groups={groups} functions={functions} />
        </div>
      </div>
    </div>
  )
}

