import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchAllAppointments, 
  fetchAppointmentsFiltered,
  updateAppointmentStatus,
  updateAppointmentStatusByName,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  setPendingAppointment,
  assignDoctorToAppointment,
  rescheduleAppointment,
  getAppointmentById,
  getAppointmentDetails,
  fetchAppointmentStatuses,
  fetchAllPersonnel,
} from '@/lib/api/frontdesk'

/**
 * Hook to fetch all appointments
 */
export function useAppointments() {
  return useQuery({
    queryKey: ['receptionist', 'appointments', 'all'],
    queryFn: fetchAllAppointments,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch appointments with filters
 */
export function useAppointmentsFiltered(options?: {
  dateFrom?: string
  dateTo?: string
  statusId?: number
  personnelId?: number
}) {
  return useQuery({
    queryKey: ['receptionist', 'appointments', 'filtered', options],
    queryFn: () => fetchAppointmentsFiltered(options),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  })
}

/**
 * Hook to fetch a single appointment by ID (for table rows)
 */
export function useAppointmentRow(appointmentId: number | null) {
  return useQuery({
    queryKey: ['receptionist', 'appointments', 'row', appointmentId],
    queryFn: () => appointmentId ? getAppointmentById(appointmentId) : null,
    enabled: appointmentId !== null,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to fetch detailed appointment info (for details page)
 */
export function useAppointment(appointmentId: number | undefined) {
  return useQuery({
    queryKey: ['receptionist', 'appointments', 'detail', appointmentId],
    queryFn: () => appointmentId ? getAppointmentDetails(appointmentId) : null,
    enabled: appointmentId !== undefined,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to fetch all appointment statuses
 */
export function useAppointmentStatuses() {
  return useQuery({
    queryKey: ['receptionist', 'appointment-statuses'],
    queryFn: fetchAppointmentStatuses,
    staleTime: 1000 * 60 * 30, // 30 minutes - statuses don't change often
  })
}

/**
 * Hook to update appointment status
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, statusId }: { appointmentId: number; statusId: number }) =>
      updateAppointmentStatus(appointmentId, statusId),
    onSuccess: () => {
      // Invalidate appointments queries to refetch
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to update appointment status by name
 */
export function useUpdateAppointmentStatusByName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, statusName }: { appointmentId: number; statusName: string }) =>
      updateAppointmentStatusByName(appointmentId, statusName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to confirm an appointment
 */
export function useConfirmAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: number) => confirmAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to cancel an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: number) => cancelAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to complete an appointment
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: number) => completeAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to set appointment as pending
 */
export function useSetPendingAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appointmentId: number) => setPendingAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to assign a doctor to an appointment
 */
export function useAssignDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, personnelId }: { appointmentId: number; personnelId: number }) =>
      assignDoctorToAppointment(appointmentId, personnelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
    },
  })
}

/**
 * Hook to reschedule an appointment
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, newDate, newTime }: { appointmentId: number; newDate: string; newTime?: string }) =>
      rescheduleAppointment(appointmentId, newDate, newTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'dashboard'] })
    },
  })
}

/**
 * Hook to fetch all personnel (doctors) for assignment
 */
export function usePersonnel() {
  return useQuery({
    queryKey: ['receptionist', 'personnel'],
    queryFn: fetchAllPersonnel,
    staleTime: 1000 * 60 * 10, // 10 minutes - personnel list doesn't change often
  })
}
