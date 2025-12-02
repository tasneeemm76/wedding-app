'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Function, Guest, Invite } from '@prisma/client'

interface InviteWithGuest extends Invite {
  guest: Guest
}

interface FunctionInviteManagerProps {
  function: Function
  invites: InviteWithGuest[]
  availableGuests: Guest[]
}

export default function FunctionInviteManager({
  function: func,
  invites: initialInvites,
  availableGuests
}: FunctionInviteManagerProps) {
  const router = useRouter()
  const [invites, setInvites] = useState(initialInvites)
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [addingGuests, setAddingGuests] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInviteUpdate = async (
    inviteId: string,
    field: 'ladiesInvited' | 'gentsInvited' | 'childrenInvited',
    value: number
  ) => {
    setUpdatingIds(prev => new Set(prev).add(inviteId))
    try {
      const invite = invites.find(inv => inv.id === inviteId)
      const response = await fetch(`/api/functions/${func.id}/invites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          ladiesInvited: field === 'ladiesInvited' ? value : invite?.ladiesInvited || 0,
          gentsInvited: field === 'gentsInvited' ? value : invite?.gentsInvited || 0,
          childrenInvited: field === 'childrenInvited' ? value : invite?.childrenInvited || 0
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setInvites(invites.map(inv => inv.id === inviteId ? updated : inv))
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating invite:', error)
      alert('Failed to update invite')
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(inviteId)
        return next
      })
    }
  }

  // Filter guests based on search query
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return availableGuests.filter(guest =>
      guest.name.toLowerCase().includes(query)
    ).slice(0, 10) // Limit to 10 results
  }, [searchQuery, availableGuests])

  const handleToggleGuest = (guestId: string) => {
    setSelectedGuestIds(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) {
        next.delete(guestId)
      } else {
        next.add(guestId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedGuestIds(new Set(availableGuests.map(g => g.id)))
  }

  const handleUnselectAll = () => {
    setSelectedGuestIds(new Set())
  }

  const handleAddSelectedGuests = async () => {
    if (selectedGuestIds.size === 0) return

    setAddingGuests(true)
    try {
      const guestsToAdd = Array.from(selectedGuestIds).map(id => 
        availableGuests.find(g => g.id === id)
      ).filter(Boolean) as Guest[]

      if (guestsToAdd.length === 0) {
        alert('No valid guests selected')
        setAddingGuests(false)
        return
      }

      const promises = guestsToAdd.map(async (guest) => {
        const response = await fetch(`/api/functions/${func.id}/invites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: guest.id,
            ladiesInvited: guest.ladies,
            gentsInvited: guest.gents,
            childrenInvited: guest.children
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to add ${guest.name}`)
        }

        return response.json()
      })

      const newInvites = await Promise.all(promises)

      // Update state with new invites
      setInvites([...invites, ...newInvites])
      setSelectedGuestIds(new Set())
      
      // Refresh the page to get updated data
      router.refresh()
    } catch (error: any) {
      console.error('Error adding guests:', error)
      alert(`Failed to add guests: ${error.message || 'Unknown error'}`)
    } finally {
      setAddingGuests(false)
    }
  }

  const handleAddGuest = async (guestId: string) => {
    try {
      const guest = availableGuests.find(g => g.id === guestId)
      if (!guest) return

      const response = await fetch(`/api/functions/${func.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          ladiesInvited: guest.ladies,
          gentsInvited: guest.gents,
          childrenInvited: guest.children
        })
      })

      if (response.ok) {
        const newInvite = await response.json()
        setInvites([...invites, newInvite])
        setSearchQuery('')
        setShowSearchResults(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding guest:', error)
      alert('Failed to add guest')
    }
  }

  const handleRemoveInvite = async (inviteId: string) => {
    if (!confirm('Remove this guest from the function?')) return

    try {
      const response = await fetch(`/api/functions/${func.id}/invites?inviteId=${inviteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInvites(invites.filter(inv => inv.id !== inviteId))
        router.refresh()
      }
    } catch (error) {
      console.error('Error removing invite:', error)
      alert('Failed to remove invite')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Invites</h2>
        
        {/* Search/Add Guest Section */}
        {availableGuests.length > 0 && (
          <div className="mb-6">
            <div className="relative mb-4" ref={searchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and Add Guest
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(e.target.value.length > 0)
                }}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                placeholder="Type guest name to search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {showSearchResults && filteredGuests.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredGuests.map(guest => (
                    <button
                      key={guest.id}
                      onClick={() => handleAddGuest(guest.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{guest.name}</div>
                      <div className="text-sm text-gray-500">
                        {guest.ladies} Ladies, {guest.gents} Gents, {guest.children} Children
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showSearchResults && searchQuery.length > 0 && filteredGuests.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                  No guests found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uninvited Guests with Checkboxes */}
        {availableGuests.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Uninvited Guests ({availableGuests.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleUnselectAll}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Unselect All
                </button>
                {selectedGuestIds.size > 0 && (
                  <button
                    onClick={handleAddSelectedGuests}
                    disabled={addingGuests}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  >
                    {addingGuests ? 'Adding...' : `Add Selected (${selectedGuestIds.size})`}
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {availableGuests.map(guest => (
                <label
                  key={guest.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGuestIds.has(guest.id)}
                    onChange={() => handleToggleGuest(guest.id)}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{guest.name}</div>
                    <div className="text-sm text-gray-500">
                      {guest.ladies} Ladies, {guest.gents} Gents, {guest.children} Children
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {availableGuests.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">All guests have been invited to this function.</p>
        )}
      </div>

      {/* Invites Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ladies Invited
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gents Invited
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Children Invited
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invites.map((invite) => {
              const isUpdating = updatingIds.has(invite.id)
              if (!invite.guest) return null // Skip if guest is not loaded
              return (
                <tr key={invite.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invite.guest.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={invite.ladiesInvited}
                      onChange={(e) => handleInviteUpdate(invite.id, 'ladiesInvited', parseInt(e.target.value) || 0)}
                      disabled={isUpdating}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={invite.gentsInvited}
                      onChange={(e) => handleInviteUpdate(invite.id, 'gentsInvited', parseInt(e.target.value) || 0)}
                      disabled={isUpdating}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={invite.childrenInvited}
                      onChange={(e) => handleInviteUpdate(invite.id, 'childrenInvited', parseInt(e.target.value) || 0)}
                      disabled={isUpdating}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveInvite(invite.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {invites.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No guests invited yet. Add guests using the dropdown above.
        </div>
      )}
    </div>
  )
}

