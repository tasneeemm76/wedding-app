'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Guest, Group, Label, Function, Invite } from '@prisma/client'
import { showToast } from './Toast'

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

interface InviteWithFunction extends Invite {
  function: Function
}

interface GuestsTableProps {
  guests: GuestWithGroup[]
  groups: GroupWithCount[]
  labels: LabelWithCount[]
  functions: Function[]
  inviteMap: Map<string, Map<string, InviteWithFunction>>
  totalGuests: number
  search: string
  groupFilter: string
  labelFilter: string
}

export default function GuestsTable({ 
  guests: initialGuests, 
  groups,
  labels,
  functions,
  inviteMap: initialInviteMap,
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
  const [inviteMap, setInviteMap] = useState(initialInviteMap)
  const [updatingInvites, setUpdatingInvites] = useState<Set<string>>(new Set())
  const [showCategoryModal, setShowCategoryModal] = useState<{ inviteId: string; functionId: string; guestId: string } | null>(null)
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

  const getInvite = (guestId: string, functionId: string): InviteWithFunction | null => {
    return inviteMap.get(guestId)?.get(functionId) || null
  }

  const getTotalCount = (invite: InviteWithFunction | null): number => {
    if (!invite) return 0
    return invite.ladiesInvited + invite.gentsInvited + invite.childrenInvited
  }

  const handleIncrement = async (guestId: string, functionId: string) => {
    const invite = getInvite(guestId, functionId)
    
    if (invite) {
      // Show category selection modal
      setShowCategoryModal({ inviteId: invite.id, functionId, guestId })
    } else {
      // Create new invite - need to create it first, then increment
      // For now, show modal to select category, then create with that category = 1
      setShowCategoryModal({ inviteId: '', functionId, guestId })
    }
  }

  const handleCategorySelect = async (category: 'ladies' | 'gents' | 'children') => {
    if (!showCategoryModal) return

    const { inviteId, functionId, guestId } = showCategoryModal
    setUpdatingInvites(prev => new Set(prev).add(inviteId || `${guestId}-${functionId}`))

    try {
      if (inviteId) {
        // Increment existing invite
        const response = await fetch(`/api/invites/${inviteId}/increment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        })

        if (response.ok) {
          const updated = await response.json()
          
          // Update local state optimistically
          setInviteMap(prev => {
            const newMap = new Map(prev)
            if (!newMap.has(guestId)) {
              newMap.set(guestId, new Map())
            }
            newMap.get(guestId)!.set(functionId, updated)
            return newMap
          })

          showToast('Updated ✔', 'success')
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update')
        }
      } else {
        // Check if invite exists first (might exist but not in our local state)
        const existingInvite = getInvite(guestId, functionId)
        
        if (existingInvite) {
          // Invite exists, increment it
          const response = await fetch(`/api/invites/${existingInvite.id}/increment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
          })

          if (response.ok) {
            const updated = await response.json()
            
            // Update local state optimistically
            setInviteMap(prev => {
              const newMap = new Map(prev)
              if (!newMap.has(guestId)) {
                newMap.set(guestId, new Map())
              }
              newMap.get(guestId)!.set(functionId, updated)
              return newMap
            })

            showToast('Updated ✔', 'success')
          } else {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update')
          }
        } else {
          // Create new invite with category = 1
          // The POST endpoint handles race conditions by checking and updating if exists
          const response = await fetch(`/api/functions/${functionId}/invites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guestId,
              ladiesInvited: category === 'ladies' ? 1 : 0,
              gentsInvited: category === 'gents' ? 1 : 0,
              childrenInvited: category === 'children' ? 1 : 0
            })
          })

          if (response.ok) {
            const newInvite = await response.json()
            
            // Update local state optimistically
            setInviteMap(prev => {
              const newMap = new Map(prev)
              if (!newMap.has(guestId)) {
                newMap.set(guestId, new Map())
              }
              newMap.get(guestId)!.set(functionId, newInvite)
              return newMap
            })

            showToast('Updated ✔', 'success')
          } else {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create invite')
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating invite:', error)
      showToast(error.message || 'Failed to update', 'error')
      // Refresh to get correct state
      router.refresh()
    } finally {
      setUpdatingInvites(prev => {
        const next = new Set(prev)
        next.delete(inviteId || `${guestId}-${functionId}`)
        return next
      })
      setShowCategoryModal(null)
    }
  }

  const handleDecrement = async (guestId: string, functionId: string) => {
    const invite = getInvite(guestId, functionId)
    if (!invite) return

    const total = getTotalCount(invite)
    if (total <= 0) return

    setUpdatingInvites(prev => new Set(prev).add(invite.id))

    try {
      const response = await fetch(`/api/invites/${invite.id}/increment`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updated = await response.json()
        
        // Update local state optimistically
        setInviteMap(prev => {
          const newMap = new Map(prev)
          if (!newMap.has(guestId)) {
            newMap.set(guestId, new Map())
          }
          
          // If all counts are 0, remove the invite from map
          if (updated.ladiesInvited === 0 && updated.gentsInvited === 0 && updated.childrenInvited === 0) {
            newMap.get(guestId)?.delete(functionId)
          } else {
            newMap.get(guestId)!.set(functionId, updated)
          }
          return newMap
        })

        showToast('Updated ✔', 'success')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }
    } catch (error: any) {
      console.error('Error decrementing invite:', error)
      showToast(error.message || 'Failed to update', 'error')
      // Refresh to get correct state
      router.refresh()
    } finally {
      setUpdatingInvites(prev => {
        const next = new Set(prev)
        next.delete(invite.id)
        return next
      })
    }
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
      
      {/* Table - Mobile: Stack name + buttons vertically, Desktop: Normal table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        {/* Mobile View (< 450px) */}
        <div className="block sm:hidden">
          {initialGuests.map((guest) => (
            <div key={guest.id} className="border-b border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                  {guest.group && (
                    <div className="text-xs text-gray-500 mt-1">{guest.group.name}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(guest)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium px-2 py-1"
                >
                  Delete
                </button>
              </div>
              
              {/* Functions scroll horizontally */}
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 min-w-max">
                  {functions.map(func => {
                    const invite = getInvite(guest.id, func.id)
                    const total = getTotalCount(invite)
                    const isUpdating = updatingInvites.has(invite?.id || `${guest.id}-${func.id}`)
                    
                    return (
                      <div key={func.id} className="flex-shrink-0 w-32 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-700 mb-2 text-center">
                          {func.name}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => handleDecrement(guest.id, func.id)}
                            disabled={isUpdating || total === 0}
                            className={`
                              w-12 h-12 flex items-center justify-center rounded-md font-bold text-xl
                              ${total === 0 || isUpdating
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                              }
                              transition-colors
                            `}
                          >
                            −
                          </button>
                          <span className={`
                            text-lg font-bold
                            ${isUpdating ? 'opacity-50' : ''}
                          `}>
                            {total}
                          </span>
                          <button
                            onClick={() => handleIncrement(guest.id, func.id)}
                            disabled={isUpdating}
                            className={`
                              w-12 h-12 flex items-center justify-center rounded-md font-bold text-xl
                              ${isUpdating
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
                              }
                              transition-colors
                            `}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (>= 450px) */}
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                {functions.map(func => (
                  <th
                    key={func.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                  >
                    <div className="flex flex-col">
                      <span>{func.name}</span>
                      {func.date && (
                        <span className="text-xs text-gray-400 font-normal mt-1">
                          {new Date(func.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{guest.name}</span>
                      {guest.group && (
                        <span className="text-xs text-gray-500">{guest.group.name}</span>
                      )}
                    </div>
                  </td>
                  {functions.map(func => {
                    const invite = getInvite(guest.id, func.id)
                    const total = getTotalCount(invite)
                    const isUpdating = updatingInvites.has(invite?.id || `${guest.id}-${func.id}`)
                    
                    return (
                      <td key={func.id} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDecrement(guest.id, func.id)}
                            disabled={isUpdating || total === 0}
                            className={`
                              w-7 h-7 flex items-center justify-center rounded-md font-bold text-base
                              ${total === 0 || isUpdating
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                              }
                              transition-colors
                            `}
                          >
                            −
                          </button>
                          <span className={`
                            text-sm font-medium min-w-[2rem] text-center
                            ${isUpdating ? 'opacity-50' : ''}
                          `}>
                            {total}
                          </span>
                          <button
                            onClick={() => handleIncrement(guest.id, func.id)}
                            disabled={isUpdating}
                            className={`
                              w-7 h-7 flex items-center justify-center rounded-md font-bold text-base
                              ${isUpdating
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
                              }
                              transition-colors
                            `}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(guest)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {initialGuests.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No guests found.
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm p-6 border shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Category</h3>
            <p className="text-sm text-gray-500 mb-4">Which category should be incremented?</p>
            <div className="space-y-2">
              <button
                onClick={() => handleCategorySelect('ladies')}
                className="w-full px-4 py-3 bg-pink-100 text-pink-800 rounded-md hover:bg-pink-200 text-sm font-medium"
              >
                Ladies
              </button>
              <button
                onClick={() => handleCategorySelect('gents')}
                className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                Gents
              </button>
              <button
                onClick={() => handleCategorySelect('children')}
                className="w-full px-4 py-3 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm font-medium"
              >
                Children
              </button>
            </div>
            <button
              onClick={() => setShowCategoryModal(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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

      {/* Delete All Modal */}
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
