import { useQuery } from '@tanstack/react-query'
import {
  fetchDentistManagementStats,
  fetchAllDentists,
  fetchDentistPatients,
  fetchDentistTreatmentLogs,
  fetchDentistPrescriptions,
  fetchDentistFollowUps,
  fetchServiceCategories,
} from '@/lib/api/dentist'

// ============================================
// DENTIST MANAGEMENT HOOKS
// ============================================

/**
 * Hook to fetch dentist management stats
 */
export function useDentistManagementStats() {
  return useQuery({
    queryKey: ['dentist-management-stats'],
    queryFn: fetchDentistManagementStats,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch all dentists
 */
export function useAllDentists() {
  return useQuery({
    queryKey: ['all-dentists'],
    queryFn: fetchAllDentists,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch patients for a specific dentist
 */
export function useDentistPatients(personnelId: number | null) {
  return useQuery({
    queryKey: ['dentist-patients', personnelId],
    queryFn: () => fetchDentistPatients(personnelId!),
    enabled: personnelId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch treatment logs for a specific dentist
 */
export function useDentistTreatmentLogs(personnelId: number | null) {
  return useQuery({
    queryKey: ['dentist-treatment-logs', personnelId],
    queryFn: () => fetchDentistTreatmentLogs(personnelId!),
    enabled: personnelId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch prescriptions for a specific dentist
 */
export function useDentistPrescriptions(personnelId: number | null) {
  return useQuery({
    queryKey: ['dentist-prescriptions', personnelId],
    queryFn: () => fetchDentistPrescriptions(personnelId!),
    enabled: personnelId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch follow-ups for a specific dentist
 */
export function useDentistFollowUps(personnelId: number | null) {
  return useQuery({
    queryKey: ['dentist-follow-ups', personnelId],
    queryFn: () => fetchDentistFollowUps(personnelId!),
    enabled: personnelId !== null,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch service categories (specializations)
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: fetchServiceCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes (rarely changes)
  })
}
