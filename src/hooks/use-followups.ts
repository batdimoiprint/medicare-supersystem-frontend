import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchAllFollowups,
  getFollowupDetails,
  updateFollowupStatus,
  updateFollowupStatusByName,
  confirmFollowup,
  cancelFollowup,
  completeFollowup,
  setPendingFollowup,
  fetchAppointmentStatuses,
} from '@/lib/api/frontdesk'

/**
 * Hook to fetch all followups
 */
export function useFollowups() {
  return useQuery({
    queryKey: ['receptionist', 'followups', 'all'],
    queryFn: fetchAllFollowups,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch detailed followup info (for details page)
 */
export function useFollowup(followupId: number | undefined) {
  return useQuery({
    queryKey: ['receptionist', 'followups', 'detail', followupId],
    queryFn: () => followupId ? getFollowupDetails(followupId) : null,
    enabled: followupId !== undefined,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to fetch all appointment statuses (shared with appointments)
 */
export function useFollowupStatuses() {
  return useQuery({
    queryKey: ['receptionist', 'statuses'],
    queryFn: fetchAppointmentStatuses,
    staleTime: 1000 * 60 * 10, // 10 minutes - statuses don't change often
  })
}

/**
 * Hook to update followup status by ID
 */
export function useUpdateFollowupStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ followupId, statusId }: { followupId: number; statusId: number }) =>
      updateFollowupStatus(followupId, statusId),
    onSuccess: () => {
      // Invalidate followup queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to update followup status by name
 */
export function useUpdateFollowupStatusByName() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ followupId, statusName }: { followupId: number; statusName: string }) =>
      updateFollowupStatusByName(followupId, statusName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to confirm a followup
 */
export function useConfirmFollowup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: confirmFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to cancel a followup
 */
export function useCancelFollowup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cancelFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to complete a followup
 */
export function useCompleteFollowup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: completeFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to set followup as pending
 */
export function useSetPendingFollowup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: setPendingFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'followups'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}
