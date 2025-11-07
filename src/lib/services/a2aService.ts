import { fetchWithApiKey } from '@/app/lib/api-helpers'

export const a2aService = {
  async getLatest(projectId: string, limit = 10) {
    const response = await fetchWithApiKey('/api/a2a/latest', {
      method: 'POST',
      body: JSON.stringify({ projectId, limit })
    })
    
    if (!response.ok) {
      throw new Error(`A2A fetch failed with status ${response.status}`)
    }
    
    return response.json()
  }
}

