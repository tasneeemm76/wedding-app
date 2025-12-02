import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const [totalGuests, totalFunctions, totalExpenses] = await Promise.all([
    prisma.guest.count(),
    prisma.function.count(),
    prisma.expense.aggregate({
      _sum: { amount: true }
    })
  ])
  
  // Get RSVP count - handle case where client might not be regenerated
  let totalRSVPs = 0
  try {
    totalRSVPs = await prisma.rsvp.count()
  } catch (error) {
    console.warn('RSVP model not available yet. Please restart the dev server after running: npx prisma generate')
    totalRSVPs = 0
  }

  const stats = [
    { name: 'Total Guests', value: totalGuests, color: 'bg-blue-500' },
    { name: 'Total Functions', value: totalFunctions, color: 'bg-purple-500' },
    { name: 'Total Expenses', value: `$${totalExpenses._sum.amount?.toFixed(2) || '0.00'}`, color: 'bg-red-500' },
    { name: 'Total RSVPs', value: totalRSVPs, color: 'bg-green-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <div className="w-6 h-6 text-white"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
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
}

