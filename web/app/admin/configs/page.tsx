import { getConfigs } from './actions'
import ConfigsClient from './components/ConfigsClient'

export default async function ConfigsPage() {
  let errorMsg: string | null = null
  let configs: Awaited<ReturnType<typeof getConfigs>> = []
  try {
    configs = await getConfigs()
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : String(e)
  }
  if (errorMsg) {
    return <pre style={{ padding: 32, background: '#fee', fontFamily: 'monospace' }}>{errorMsg}</pre>
  }
  return <ConfigsClient initialConfigs={configs} />
}
