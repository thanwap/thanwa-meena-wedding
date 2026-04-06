'use client'

import type { ConfigDto } from '../types'

interface Props {
  configs: ConfigDto[]
  onEdit: (config: ConfigDto) => void
  onDelete: (id: number) => void
}

export default function ConfigTable({ configs, onEdit, onDelete }: Props) {
  if (configs.length === 0) {
    return <p className="text-gray-500 text-sm">No configs yet.</p>
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Key</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Value</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Type</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Updated At</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {configs.map((config) => (
          <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 px-3 font-mono">{config.key}</td>
            <td className="py-2 px-3">{config.value}</td>
            <td className="py-2 px-3 text-gray-500">{config.type}</td>
            <td className="py-2 px-3 text-gray-400 text-xs">
              {new Date(config.updatedAt).toLocaleString()}
            </td>
            <td className="py-2 px-3">
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(config)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(config.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
