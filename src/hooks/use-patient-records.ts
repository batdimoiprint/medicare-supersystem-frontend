import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPatientRecordsStats,
  fetchAllPatients,
  fetchPatientDetails,
  fetchPatientTreatments,
  fetchPatientPrescriptions,
  fetchPatientFollowUps,
  updatePatient,
  updatePatientEmergencyContact,
} from '@/lib/api/patient'

// ============================================
// PATIENT RECORDS HOOKS
// ============================================

/**
 * Hook to fetch patient records stats (total patients, active patients, new this month, visits this month)
 */
export function usePatientRecordsStats() {
  return useQuery({
    queryKey: ['patient-records-stats'],
    queryFn: fetchPatientRecordsStats,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch all patients with basic info
 */
export function useAllPatients() {
  return useQuery({
    queryKey: ['all-patients'],
    queryFn: fetchAllPatients,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch a single patient's full details
 */
export function usePatientDetails(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-details', patientId],
    queryFn: () => fetchPatientDetails(patientId!),
    enabled: patientId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch treatment history for a patient
 */
export function usePatientTreatments(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-treatments', patientId],
    queryFn: () => fetchPatientTreatments(patientId!),
    enabled: patientId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch prescriptions for a patient
 */
export function usePatientPrescriptions(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: () => fetchPatientPrescriptions(patientId!),
    enabled: patientId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch follow-ups for a patient
 */
export function usePatientFollowUps(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-follow-ups', patientId],
    queryFn: () => fetchPatientFollowUps(patientId!),
    enabled: patientId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to update patient information
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: number; data: Parameters<typeof updatePatient>[1] }) =>
      updatePatient(patientId, data),
    onSuccess: (_data, variables) => {
      // Invalidate patient queries
      queryClient.invalidateQueries({ queryKey: ['all-patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient-details', variables.patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient-records-stats'] })
    },
  })
}

/**
 * Hook to update patient emergency contact
 */
export function useUpdatePatientEmergencyContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: number; data: Parameters<typeof updatePatientEmergencyContact>[1] }) =>
      updatePatientEmergencyContact(patientId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient-details', variables.patientId] })
    },
  })
}
