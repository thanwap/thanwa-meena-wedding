import Link from 'next/link'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Admin Dashboard
      </h1>
      <Link
        href="/admin/configs"
        className="inline-block px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
      >
        Manage Configs →
      </Link>
    </div>
  )
}
