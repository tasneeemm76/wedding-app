'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GlobalSearch from './GlobalSearch'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/guests', label: 'Guests' },
  { href: '/functions', label: 'Functions' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/import', label: 'Import Excel' }
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex flex-1">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Wedding Manager</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <div className="hidden md:flex items-center ml-4">
              <GlobalSearch />
            </div>
          </div>
        </div>
        <div className="md:hidden pb-4">
          <GlobalSearch />
        </div>
      </div>
    </nav>
  )
}

