'use client'

import { useState } from 'react'
import type { ConfigDto } from '../types'

interface Props {
  initial?: ConfigDto
  onSave: (key: string, value: string, type: string) => void
  onCancel: () => void
}

export default function ConfigForm({ initial, onSave, onCancel }: Props) {
  const [key, setKey] = useState(initial?.key ?? '')
  const [value, setValue] = useState(initial?.value ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || !value.trim() || !type.trim()) {
      setError('All fields are required')
      return
    }
    setError('')
    onSave(key.trim(), value.trim(), type.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 border border-gray-200 rounded bg-gray-50"
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label
            htmlFor="key"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Key
          </label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. marry_date"
          />
        </div>
        <div>
          <label
            htmlFor="value"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Value
          </label>
          <input
            id="value"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. 2026-12-26"
          />
        </div>
        <div>
          <label
            htmlFor="type"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Type
          </label>
          <input
            id="type"
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. date"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
