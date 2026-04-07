import { getConfigs } from "./actions"
import { ConfigsClient } from "./components/ConfigsClient"

export const dynamic = "force-dynamic"

export default async function ConfigsPage() {
  const configs = await getConfigs()
  return <ConfigsClient initialConfigs={configs} />
}
