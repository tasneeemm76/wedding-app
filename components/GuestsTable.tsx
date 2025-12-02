'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Guest, Group } from '@prisma/client'

interface GuestWithGroup extends Guest {
  group: Group | null
}

interface GroupWithCount extends Group {
  _count: {
    guests: number
  }
}

interface GuestsTableProps {
  guests: GuestWithGroup[]
  groups: GroupWithCount[]
  totalGuests: number
  search: string
  groupFilter: string
}

export default function GuestsTable({ 
  guests: initialGuests, 
  groups,
  totalGuests,
  search: initialSearch,
  groupFilter: initialGroupFilter
}: GuestsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [groupFilter, setGroupFilter] = useState(initialGroupFilter)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState<GuestWithGroup | null>(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    } else {
      params.delete('search')
    }
    router.push(`/guests?${params.toString()}`)
  }

  const handleGroupFilter = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (groupId) {
      params.set('group', groupId)
    } else {
      params.delete('group')
    }
    router.push(`/guests?${params.toString()}`)
  }

  const handleDelete = async (guest: GuestWithGroup) => {
    setGuestToDelete(guest)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!guestToDelete) return

    try {
      const response = await fetch(`/api/guests/${guestToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
        setShowDeleteModal(false)
        setGuestToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting guest:', error)
    }
  }

  const totalLadies = initialGuests.reduce((sum, g) => sum + g.ladies, 0)
  const totalGents = initialGuests.reduce((sum, g) => sum + g.gents, 0)
  const totalChildren = initialGuests.reduce((sum, g) => sum + g.children, 0)


  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      const response = await fetch('/api/guests', {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
        setShowDeleteAllModal(false)
      } else {
        const data = await response.json()
        alert(`Failed to delete all guests: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting all guests:', error)
      alert('Failed to delete all guests')
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search guests by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete All
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter by Group:</label>
          <select
            value={groupFilter}
            onChange={(e) => handleGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({group._count.guests})
              </option>
            ))}
          </select>
          {groupFilter && (
            <button
              onClick={() => handleGroupFilter('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          Showing {initialGuests.length} of {totalGuests} guests
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ladies
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Children
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialGuests.map((guest) => {
              const total = guest.ladies + guest.gents + guest.children
              return (
                <tr key={guest.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {guest.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {guest.group?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {guest.ladies}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {guest.gents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {guest.children}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(guest)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
              <td></td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">{totalLadies}</td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">{totalGents}</td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">{totalChildren}</td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                {totalLadies + totalGents + totalChildren}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {initialGuests.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No guests found.
        </div>
      )}

      {showDeleteModal && guestToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>{guestToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setGuestToDelete(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete All Guests</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>all {totalGuests} guests</strong>? This action cannot be undone and will also delete all related invites and RSVPs.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  disabled={deletingAll}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingAll ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
