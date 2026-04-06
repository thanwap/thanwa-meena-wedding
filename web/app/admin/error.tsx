'use client'

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h2>Admin Error</h2>
      <pre style={{ background: '#fee', padding: 16, borderRadius: 4 }}>
        {error.message}
        {'\n\nDigest: '}
        {error.digest}
      </pre>
    </div>
  )
}
