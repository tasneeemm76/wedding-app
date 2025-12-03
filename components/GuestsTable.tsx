'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Guest, Group, Label } from '@prisma/client'

interface GroupLabel {
  id: string
  label: Label
}

interface GroupWithLabels extends Group {
  labels: GroupLabel[]
}

interface GuestWithGroup extends Guest {
  group: (GroupWithLabels & { labels: GroupLabel[] }) | null
}

interface GroupWithCount extends GroupWithLabels {
  _count: {
    guests: number
  }
}

interface LabelWithCount extends Label {
  _count: {
    groups: number
  }
}

interface GuestsTableProps {
  guests: GuestWithGroup[]
  groups: GroupWithCount[]
  labels: LabelWithCount[]
  totalGuests: number
  search: string
  groupFilter: string
  labelFilter: string
}

export default function GuestsTable({ 
  guests: initialGuests, 
  groups,
  labels,
  totalGuests,
  search: initialSearch,
  groupFilter: initialGroupFilter,
  labelFilter: initialLabelFilter
}: GuestsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [groupFilter, setGroupFilter] = useState(initialGroupFilter)
  const [labelFilter, setLabelFilter] = useState(initialLabelFilter)
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

  const handleLabelFilter = (labelId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (labelId) {
      params.set('label', labelId)
    } else {
      params.delete('label')
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
      <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium min-h-[44px] sm:min-h-0"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            Delete All
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Group:</label>
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <select
              value={groupFilter}
              onChange={(e) => handleGroupFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] sm:min-h-0"
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
                className="px-3 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] sm:min-h-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Label:</label>
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <select
              value={labelFilter}
              onChange={(e) => handleLabelFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] sm:min-h-0"
            >
              <option value="">All Labels</option>
              {labels.map(label => (
                <option key={label.id} value={label.id}>
                  {label.name} ({label._count.groups})
                </option>
              ))}
            </select>
            {labelFilter && (
              <button
                onClick={() => handleLabelFilter('')}
                className="px-3 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] sm:min-h-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-600">
          Showing {initialGuests.length} of {totalGuests} guests
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle sm:px-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  G
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialGuests.map((guest) => {
                const total = guest.ladies + guest.gents + guest.children
                return (
                  <tr key={guest.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-none truncate sm:truncate-none">
                      {guest.name}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{guest.group?.name || '-'}</span>
                        {guest.group?.labels && guest.group.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {guest.group.labels.map((gl) => (
                              <span
                                key={gl.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {gl.label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.ladies}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.gents}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.children}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {total}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(guest)}
                        className="text-red-600 hover:text-red-900 py-1.5 sm:py-0 min-h-[44px] sm:min-h-0"
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
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="hidden sm:table-cell"></td>
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">{totalLadies}</td>
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">{totalGents}</td>
                <td className="hidden md:table-cell px-6 py-3 text-sm font-bold text-gray-900">{totalChildren}</td>
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">
                  {totalLadies + totalGents + totalChildren}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {initialGuests.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No guests found.
        </div>
      )}

      {showDeleteModal && guestToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md p-5 sm:p-6 border shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <strong>{guestToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setGuestToDelete(null)
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium min-h-[44px] sm:min-h-0"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium min-h-[44px] sm:min-h-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md p-5 sm:p-6 border shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete All Guests</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <strong>all {totalGuests} guests</strong>? This action cannot be undone and will also delete all related invites and RSVPs.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={deletingAll}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium min-h-[44px] sm:min-h-0"
              >
                {deletingAll ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
