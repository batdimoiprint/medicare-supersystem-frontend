import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchCancelledAppointments,
  getAppointmentDetails,
  approveCancellation,
  rejectCancellation,
  fetchAppointmentStatuses,
} from '@/lib/api/frontdesk'

/**
 * Hook to fetch all cancelled appointments (cancel requests)
 */
export function useCancelRequests() {
  return useQuery({
    queryKey: ['receptionist', 'cancel-requests', 'all'],
    queryFn: fetchCancelledAppointments,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch a single cancel request (appointment) details
 */
export function useCancelRequestDetails(appointmentId: number | undefined) {
  return useQuery({
    queryKey: ['receptionist', 'cancel-requests', 'detail', appointmentId],
    queryFn: () => appointmentId ? getAppointmentDetails(appointmentId) : null,
    enabled: appointmentId !== undefined,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to fetch appointment statuses
 */
export function useCancelRequestStatuses() {
  return useQuery({
    queryKey: ['receptionist', 'statuses'],
    queryFn: fetchAppointmentStatuses,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Hook to approve a cancellation request
 */
export function useApproveCancellation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: approveCancellation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'cancel-requests'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to reject a cancellation request (restore appointment)
 */
export function useRejectCancellation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: rejectCancellation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'cancel-requests'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}
