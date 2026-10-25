import { adminGetPreweddingPhotos } from "./actions"
import { PreweddingManager } from "./prewedding-manager"

export const dynamic = "force-dynamic"

export default async function PreweddingAdminPage() {
  const photos = await adminGetPreweddingPhotos()
  return <PreweddingManager initialPhotos={photos} />
}
