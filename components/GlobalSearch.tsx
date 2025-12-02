'use client'

import { useState, useEffect, useRef } from 'react'

interface Guest {
  id: string
  name: string
  ladies: number
  gents: number
  children: number
}

interface FunctionOverview {
  functionId: string
  functionName: string
  invited: boolean
  ladiesInvited: number
  gentsInvited: number
  childrenInvited: number
  rsvpReceived: boolean
  ladiesFinal: number
  gentsFinal: number
  childrenFinal: number
  rsvpNotes: string | null
}

interface SearchResult {
  guest: Guest
  functionOverview: FunctionOverview[]
  hasRSVP: boolean
  allRSVPNotes: Array<{ functionName: string; notes: string }>
}

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setSearchResult(null)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false)
        setSearchResult(null)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModal])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/search/guests?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search')
      }

      if (data.guest === null) {
        setError('Guest not found')
        setSearchResult(null)
      } else {
        setSearchResult(data)
        setShowModal(true)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }


  return (
    <>
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search guest by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </form>

      {showModal && searchResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Guest Details</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSearchResult(null)
                  setSearchQuery('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Guest Summary Card */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{searchResult.guest.name}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Ladies</p>
                    <p className="text-2xl font-bold text-indigo-600">{searchResult.guest.ladies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gents</p>
                    <p className="text-2xl font-bold text-indigo-600">{searchResult.guest.gents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Children</p>
                    <p className="text-2xl font-bold text-indigo-600">{searchResult.guest.children}</p>
                  </div>
                </div>
              </div>

              {/* RSVP Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">RSVP Received:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    searchResult.hasRSVP
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {searchResult.hasRSVP ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Per-Function Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Function Overview</h3>
                <div className="space-y-3">
                  {searchResult.functionOverview.map((overview) => (
                    <div
                      key={overview.functionId}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{overview.functionName}</h4>
                          </div>
                          <div className="space-y-2">
                            {overview.invited ? (
                              <div className="text-sm">
                                <p className="text-gray-700 font-medium mb-1">Invited:</p>
                                <p className="text-gray-600">
                                  {overview.ladiesInvited} Ladies, {overview.gentsInvited} Gents, {overview.childrenInvited} Children
                                </p>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium text-sm">Not Invited</span>
                            )}
                            {overview.rsvpReceived && (
                              <div className="text-sm mt-2">
                                <p className="text-gray-700 font-medium mb-1">RSVP Received:</p>
                                <p className="text-gray-600">
                                  {overview.ladiesFinal} Ladies, {overview.gentsFinal} Gents, {overview.childrenFinal} Children
                                </p>
                              </div>
                            )}
                            {overview.rsvpNotes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs font-medium text-blue-900 mb-1">Notes:</p>
                                <p className="text-sm text-blue-800">{overview.rsvpNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Notes Section */}
              {searchResult.allRSVPNotes.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-2">All Notes</h3>
                  <div className="space-y-2">
                    {searchResult.allRSVPNotes.map((note, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-yellow-900">{note.functionName}:</span>
                        <span className="text-yellow-800 ml-2">{note.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

