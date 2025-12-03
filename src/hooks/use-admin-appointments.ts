import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminAppointmentStats,
  fetchAdminPendingAppointments,
  fetchAdminCompletedAppointments,
  fetchAdminRescheduledAppointments,
  fetchAdminCancelledAppointments,
  approveAppointment,
  declineAppointment,
  rescheduleAppointmentAdmin,
} from '@/lib/api/frontdesk'

// Query keys for cache management
export const adminAppointmentKeys = {
  all: ['admin-appointments'] as const,
  stats: () => [...adminAppointmentKeys.all, 'stats'] as const,
  pending: () => [...adminAppointmentKeys.all, 'pending'] as const,
  completed: () => [...adminAppointmentKeys.all, 'completed'] as const,
  rescheduled: () => [...adminAppointmentKeys.all, 'rescheduled'] as const,
  cancelled: () => [...adminAppointmentKeys.all, 'cancelled'] as const,
}

/**
 * Hook to fetch admin appointment statistics
 */
export function useAdminAppointmentStats() {
  return useQuery({
    queryKey: adminAppointmentKeys.stats(),
    queryFn: fetchAdminAppointmentStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

/**
 * Hook to fetch pending appointments for admin review
 */
export function useAdminPendingAppointments() {
  return useQuery({
    queryKey: adminAppointmentKeys.pending(),
    queryFn: fetchAdminPendingAppointments,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch completed appointments
 */
export function useAdminCompletedAppointments() {
  return useQuery({
    queryKey: adminAppointmentKeys.completed(),
    queryFn: fetchAdminCompletedAppointments,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch rescheduled appointments
 */
export function useAdminRescheduledAppointments() {
  return useQuery({
    queryKey: adminAppointmentKeys.rescheduled(),
    queryFn: fetchAdminRescheduledAppointments,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch cancelled appointments
 */
export function useAdminCancelledAppointments() {
  return useQuery({
    queryKey: adminAppointmentKeys.cancelled(),
    queryFn: fetchAdminCancelledAppointments,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to approve a pending appointment
 */
export function useApproveAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: number) => approveAppointment(appointmentId),
    onSuccess: () => {
      // Invalidate all admin appointment queries to refresh data
      queryClient.invalidateQueries({ queryKey: adminAppointmentKeys.all })
    },
  })
}

/**
 * Hook to decline a pending appointment
 */
export function useDeclineAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: number; reason?: string }) =>
      declineAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAppointmentKeys.all })
    },
  })
}

/**
 * Hook to reschedule an appointment
 */
export function useRescheduleAppointmentAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      appointmentId,
      newDate,
      newTime,
      reason,
    }: {
      appointmentId: number
      newDate: string
      newTime: string | null
      reason?: string
    }) => rescheduleAppointmentAdmin(appointmentId, newDate, newTime, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAppointmentKeys.all })
    },
  })
}
