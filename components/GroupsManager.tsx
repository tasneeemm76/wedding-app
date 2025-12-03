'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Group, Label } from '@prisma/client'

interface GroupLabel {
  id: string
  label: Label
}

interface GroupWithLabels extends Group {
  labels: GroupLabel[]
  _count: {
    guests: number
  }
}

interface LabelWithCount extends Label {
  _count: {
    groups: number
  }
}

interface GroupsManagerProps {
  groups: GroupWithLabels[]
  labels: LabelWithCount[]
}

export default function GroupsManager({ groups: initialGroups, labels: initialLabels }: GroupsManagerProps) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [labels, setLabels] = useState(initialLabels)
  const [newLabelName, setNewLabelName] = useState('')
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [addingLabel, setAddingLabel] = useState<{ groupId: string; labelId: string } | null>(null)
  const [removingLabel, setRemovingLabel] = useState<string | null>(null)

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return

    setCreatingLabel(true)
    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName.trim() })
      })

      if (response.ok) {
        const newLabel = await response.json()
        setLabels([...labels, { ...newLabel, _count: { groups: 0 } }])
        setNewLabelName('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create label')
      }
    } catch (error) {
      console.error('Error creating label:', error)
      alert('Failed to create label')
    } finally {
      setCreatingLabel(false)
    }
  }

  const handleAddLabelToGroup = async (groupId: string, labelId: string) => {
    setAddingLabel({ groupId, labelId })
    try {
      const response = await fetch(`/api/groups/${groupId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId })
      })

      if (response.ok) {
        const groupLabel = await response.json()
        // Update groups state
        setGroups(groups.map(g => 
          g.id === groupId 
            ? { ...g, labels: [...g.labels, groupLabel] }
            : g
        ))
        // Update labels count
        setLabels(labels.map(l =>
          l.id === labelId
            ? { ...l, _count: { groups: l._count.groups + 1 } }
            : l
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add label to group')
      }
    } catch (error) {
      console.error('Error adding label to group:', error)
      alert('Failed to add label to group')
    } finally {
      setAddingLabel(null)
    }
  }

  const handleRemoveLabelFromGroup = async (groupId: string, labelId: string, groupLabelId: string) => {
    setRemovingLabel(groupLabelId)
    try {
      const response = await fetch(`/api/groups/${groupId}/labels?labelId=${labelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update groups state
        setGroups(groups.map(g =>
          g.id === groupId
            ? { ...g, labels: g.labels.filter(gl => gl.id !== groupLabelId) }
            : g
        ))
        // Update labels count
        setLabels(labels.map(l =>
          l.id === labelId
            ? { ...l, _count: { groups: Math.max(0, l._count.groups - 1) } }
            : l
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove label from group')
      }
    } catch (error) {
      console.error('Error removing label from group:', error)
      alert('Failed to remove label from group')
    } finally {
      setRemovingLabel(null)
    }
  }

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label? It will be removed from all groups.')) {
      return
    }

    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLabels(labels.filter(l => l.id !== labelId))
        // Remove label from all groups
        setGroups(groups.map(g => ({
          ...g,
          labels: g.labels.filter(gl => gl.label.id !== labelId)
        })))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete label')
      }
    } catch (error) {
      console.error('Error deleting label:', error)
      alert('Failed to delete label')
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Label Section */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Label</h2>
        <form onSubmit={handleCreateLabel} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., school friends, work colleagues"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            type="submit"
            disabled={creatingLabel || !newLabelName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            {creatingLabel ? 'Creating...' : 'Create Label'}
          </button>
        </form>
      </div>

      {/* Groups List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {groups.map((group) => {
            const availableLabels = labels.filter(
              label => !group.labels.some(gl => gl.label.id === label.id)
            )

            return (
              <div key={group.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {group.name}
                      {group.isPredefined && (
                        <span className="ml-2 text-xs text-indigo-600 font-normal">(Predefined)</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {group._count.guests} {group._count.guests === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                {/* Current Labels */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labels:
                  </label>
                  {group.labels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {group.labels.map((gl) => (
                        <span
                          key={gl.id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {gl.label.name}
                          <button
                            onClick={() => handleRemoveLabelFromGroup(group.id, gl.labelId, gl.id)}
                            disabled={removingLabel === gl.id}
                            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            title="Remove label"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No labels added</p>
                  )}
                </div>

                {/* Add Label Dropdown */}
                {availableLabels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Label:
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddLabelToGroup(group.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      disabled={addingLabel?.groupId === group.id}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                    >
                      <option value="">Select a label...</option>
                      {availableLabels.map((label) => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* All Labels Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Labels</h2>
        </div>
        <div className="p-4 sm:p-6">
          {labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {label.name}
                  <span className="text-xs text-gray-500">
                    ({label._count.groups} {label._count.groups === 1 ? 'group' : 'groups'})
                  </span>
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete label"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No labels created yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

