'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function addToast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substring(7)
  const newToast: Toast = { id, message, type }
  toasts = [...toasts, newToast]
  toastListeners.forEach(listener => listener([...toasts]))

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  toastListeners.forEach(listener => listener([...toasts]))
}

export function showToast(message: string, type: ToastType = 'info') {
  addToast(message, type)
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts)
    }
    toastListeners.push(listener)
    setCurrentToasts([...toasts])

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full sm:w-auto">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg flex items-start justify-between gap-4
            transition-all duration-300 ease-in-out
            ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
          `}
        >
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className={`
              flex-shrink-0 text-lg leading-none opacity-70 hover:opacity-100
              ${toast.type === 'success' ? 'text-green-600' : ''}
              ${toast.type === 'error' ? 'text-red-600' : ''}
              ${toast.type === 'info' ? 'text-blue-600' : ''}
            `}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

