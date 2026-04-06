import { getConfigs } from './actions'
import ConfigsClient from './components/ConfigsClient'

export default async function ConfigsPage() {
  const configs = await getConfigs()
  return <ConfigsClient initialConfigs={configs} />
}
