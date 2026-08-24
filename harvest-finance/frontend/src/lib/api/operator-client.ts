import { apiRequestOrThrow } from './client'
import type { OperatorReputation } from '@/types/operator'

export const operatorApi = {
  getReputation: async (
    operatorId: string,
    signal?: AbortSignal,
  ): Promise<OperatorReputation> => {
    return apiRequestOrThrow<OperatorReputation>(
      `/api/v1/operators/${operatorId}/reputation`,
      { method: 'GET', signal },
    )
  },
}
