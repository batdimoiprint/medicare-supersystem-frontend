import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchAppointmentsLast7Days,
  fetchAppointmentStatusDistribution,
  fetchRecentActivity,
} from '@/lib/api/frontdesk'

/**
 * Hook to fetch all receptionist dashboard data
 */
export function useReceptionistDashboard() {
  const statsQuery = useQuery({
    queryKey: ['receptionist', 'dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })

  const appointmentsChartQuery = useQuery({
    queryKey: ['receptionist', 'dashboard', 'appointments-chart'],
    queryFn: fetchAppointmentsLast7Days,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })

  const statusDistributionQuery = useQuery({
    queryKey: ['receptionist', 'dashboard', 'status-distribution'],
    queryFn: fetchAppointmentStatusDistribution,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 2,
  })

  const recentActivityQuery = useQuery({
    queryKey: ['receptionist', 'dashboard', 'recent-activity'],
    queryFn: fetchRecentActivity,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 1, // Refetch every minute
  })

  const isLoading =
    statsQuery.isLoading ||
    appointmentsChartQuery.isLoading ||
    statusDistributionQuery.isLoading ||
    recentActivityQuery.isLoading

  const isError =
    statsQuery.isError ||
    appointmentsChartQuery.isError ||
    statusDistributionQuery.isError ||
    recentActivityQuery.isError

  const refetchAll = () => {
    statsQuery.refetch()
    appointmentsChartQuery.refetch()
    statusDistributionQuery.refetch()
    recentActivityQuery.refetch()
  }

  return {
    // Data
    stats: statsQuery.data,
    appointmentsChart: appointmentsChartQuery.data,
    statusDistribution: statusDistributionQuery.data,
    recentActivity: recentActivityQuery.data,
    
    // Loading states
    isLoading,
    isStatsLoading: statsQuery.isLoading,
    isChartLoading: appointmentsChartQuery.isLoading,
    isDistributionLoading: statusDistributionQuery.isLoading,
    isActivityLoading: recentActivityQuery.isLoading,
    
    // Error states
    isError,
    statsError: statsQuery.error,
    chartError: appointmentsChartQuery.error,
    distributionError: statusDistributionQuery.error,
    activityError: recentActivityQuery.error,
    
    // Actions
    refetchAll,
  }
}
