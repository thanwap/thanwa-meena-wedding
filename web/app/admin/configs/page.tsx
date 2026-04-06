import { getConfigs } from './actions'
import ConfigsClient from './components/ConfigsClient'

export default async function ConfigsPage() {
  try {
    const configs = await getConfigs()
    return <ConfigsClient initialConfigs={configs} />
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return <pre style={{ padding: 32, background: '#fee', fontFamily: 'monospace' }}>{msg}</pre>
  }
}
