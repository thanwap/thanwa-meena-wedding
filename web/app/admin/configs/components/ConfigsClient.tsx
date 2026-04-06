'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfigTable from './ConfigTable'
import ConfigForm from './ConfigForm'
import { createConfig, updateConfig, deleteConfig } from '../actions'
import type { ConfigDto } from '../types'

interface Props {
  initialConfigs: ConfigDto[]
}

export default function ConfigsClient({ initialConfigs }: Props) {
  const router = useRouter()
  const [editingConfig, setEditingConfig] = useState<ConfigDto | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this config?')) return
    await deleteConfig(id)
    router.refresh()
  }

  const handleSave = async (key: string, value: string, type: string) => {
    if (editingConfig) {
      await updateConfig(editingConfig.id, key, value, type)
    } else {
      await createConfig(key, value, type)
    }
    setEditingConfig(null)
    setIsAdding(false)
    router.refresh()
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingConfig(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Configs</h1>
        {!isAdding && !editingConfig && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Add Config
          </button>
        )}
      </div>
      {(isAdding || editingConfig) && (
        <ConfigForm
          initial={editingConfig ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      <ConfigTable
        configs={initialConfigs}
        onEdit={(config) => {
          setEditingConfig(config)
          setIsAdding(false)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}
