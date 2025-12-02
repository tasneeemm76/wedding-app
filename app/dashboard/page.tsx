import { prisma } from '@/lib/prisma'

// Force dynamic rendering to ensure data is always fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  try {
    const [totalGuests, totalFunctions, totalExpenses, totalRSVPs] = await Promise.all([
      prisma.guest.count(),
      prisma.function.count(),
      prisma.expense.aggregate({
        _sum: { amount: true }
      }),
      prisma.rsvp.count()
    ])

    const stats = [
      { name: 'Total Guests', value: totalGuests, color: 'bg-blue-500' },
      { name: 'Total Functions', value: totalFunctions, color: 'bg-purple-500' },
      { name: 'Total Expenses', value: `₹${(totalExpenses._sum.amount || 0).toFixed(2)}`, color: 'bg-red-500' },
      { name: 'Total RSVPs', value: totalRSVPs, color: 'bg-green-500' }
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className={`${stat.color} rounded-md p-2 sm:p-3 flex-shrink-0`}>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 text-white"></div>
                    </div>
                    <div className="ml-4 sm:ml-5 flex-1 min-w-0">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                        <dd className="text-base sm:text-lg font-semibold text-gray-900 truncate">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm sm:text-base">
            Error loading dashboard data. Please refresh the page.
          </div>
        </div>
      </div>
    )
  }
}

