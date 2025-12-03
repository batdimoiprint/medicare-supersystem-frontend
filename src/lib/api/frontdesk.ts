import supabase from '@/utils/supabase'
import type {
  Appointment,
  Followup,
  AppointmentStatus,
  DashboardStats,
  AppointmentsByDay,
  AppointmentStatusDistribution,
  RecentActivity,
  AppointmentDetail,
  FollowupTableRow,
  FollowupDetail,
  AdminAppointmentStats,
  AdminPendingAppointment,
  AdminCompletedAppointment,
  AdminRescheduledAppointment,
  AdminCancelledAppointment,
} from '@/types/frontdesk'

// Helper to access frontdesk schema
const frontdesk = () => supabase.schema('frontdesk')

// Get today's date in YYYY-MM-DD format (local timezone)
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get today's date in UTC (YYYY-MM-DD format)
const getTodayDateUTC = () => {
  const today = new Date()
  const year = today.getUTCFullYear()
  const month = String(today.getUTCMonth() + 1).padStart(2, '0')
  const day = String(today.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get date N days ago (local timezone)
const getDateDaysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get current timestamp in local timezone format for database (YYYY-MM-DD HH:MM:SS)
const getLocalTimestamp = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Fetch today's appointment count
 */
export async function fetchTodaysAppointmentCount(): Promise<number> {
  const today = getTodayDate()

  const { count, error } = await frontdesk()
    .from('appointment_tbl')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_date', today)

  if (error) {
    throw error
  }

  return count ?? 0
}

/**
 * Fetch pending followups count (followups with pending/scheduled status)
 */
export async function fetchPendingFollowupsCount(): Promise<number> {
  // Get the status ID for 'Pending' or 'Scheduled' status
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .in('appointment_status_name', ['Pending', 'Scheduled', 'Confirmed'])

  const statusIds = statusData?.map(s => s.appointment_status_id) ?? []

  const { count, error } = await frontdesk()
    .from('followup_tbl')
    .select('*', { count: 'exact', head: true })
    .in('appointment_status_id', statusIds)

  if (error) {
    throw error
  }

  return count ?? 0
}

/**
 * Fetch cancel requests count (appointments with cancelled status)
 */
export async function fetchCancelRequestsCount(): Promise<number> {
  // Get the status ID for 'Cancelled' or 'Cancel Requested' status
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .ilike('appointment_status_name', '%cancel%')

  const statusIds = statusData?.map(s => s.appointment_status_id) ?? []

  if (statusIds.length === 0) {
    return 0
  }

  const { count, error } = await frontdesk()
    .from('appointment_tbl')
    .select('*', { count: 'exact', head: true })
    .in('appointment_status_id', statusIds)

  if (error) {
    throw error
  }

  return count ?? 0
}

/**
 * Fetch all dashboard stats in parallel
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [todaysAppointments, pendingFollowups, cancelRequests] = await Promise.all([
    fetchTodaysAppointmentCount(),
    fetchPendingFollowupsCount(),
    fetchCancelRequestsCount(),
  ])

  return {
    todaysAppointments,
    pendingFollowups,
    cancelRequests,
    avgWaitMinutes: 12, // This would need a separate tracking system
  }
}

/**
 * Fetch appointments for the last 7 days grouped by day
 */
export async function fetchAppointmentsLast7Days(): Promise<AppointmentsByDay[]> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const result: AppointmentsByDay[] = []

  // Get appointments from last 7 days
  const startDate = getDateDaysAgo(6)
  const endDate = getTodayDate()

  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_date')
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)

  if (error) {
    throw error
  }

  // Group by day
  const countsByDate: Record<string, number> = {}
  data?.forEach(apt => {
    if (apt.appointment_date) {
      // appointment_date is a date type, should already be YYYY-MM-DD
      const dateOnly = String(apt.appointment_date).split('T')[0]
      countsByDate[dateOnly] = (countsByDate[dateOnly] || 0) + 1
    }
  })

  // Build result for last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayName = days[date.getDay()]

    result.push({
      day: dayName,
      count: countsByDate[dateStr] || 0,
    })
  }

  return result
}

/**
 * Fetch appointment status distribution for today
 */
export async function fetchAppointmentStatusDistribution(): Promise<AppointmentStatusDistribution[]> {
  const today = getTodayDate()

  // First get all statuses
  const { data: statuses } = await frontdesk()
    .from('appointment_status_tbl')
    .select('*')

  // Get today's appointments with their status
  const { data: appointments, error } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_status_id')
    .eq('appointment_date', today)

  if (error) {
    throw error
  }

  // Count by status
  const statusCounts: Record<number, number> = {}
  appointments?.forEach(apt => {
    if (apt.appointment_status_id) {
      statusCounts[apt.appointment_status_id] = (statusCounts[apt.appointment_status_id] || 0) + 1
    }
  })

  // Map to status names
  const result: AppointmentStatusDistribution[] = []
  statuses?.forEach(status => {
    const count = statusCounts[status.appointment_status_id] || 0
    if (count > 0) {
      result.push({
        status: status.appointment_status_name,
        count,
      })
    }
  })

  return result
}

/**
 * Fetch recent activity (last 10 appointments/changes)
 */
export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const { data: appointments, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      appointment_status_id,
      created_at,
      appointment_status_tbl (
        appointment_status_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw error
  }

  const activities: RecentActivity[] = []

  appointments?.forEach(apt => {
    // Handle the joined relation - cast through unknown first for type safety
    const statusData = apt.appointment_status_tbl as unknown
    const statusObj = Array.isArray(statusData)
      ? statusData[0] as { appointment_status_name: string } | undefined
      : statusData as { appointment_status_name: string } | null
    const statusName = statusObj?.appointment_status_name?.toLowerCase() ?? ''
    let type: RecentActivity['type'] = 'appointment_confirmed'

    if (statusName.includes('cancel')) {
      type = 'appointment_cancelled'
    } else if (statusName.includes('confirm')) {
      type = 'appointment_confirmed'
    }

    activities.push({
      id: apt.appointment_id,
      type,
      description: `Appointment #${apt.appointment_id} ${statusName}`,
      timestamp: apt.created_at ?? new Date().toISOString(),
    })
  })

  return activities
}

/**
 * Fetch all appointment statuses (for lookups)
 */
export async function fetchAppointmentStatuses(): Promise<AppointmentStatus[]> {
  const { data, error } = await frontdesk()
    .from('appointment_status_tbl')
    .select('*')
    .order('appointment_status_id')

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Fetch today's appointments with full details
 */
export async function fetchTodaysAppointments(): Promise<Appointment[]> {
  const today = getTodayDate()

  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      *,
      appointment_status_tbl (
        appointment_status_id,
        appointment_status_name
      )
    `)
    .eq('appointment_date', today)
    .order('appointment_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(apt => ({
    ...apt,
    appointment_status: apt.appointment_status_tbl as AppointmentStatus | undefined,
  }))
}

/**
 * Appointment row type for the table display
 */
export interface AppointmentTableRow {
  id: string
  patientName: string
  doctorAssigned: string
  status: string
  appointmentDate: string
  appointmentTime: string | null
  serviceId: number | null
}

/**
 * Fetch all appointments with patient and personnel details
 */
export async function fetchAllAppointments(): Promise<AppointmentTableRow[]> {
  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })

  if (error) {
    throw error
  }

  // Fetch status names
  const { data: statuses } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id, appointment_status_name')

  const statusMap = new Map(
    statuses?.map(s => [s.appointment_status_id, s.appointment_status_name]) ?? []
  )

  // Fetch patient names from patient_record schema
  const patientIds = [...new Set(data?.map(a => a.patient_id) ?? [])]
  const { data: patients } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('patient_id, f_name, l_name')
    .in('patient_id', patientIds)

  const patientMap = new Map(
    patients?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []
  )

  // Fetch personnel names (doctors)
  const personnelIds = [...new Set(data?.filter(a => a.personnel_id).map(a => a.personnel_id) ?? [])]
  const { data: personnel } = await supabase
    .from('personnel_tbl')
    .select('personnel_id, f_name, l_name')
    .in('personnel_id', personnelIds)

  const personnelMap = new Map(
    personnel?.map(p => [p.personnel_id, `Dr. ${p.f_name} ${p.l_name}`]) ?? []
  )

  // Map to table row format
  return (data ?? []).map(apt => ({
    id: String(apt.appointment_id),
    patientName: patientMap.get(apt.patient_id) ?? `Patient #${apt.patient_id}`,
    doctorAssigned: apt.personnel_id ? (personnelMap.get(apt.personnel_id) ?? 'Unassigned') : 'Unassigned',
    status: statusMap.get(apt.appointment_status_id) ?? 'Unknown',
    appointmentDate: apt.appointment_date
      ? `${apt.appointment_date}${apt.appointment_time ? ' ' + apt.appointment_time : ''}`
      : 'No date',
    appointmentTime: apt.appointment_time,
    serviceId: apt.service_id,
  }))
}

/**
 * Fetch appointments with optional filters
 */
export async function fetchAppointmentsFiltered(options?: {
  dateFrom?: string
  dateTo?: string
  statusId?: number
  personnelId?: number
}): Promise<AppointmentTableRow[]> {
  let query = frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)

  if (options?.dateFrom) {
    query = query.gte('appointment_date', options.dateFrom)
  }
  if (options?.dateTo) {
    query = query.lte('appointment_date', options.dateTo)
  }
  if (options?.statusId) {
    query = query.eq('appointment_status_id', options.statusId)
  }
  if (options?.personnelId) {
    query = query.eq('personnel_id', options.personnelId)
  }

  const { data, error } = await query
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })

  if (error) {
    throw error
  }

  // Fetch status names
  const { data: statuses } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id, appointment_status_name')

  const statusMap = new Map(
    statuses?.map(s => [s.appointment_status_id, s.appointment_status_name]) ?? []
  )

  // Fetch patient names
  const patientIds = [...new Set(data?.map(a => a.patient_id) ?? [])]
  const { data: patients } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('patient_id, f_name, l_name')
    .in('patient_id', patientIds)

  const patientMap = new Map(
    patients?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []
  )

  // Fetch personnel names
  const personnelIds = [...new Set(data?.filter(a => a.personnel_id).map(a => a.personnel_id) ?? [])]
  const { data: personnel } = await supabase
    .from('personnel_tbl')
    .select('personnel_id, f_name, l_name')
    .in('personnel_id', personnelIds)

  const personnelMap = new Map(
    personnel?.map(p => [p.personnel_id, `Dr. ${p.f_name} ${p.l_name}`]) ?? []
  )

  return (data ?? []).map(apt => ({
    id: String(apt.appointment_id),
    patientName: patientMap.get(apt.patient_id) ?? `Patient #${apt.patient_id}`,
    doctorAssigned: apt.personnel_id ? (personnelMap.get(apt.personnel_id) ?? 'Unassigned') : 'Unassigned',
    status: statusMap.get(apt.appointment_status_id) ?? 'Unknown',
    appointmentDate: apt.appointment_date
      ? `${apt.appointment_date}${apt.appointment_time ? ' ' + apt.appointment_time : ''}`
      : 'No date',
    appointmentTime: apt.appointment_time,
    serviceId: apt.service_id,
  }))
}

/**
 * Fetch pending followups with details
 */
export async function fetchPendingFollowups(): Promise<Followup[]> {
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .in('appointment_status_name', ['Pending', 'Scheduled', 'Confirmed'])

  const statusIds = statusData?.map(s => s.appointment_status_id) ?? []

  const { data, error } = await frontdesk()
    .from('followup_tbl')
    .select(`
      *,
      appointment_status_tbl (
        appointment_status_id,
        appointment_status_name
      )
    `)
    .in('appointment_status_id', statusIds)
    .order('followup_date', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(f => ({
    ...f,
    appointment_status: f.appointment_status_tbl as AppointmentStatus | undefined,
  }))
}

// ==================== APPOINTMENT STATUS UPDATES ====================

/**
 * Update appointment status by ID
 */
export async function updateAppointmentStatus(
  appointmentId: number,
  statusId: number
): Promise<void> {
  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update({ appointment_status_id: statusId })
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Update appointment status by status name
 */
export async function updateAppointmentStatusByName(
  appointmentId: number,
  statusName: string
): Promise<void> {
  // First, find the status ID
  const { data: statusData, error: statusError } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .ilike('appointment_status_name', statusName)
    .single()

  if (statusError || !statusData) {
    throw new Error(`Status "${statusName}" not found`)
  }

  // Then update the appointment
  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update({ appointment_status_id: statusData.appointment_status_id })
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Confirm an appointment
 */
export async function confirmAppointment(appointmentId: number): Promise<void> {
  return updateAppointmentStatusByName(appointmentId, 'Confirmed')
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: number): Promise<void> {
  return updateAppointmentStatusByName(appointmentId, 'Cancelled')
}

/**
 * Mark appointment as completed
 */
export async function completeAppointment(appointmentId: number): Promise<void> {
  return updateAppointmentStatusByName(appointmentId, 'Completed')
}

/**
 * Mark appointment as pending
 */
export async function setPendingAppointment(appointmentId: number): Promise<void> {
  return updateAppointmentStatusByName(appointmentId, 'Pending')
}

/**
 * Assign a doctor (personnel) to an appointment
 */
export async function assignDoctorToAppointment(
  appointmentId: number,
  personnelId: number
): Promise<void> {
  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update({ personnel_id: personnelId })
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  appointmentId: number,
  newDate: string,
  newTime?: string
): Promise<void> {
  const updateData: { appointment_date: string; appointment_time?: string } = {
    appointment_date: newDate,
  }

  if (newTime) {
    updateData.appointment_time = newTime
  }

  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update(updateData)
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(appointmentId: number): Promise<AppointmentTableRow | null> {
  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)
    .eq('appointment_id', appointmentId)
    .single()

  if (error) {
    throw error
  }

  if (!data) return null

  // Fetch status name
  const { data: status } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_name')
    .eq('appointment_status_id', data.appointment_status_id)
    .single()

  // Fetch patient name
  const { data: patient } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('f_name, l_name')
    .eq('patient_id', data.patient_id)
    .single()

  // Fetch personnel name
  let personnelName = 'Unassigned'
  if (data.personnel_id) {
    const { data: personnel } = await supabase
      .from('personnel_tbl')
      .select('f_name, l_name')
      .eq('personnel_id', data.personnel_id)
      .single()

    if (personnel) {
      personnelName = `Dr. ${personnel.f_name} ${personnel.l_name}`
    }
  }

  return {
    id: String(data.appointment_id),
    patientName: patient ? `${patient.f_name} ${patient.l_name}` : `Patient #${data.patient_id}`,
    doctorAssigned: personnelName,
    status: status?.appointment_status_name ?? 'Unknown',
    appointmentDate: data.appointment_date
      ? `${data.appointment_date}${data.appointment_time ? ' ' + data.appointment_time : ''}`
      : 'No date',
    appointmentTime: data.appointment_time,
    serviceId: data.service_id,
  }
}

/**
 * Get detailed appointment information for the details page
 */
export async function getAppointmentDetails(appointmentId: number): Promise<AppointmentDetail | null> {
  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)
    .eq('appointment_id', appointmentId)
    .single()

  if (error) {
    throw error
  }

  if (!data) return null

  // Fetch status name
  const { data: status } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_name')
    .eq('appointment_status_id', data.appointment_status_id)
    .single()

  // Fetch full patient info from patient_record schema
  const { data: patient } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select(`
      f_name,
      l_name,
      m_name,
      suffix,
      email,
      pri_contact_no,
      sec_contact_no,
      gender,
      birthdate,
      house_no,
      street,
      barangay,
      city,
      country
    `)
    .eq('patient_id', data.patient_id)
    .single()

  // Build full address
  const addressParts = [
    patient?.house_no,
    patient?.street,
    patient?.barangay,
    patient?.city,
    patient?.country
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  // Fetch personnel info from public schema
  let personnelFirstName: string | null = null
  let personnelLastName: string | null = null
  if (data.personnel_id) {
    const { data: personnel } = await supabase
      .from('personnel_tbl')
      .select('f_name, l_name')
      .eq('personnel_id', data.personnel_id)
      .single()

    if (personnel) {
      personnelFirstName = personnel.f_name
      personnelLastName = personnel.l_name
    }
  }

  // Fetch service info from dentist schema
  let serviceName: string | null = null
  let serviceDescription: string | null = null
  let serviceFee: number | null = null
  let serviceDuration: string | null = null
  let serviceCategoryName: string | null = null

  if (data.service_id) {
    const { data: service } = await supabase
      .schema('dentist')
      .from('services_tbl')
      .select(`
        service_name,
        service_description,
        service_fee,
        service_duration,
        service_category_id
      `)
      .eq('service_id', data.service_id)
      .single()

    if (service) {
      serviceName = service.service_name
      serviceDescription = service.service_description
      serviceFee = service.service_fee
      serviceDuration = service.service_duration

      // Fetch category name
      if (service.service_category_id) {
        const { data: category } = await supabase
          .schema('dentist')
          .from('service_category_tbl')
          .select('category_name')
          .eq('service_category_id', service.service_category_id)
          .single()

        if (category) {
          serviceCategoryName = category.category_name
        }
      }
    }
  }

  return {
    appointment_id: data.appointment_id,
    patient_id: data.patient_id,
    service_id: data.service_id,
    appointment_time: data.appointment_time,
    appointment_date: data.appointment_date,
    appointment_status_id: data.appointment_status_id,
    personnel_id: data.personnel_id,
    created_at: data.created_at,
    // Status
    appointment_status_name: status?.appointment_status_name ?? null,
    // Patient info
    patient_first_name: patient?.f_name ?? null,
    patient_last_name: patient?.l_name ?? null,
    patient_middle_name: patient?.m_name ?? null,
    patient_suffix: patient?.suffix ?? null,
    patient_email: patient?.email ?? null,
    patient_contact: patient?.pri_contact_no ?? null,
    patient_secondary_contact: patient?.sec_contact_no ?? null,
    patient_gender: patient?.gender ?? null,
    patient_birthdate: patient?.birthdate ?? null,
    patient_address: fullAddress,
    // Personnel info
    personnel_first_name: personnelFirstName,
    personnel_last_name: personnelLastName,
    // Service info
    service_name: serviceName,
    service_description: serviceDescription,
    service_fee: serviceFee,
    service_duration: serviceDuration,
    service_category_name: serviceCategoryName,
  }
}

// ============================================
// FOLLOWUP API FUNCTIONS
// ============================================

/**
 * Fetch all followups for the list view
 */
export async function fetchAllFollowups(): Promise<FollowupTableRow[]> {
  const { data, error } = await frontdesk()
    .from('followup_tbl')
    .select(`
      followup_id,
      patient_id,
      appointment_id,
      followup_date,
      followup_time,
      service_id,
      appointment_status_id,
      personnel_id
    `)
    .order('followup_date', { ascending: false })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch related data for each followup
  const followupsWithDetails = await Promise.all(
    data.map(async (followup) => {
      // Fetch status name
      let statusName = 'Unknown'
      if (followup.appointment_status_id) {
        const { data: status } = await frontdesk()
          .from('appointment_status_tbl')
          .select('appointment_status_name')
          .eq('appointment_status_id', followup.appointment_status_id)
          .single()
        if (status) statusName = status.appointment_status_name
      }

      // Fetch patient name
      let patientName = `Patient #${followup.patient_id}`
      const { data: patient } = await supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('f_name, l_name')
        .eq('patient_id', followup.patient_id)
        .single()
      if (patient) patientName = `${patient.f_name} ${patient.l_name}`

      // Fetch personnel name
      let personnelName = 'Unassigned'
      if (followup.personnel_id) {
        const { data: personnel } = await supabase
          .from('personnel_tbl')
          .select('f_name, l_name')
          .eq('personnel_id', followup.personnel_id)
          .single()
        if (personnel) personnelName = `Dr. ${personnel.f_name} ${personnel.l_name}`
      }

      return {
        id: String(followup.followup_id),
        patientName,
        doctorAssigned: personnelName,
        status: statusName,
        appointmentDate: followup.followup_date
          ? `${followup.followup_date}${followup.followup_time ? ' ' + followup.followup_time : ''}`
          : 'No date',
        followupTime: followup.followup_time,
        serviceId: followup.service_id,
        originalAppointmentId: followup.appointment_id,
      }
    })
  )

  return followupsWithDetails
}

/**
 * Get detailed followup information for the details page
 */
export async function getFollowupDetails(followupId: number): Promise<FollowupDetail | null> {
  const { data, error } = await frontdesk()
    .from('followup_tbl')
    .select(`
      followup_id,
      patient_id,
      appointment_id,
      followup_date,
      followup_time,
      service_id,
      appointment_status_id,
      personnel_id
    `)
    .eq('followup_id', followupId)
    .single()

  if (error) {
    throw error
  }

  if (!data) return null

  // Fetch status name
  const { data: status } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_name')
    .eq('appointment_status_id', data.appointment_status_id)
    .single()

  // Fetch full patient info from patient_record schema
  const { data: patient } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select(`
      f_name,
      l_name,
      m_name,
      suffix,
      email,
      pri_contact_no,
      sec_contact_no,
      gender,
      birthdate,
      house_no,
      street,
      barangay,
      city,
      country
    `)
    .eq('patient_id', data.patient_id)
    .single()

  // Build full address
  const addressParts = [
    patient?.house_no,
    patient?.street,
    patient?.barangay,
    patient?.city,
    patient?.country
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  // Fetch personnel info
  let personnelFirstName: string | null = null
  let personnelLastName: string | null = null
  if (data.personnel_id) {
    const { data: personnel } = await supabase
      .from('personnel_tbl')
      .select('f_name, l_name')
      .eq('personnel_id', data.personnel_id)
      .single()

    if (personnel) {
      personnelFirstName = personnel.f_name
      personnelLastName = personnel.l_name
    }
  }

  // Fetch service info from dentist schema
  let serviceName: string | null = null
  let serviceDescription: string | null = null
  let serviceFee: number | null = null
  let serviceDuration: string | null = null
  let serviceCategoryName: string | null = null

  if (data.service_id) {
    const { data: service } = await supabase
      .schema('dentist')
      .from('services_tbl')
      .select(`
        service_name,
        service_description,
        service_fee,
        service_duration,
        service_category_id
      `)
      .eq('service_id', data.service_id)
      .single()

    if (service) {
      serviceName = service.service_name
      serviceDescription = service.service_description
      serviceFee = service.service_fee
      serviceDuration = service.service_duration

      // Fetch category name if available
      if (service.service_category_id) {
        const { data: category } = await supabase
          .schema('dentist')
          .from('service_category_tbl')
          .select('category_name')
          .eq('service_category_id', service.service_category_id)
          .single()
        if (category) serviceCategoryName = category.category_name
      }
    }
  }

  // Fetch original appointment info if exists
  let originalAppointmentDate: string | null = null
  let originalAppointmentTime: string | null = null
  let originalAppointmentService: string | null = null
  if (data.appointment_id) {
    const { data: originalAppt } = await frontdesk()
      .from('appointment_tbl')
      .select('appointment_date, appointment_time, service_id')
      .eq('appointment_id', data.appointment_id)
      .single()

    if (originalAppt) {
      originalAppointmentDate = originalAppt.appointment_date
      originalAppointmentTime = originalAppt.appointment_time

      // Get original appointment service name
      if (originalAppt.service_id) {
        const { data: origService } = await supabase
          .schema('dentist')
          .from('services_tbl')
          .select('service_name')
          .eq('service_id', originalAppt.service_id)
          .single()
        if (origService) originalAppointmentService = origService.service_name
      }
    }
  }

  return {
    followup_id: data.followup_id,
    patient_id: data.patient_id,
    appointment_id: data.appointment_id,
    followup_date: data.followup_date,
    followup_time: data.followup_time,
    service_id: data.service_id,
    appointment_status_id: data.appointment_status_id,
    personnel_id: data.personnel_id,
    // Status
    appointment_status_name: status?.appointment_status_name ?? null,
    // Patient info
    patient_first_name: patient?.f_name ?? null,
    patient_last_name: patient?.l_name ?? null,
    patient_middle_name: patient?.m_name ?? null,
    patient_suffix: patient?.suffix ?? null,
    patient_email: patient?.email ?? null,
    patient_contact: patient?.pri_contact_no ?? null,
    patient_secondary_contact: patient?.sec_contact_no ?? null,
    patient_gender: patient?.gender ?? null,
    patient_birthdate: patient?.birthdate ?? null,
    patient_address: fullAddress,
    // Personnel info
    personnel_first_name: personnelFirstName,
    personnel_last_name: personnelLastName,
    // Service info
    service_name: serviceName,
    service_description: serviceDescription,
    service_fee: serviceFee,
    service_duration: serviceDuration,
    service_category_name: serviceCategoryName,
    // Original appointment info
    original_appointment_date: originalAppointmentDate,
    original_appointment_time: originalAppointmentTime,
    original_appointment_service: originalAppointmentService,
  }
}

/**
 * Update followup status
 */
export async function updateFollowupStatus(followupId: number, statusId: number): Promise<void> {
  const { error } = await frontdesk()
    .from('followup_tbl')
    .update({ appointment_status_id: statusId })
    .eq('followup_id', followupId)

  if (error) {
    throw error
  }
}

/**
 * Update followup status by status name
 */
export async function updateFollowupStatusByName(
  followupId: number,
  statusName: string
): Promise<void> {
  // First, find the status ID
  const { data: statusData, error: statusError } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .ilike('appointment_status_name', statusName)
    .single()

  if (statusError || !statusData) {
    throw new Error(`Status "${statusName}" not found`)
  }

  // Then update the followup
  const { error } = await frontdesk()
    .from('followup_tbl')
    .update({ appointment_status_id: statusData.appointment_status_id })
    .eq('followup_id', followupId)

  if (error) {
    throw error
  }
}

/**
 * Confirm a followup (set status to Confirmed)
 */
export async function confirmFollowup(followupId: number): Promise<void> {
  return updateFollowupStatusByName(followupId, 'Confirmed')
}

/**
 * Cancel a followup (set status to Cancelled)
 */
export async function cancelFollowup(followupId: number): Promise<void> {
  return updateFollowupStatusByName(followupId, 'Cancelled')
}

/**
 * Complete a followup (set status to Completed)
 */
export async function completeFollowup(followupId: number): Promise<void> {
  return updateFollowupStatusByName(followupId, 'Completed')
}

/**
 * Set followup to pending
 */
export async function setPendingFollowup(followupId: number): Promise<void> {
  return updateFollowupStatusByName(followupId, 'Pending')
}

// ============================================
// CANCEL REQUESTS API FUNCTIONS
// ============================================

// Status ID constants (based on appointment_status_tbl)
const CANCELLED_STATUS_ID = 5

/**
 * Fetch all cancelled appointments (cancel requests) that don't have a refund yet
 */
export async function fetchCancelledAppointments(): Promise<AppointmentTableRow[]> {
  console.log('fetchCancelledAppointments: Starting...')
  
  // First, get all cancelled appointments
  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)
    .eq('appointment_status_id', CANCELLED_STATUS_ID)
    .order('appointment_date', { ascending: false })

  console.log('fetchCancelledAppointments: Cancelled appointments', { data, error })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get all refunds to filter out already processed cancellations
  const { data: refunds, error: refundError } = await frontdesk()
    .from('refund_tbl')
    .select('appointment_id')

  console.log('fetchCancelledAppointments: Refunds', { refunds, refundError })

  const refundedAppointmentIds = new Set(refunds?.map(r => r.appointment_id) || [])
  console.log('fetchCancelledAppointments: Refunded IDs', Array.from(refundedAppointmentIds))

  // Filter out appointments that already have a refund
  const pendingCancelRequests = data.filter(apt => !refundedAppointmentIds.has(apt.appointment_id))
  console.log('fetchCancelledAppointments: Pending requests after filter', pendingCancelRequests.length)

  if (pendingCancelRequests.length === 0) {
    return []
  }

  // Fetch related data for each appointment
  const appointmentsWithDetails = await Promise.all(
    pendingCancelRequests.map(async (apt) => {
      // Fetch patient name
      let patientName = `Patient #${apt.patient_id}`
      const { data: patient } = await supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('f_name, l_name')
        .eq('patient_id', apt.patient_id)
        .single()
      if (patient) patientName = `${patient.f_name} ${patient.l_name}`

      // Fetch personnel name
      let personnelName = 'Unassigned'
      if (apt.personnel_id) {
        const { data: personnel } = await supabase
          .from('personnel_tbl')
          .select('f_name, l_name')
          .eq('personnel_id', apt.personnel_id)
          .single()
        if (personnel) personnelName = `Dr. ${personnel.f_name} ${personnel.l_name}`
      }

      return {
        id: String(apt.appointment_id),
        patientName,
        doctorAssigned: personnelName,
        status: 'Cancelled',
        appointmentDate: apt.appointment_date
          ? `${apt.appointment_date}${apt.appointment_time ? ' ' + apt.appointment_time : ''}`
          : 'No date',
        appointmentTime: apt.appointment_time,
        serviceId: apt.service_id,
      }
    })
  )

  return appointmentsWithDetails
}

/**
 * Approve a cancellation request - inserts into refund_tbl for processing
 */
export async function approveCancellation(appointmentId: number, notes?: string): Promise<void> {
  console.log('approveCancellation: Starting for appointment', appointmentId)
  
  // First, get the appointment details to get reservation_fee
  const { data: appointment, error: aptError } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_id, reservation_fee, patient_id')
    .eq('appointment_id', appointmentId)
    .single()

  console.log('approveCancellation: Appointment data', { appointment, aptError })

  if (aptError || !appointment) {
    console.error('approveCancellation: Failed to fetch appointment', aptError)
    throw new Error('Failed to fetch appointment details')
  }

  // Check if a refund already exists for this appointment
  const { data: existingRefund, error: existingError } = await frontdesk()
    .from('refund_tbl')
    .select('refund_id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  console.log('approveCancellation: Existing refund check', { existingRefund, existingError })

  if (existingRefund) {
    // Refund already exists, no need to create another
    console.log('approveCancellation: Refund already exists for this appointment')
    return
  }

  // Get the reservation_fee_id if it exists
  const { data: reservationFee } = await frontdesk()
    .from('reservation_fee_tbl')
    .select('reservation_fee_id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  console.log('approveCancellation: Reservation fee', reservationFee)

  // Insert into refund_tbl - note: reason and refund_status may be enums
  const insertData = {
    appointment_id: appointmentId,
    reservation_fee_id: reservationFee?.reservation_fee_id || null,
    notes: notes || 'Cancellation approved by receptionist',
    refund_amount: appointment.reservation_fee || 300,
  }
  
  console.log('approveCancellation: Inserting refund', insertData)

  const { data: insertedRefund, error: refundError } = await frontdesk()
    .from('refund_tbl')
    .insert(insertData)
    .select()

  console.log('approveCancellation: Insert result', { insertedRefund, refundError })

  if (refundError) {
    console.error('approveCancellation: Error creating refund:', refundError)
    throw new Error(`Failed to create refund record: ${refundError.message}`)
  }
  
  console.log('approveCancellation: Success!')
}

/**
 * Reject a cancellation request (restore to previous status, e.g., Confirmed)
 */
export async function rejectCancellation(appointmentId: number): Promise<void> {
  // Restore the appointment to Confirmed status
  return updateAppointmentStatusByName(appointmentId, 'Confirmed')
}

// ============================================
// PERSONNEL (DOCTORS) API FUNCTIONS
// ============================================

export interface Personnel {
  personnel_id: number
  f_name: string
  l_name: string
  role?: string
}

/**
 * Fetch all dentist personnel for assignment dropdown
 * Only returns personnel with the 'dentist' role
 */
export async function fetchAllPersonnel(): Promise<Personnel[]> {
  // First, get the dentist role ID
  const { data: roleData, error: roleError } = await supabase
    .from('role_tbl')
    .select('role_id')
    .ilike('role_name', 'dentist')
    .single()

  if (roleError || !roleData) {
    console.error('Failed to fetch dentist role:', roleError)
    // Fall back to returning all personnel if role lookup fails
    const { data, error } = await supabase
      .from('personnel_tbl')
      .select('personnel_id, f_name, l_name')
      .order('l_name', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  // Fetch personnel with dentist role
  const { data, error } = await supabase
    .from('personnel_tbl')
    .select('personnel_id, f_name, l_name')
    .eq('role_id', roleData.role_id)
    .order('l_name', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

// ============================================
// FOLLOWUP CREATION API
// ============================================

export interface CreateFollowupInput {
  patient_id: number
  appointment_id?: number
  followup_date: string
  followup_time?: string
  service_id?: number
  personnel_id?: number
  notes?: string
}

/**
 * Create a new followup appointment
 */
export async function createFollowup(input: CreateFollowupInput): Promise<number> {
  // Get the 'Pending' status ID
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .eq('appointment_status_name', 'Pending')
    .single()

  const pendingStatusId = statusData?.appointment_status_id ?? 1

  const { data, error } = await frontdesk()
    .from('followup_tbl')
    .insert({
      patient_id: input.patient_id,
      appointment_id: input.appointment_id ?? null,
      followup_date: input.followup_date,
      followup_time: input.followup_time ?? null,
      service_id: input.service_id ?? null,
      personnel_id: input.personnel_id ?? null,
      appointment_status_id: pendingStatusId,
    })
    .select('followup_id')
    .single()

  if (error) {
    throw error
  }

  return data?.followup_id ?? 0
}

// ============================================
// ADMIN APPOINTMENTS API FUNCTIONS
// ============================================

// Admin appointment status IDs - ensure these match your appointment_status_tbl
const ADMIN_STATUS = {
  PENDING: 1,      // Pending
  CONFIRMED: 2,    // Confirmed/Approved
  COMPLETED: 3,    // Completed
  CANCELLED: 5,    // Cancelled
  RESCHEDULED: 6,  // Rescheduled (if exists, otherwise check your schema)
}

/**
 * Helper to fetch patient name
 */
async function getPatientName(patientId: number): Promise<string> {
  const { data: patient } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('f_name, l_name')
    .eq('patient_id', patientId)
    .single()
  return patient ? `${patient.f_name} ${patient.l_name}` : `Patient #${patientId}`
}

/**
 * Helper to fetch personnel/dentist name
 */
async function getPersonnelName(personnelId: number | null): Promise<string> {
  if (!personnelId) return 'Unassigned'
  const { data: personnel } = await supabase
    .from('personnel_tbl')
    .select('f_name, l_name')
    .eq('personnel_id', personnelId)
    .single()
  return personnel ? `Dr. ${personnel.f_name} ${personnel.l_name}` : 'Unassigned'
}

/**
 * Helper to fetch service name
 */
async function getServiceName(serviceId: number | null): Promise<string> {
  if (!serviceId) return 'No service'
  const { data: service } = await supabase
    .schema('dentist')
    .from('services_tbl')
    .select('service_name')
    .eq('service_id', serviceId)
    .single()
  return service?.service_name ?? 'Unknown Service'
}

/**
 * Fetch admin appointment statistics
 */
export async function fetchAdminAppointmentStats(): Promise<AdminAppointmentStats> {
  // The database stores timestamps in UTC (via now() function)
  // We need to query using UTC dates to match
  const todayUTC = getTodayDateUTC()
  const todayStartUTC = `${todayUTC} 00:00:00`
  const todayEndUTC = `${todayUTC} 23:59:59`

  // Fetch all appointment statuses to get IDs
  const { data: statuses } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id, appointment_status_name')

  const statusMap = new Map<string, number>()
  statuses?.forEach(s => {
    statusMap.set(s.appointment_status_name.toLowerCase(), s.appointment_status_id)
  })

  const pendingId = statusMap.get('pending') ?? ADMIN_STATUS.PENDING
  const confirmedId = statusMap.get('confirmed') ?? ADMIN_STATUS.CONFIRMED
  const cancelledId = statusMap.get('cancelled') ?? ADMIN_STATUS.CANCELLED

  // Count pending requests (appointments with Pending status)
  const { count: pendingRequests } = await frontdesk()
    .from('appointment_tbl')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_status_id', pendingId)

  // Count approved today (confirmed appointments where updated_at is today in UTC)
  // This requires the updated_at column to be added to the table
  const { count: approvedToday } = await frontdesk()
    .from('appointment_tbl')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_status_id', confirmedId)
    .gte('updated_at', todayStartUTC)
    .lte('updated_at', todayEndUTC)

  // Count rescheduled (we'll check for appointments with rescheduled status or notes containing reschedule)
  // Since there might not be a dedicated "rescheduled" status, we can track this differently
  // For now, we'll look for any rescheduled status or assume it's tracked via a flag/log
  const rescheduledId = statusMap.get('rescheduled')
  let rescheduledCount = 0
  if (rescheduledId) {
    const { count } = await frontdesk()
      .from('appointment_tbl')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_status_id', rescheduledId)
    rescheduledCount = count ?? 0
  }

  // Count cancelled
  const { count: cancelledCount } = await frontdesk()
    .from('appointment_tbl')
    .select('*', { count: 'exact', head: true })
    .eq('appointment_status_id', cancelledId)

  return {
    pendingRequests: pendingRequests ?? 0,
    approvedToday: approvedToday ?? 0,
    rescheduledCount: rescheduledCount,
    cancelledCount: cancelledCount ?? 0,
  }
}

/**
 * Fetch pending appointments for admin review
 */
export async function fetchAdminPendingAppointments(): Promise<AdminPendingAppointment[]> {
  // Get pending status ID
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .eq('appointment_status_name', 'Pending')
    .single()

  const pendingId = statusData?.appointment_status_id ?? ADMIN_STATUS.PENDING

  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      reservation_fee,
      payment_receipt_url,
      notes,
      reference_number,
      created_at
    `)
    .eq('appointment_status_id', pendingId)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) return []

  // Fetch related data for each appointment
  const appointmentsWithDetails = await Promise.all(
    data.map(async (apt) => {
      const patientName = await getPatientName(apt.patient_id)
      const dentistName = await getPersonnelName(apt.personnel_id)
      const serviceName = await getServiceName(apt.service_id)

      // Determine appointment type (new, followup, or reschedule request)
      // Check if there's a related followup or previous appointment
      let appointmentType: 'new' | 'followup' | 'reschedule' = 'new'

      // Check if this appointment was created from a followup
      const { data: followupData } = await frontdesk()
        .from('followup_tbl')
        .select('followup_id')
        .eq('appointment_id', apt.appointment_id)
        .limit(1)

      if (followupData && followupData.length > 0) {
        appointmentType = 'followup'
      }

      // Check notes for reschedule indication
      if (apt.notes?.toLowerCase().includes('reschedule')) {
        appointmentType = 'reschedule'
      }

      return {
        id: apt.appointment_id,
        patient: patientName,
        patientId: apt.patient_id,
        service: serviceName,
        serviceId: apt.service_id,
        date: apt.appointment_date ?? '',
        time: apt.appointment_time,
        dentist: dentistName,
        dentistId: apt.personnel_id,
        type: appointmentType,
        status: 'pending',
        reservationFee: apt.reservation_fee,
        paymentReceiptUrl: apt.payment_receipt_url,
        notes: apt.notes,
        referenceNumber: apt.reference_number,
        createdAt: apt.created_at,
      }
    })
  )

  return appointmentsWithDetails
}

/**
 * Fetch completed appointments for admin view
 */
export async function fetchAdminCompletedAppointments(): Promise<AdminCompletedAppointment[]> {
  // Get completed status ID
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .eq('appointment_status_name', 'Completed')
    .single()

  const completedId = statusData?.appointment_status_id ?? ADMIN_STATUS.COMPLETED

  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      created_at
    `)
    .eq('appointment_status_id', completedId)
    .order('appointment_date', { ascending: false })
    .limit(50) // Limit to recent 50

  if (error) {
    throw error
  }

  if (!data || data.length === 0) return []

  const appointmentsWithDetails = await Promise.all(
    data.map(async (apt) => {
      const patientName = await getPatientName(apt.patient_id)
      const dentistName = await getPersonnelName(apt.personnel_id)
      const serviceName = await getServiceName(apt.service_id)

      return {
        id: apt.appointment_id,
        patient: patientName,
        patientId: apt.patient_id,
        service: serviceName,
        serviceId: apt.service_id,
        date: apt.appointment_date ?? '',
        time: apt.appointment_time,
        dentist: dentistName,
        dentistId: apt.personnel_id,
        status: 'completed',
        completedAt: apt.created_at, // Using created_at as proxy; ideally track completion timestamp
      }
    })
  )

  return appointmentsWithDetails
}

/**
 * Fetch rescheduled appointments for admin view
 * Note: This requires tracking original date - might need a separate table or notes field
 */
export async function fetchAdminRescheduledAppointments(): Promise<AdminRescheduledAppointment[]> {
  // Check if there's a rescheduled status
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .ilike('appointment_status_name', '%reschedule%')
    .limit(1)

  // If no rescheduled status exists, try to find appointments with reschedule in notes
  let query = frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      notes,
      created_at
    `)

  if (statusData && statusData.length > 0) {
    query = query.eq('appointment_status_id', statusData[0].appointment_status_id)
  } else {
    // Fallback: look for notes containing "reschedule"
    query = query.ilike('notes', '%reschedule%')
  }

  const { data, error } = await query
    .order('appointment_date', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) return []

  const appointmentsWithDetails = await Promise.all(
    data.map(async (apt) => {
      const patientName = await getPatientName(apt.patient_id)
      const dentistName = await getPersonnelName(apt.personnel_id)
      const serviceName = await getServiceName(apt.service_id)

      // Try to extract original date from notes or use null
      let originalDate: string | null = null
      if (apt.notes) {
        // Try to parse original date from notes (e.g., "Rescheduled from 2025-01-15")
        const dateMatch = apt.notes.match(/from\s*(\d{4}-\d{2}-\d{2})/i)
        if (dateMatch) {
          originalDate = dateMatch[1]
        }
      }

      return {
        id: apt.appointment_id,
        patient: patientName,
        patientId: apt.patient_id,
        service: serviceName,
        serviceId: apt.service_id,
        originalDate: originalDate,
        newDate: apt.appointment_date ?? '',
        newTime: apt.appointment_time,
        dentist: dentistName,
        dentistId: apt.personnel_id,
        reason: apt.notes,
      }
    })
  )

  return appointmentsWithDetails
}

/**
 * Fetch cancelled appointments for admin view
 */
export async function fetchAdminCancelledAppointments(): Promise<AdminCancelledAppointment[]> {
  const { data, error } = await frontdesk()
    .from('appointment_tbl')
    .select(`
      appointment_id,
      patient_id,
      service_id,
      appointment_time,
      appointment_date,
      appointment_status_id,
      personnel_id,
      notes,
      created_at
    `)
    .eq('appointment_status_id', CANCELLED_STATUS_ID)
    .order('appointment_date', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) return []

  const appointmentsWithDetails = await Promise.all(
    data.map(async (apt) => {
      const patientName = await getPatientName(apt.patient_id)
      const dentistName = await getPersonnelName(apt.personnel_id)
      const serviceName = await getServiceName(apt.service_id)

      // Determine who cancelled (from notes or default to System)
      let cancelledBy = 'System'
      if (apt.notes?.toLowerCase().includes('patient')) {
        cancelledBy = 'Patient'
      } else if (apt.notes?.toLowerCase().includes('admin')) {
        cancelledBy = 'Admin'
      } else if (apt.notes?.toLowerCase().includes('dentist') || apt.notes?.toLowerCase().includes('doctor')) {
        cancelledBy = 'Dentist'
      }

      return {
        id: apt.appointment_id,
        patient: patientName,
        patientId: apt.patient_id,
        service: serviceName,
        serviceId: apt.service_id,
        date: apt.appointment_date ?? '',
        dentist: dentistName,
        dentistId: apt.personnel_id,
        reason: apt.notes,
        cancelledBy: cancelledBy,
        cancelledAt: apt.created_at,
      }
    })
  )

  return appointmentsWithDetails
}

/**
 * Approve a pending appointment (set status to Confirmed with status_id = 2)
 */
export async function approveAppointment(appointmentId: number): Promise<void> {
  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update({ 
      appointment_status_id: 2,
      updated_at: getLocalTimestamp() // Track when approval happened (local timezone)
    })
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Decline a pending appointment (set status to Cancelled with reason)
 */
export async function declineAppointment(appointmentId: number, reason?: string): Promise<void> {
  // Update status to Cancelled
  const { data: statusData } = await frontdesk()
    .from('appointment_status_tbl')
    .select('appointment_status_id')
    .eq('appointment_status_name', 'Cancelled')
    .single()

  const cancelledId = statusData?.appointment_status_id ?? CANCELLED_STATUS_ID

  const updateData: { appointment_status_id: number; notes?: string; updated_at: string } = {
    appointment_status_id: cancelledId,
    updated_at: getLocalTimestamp(),
  }

  if (reason) {
    // Append decline reason to notes
    const { data: currentApt } = await frontdesk()
      .from('appointment_tbl')
      .select('notes')
      .eq('appointment_id', appointmentId)
      .single()

    const existingNotes = currentApt?.notes ?? ''
    updateData.notes = existingNotes
      ? `${existingNotes}\nDeclined by Admin: ${reason}`
      : `Declined by Admin: ${reason}`
  }

  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update(updateData)
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

/**
 * Reschedule an appointment with tracking (sets status_id = 7 for Rescheduled)
 */
export async function rescheduleAppointmentAdmin(
  appointmentId: number,
  newDate: string,
  newTime: string | null,
  reason?: string
): Promise<void> {
  // Get current appointment date for tracking
  const { data: currentApt } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_date, appointment_time, notes')
    .eq('appointment_id', appointmentId)
    .single()

  const existingNotes = currentApt?.notes ?? ''
  const originalDate = currentApt?.appointment_date ?? 'unknown'
  const rescheduleNote = `Rescheduled from ${originalDate}${reason ? `: ${reason}` : ''}`
  const newNotes = existingNotes
    ? `${existingNotes}\n${rescheduleNote}`
    : rescheduleNote

  const updateData: {
    appointment_date: string
    appointment_time?: string | null
    notes: string
    appointment_status_id: number
    updated_at: string
  } = {
    appointment_date: newDate,
    notes: newNotes,
    appointment_status_id: 7, // Rescheduled status
    updated_at: getLocalTimestamp(),
  }

  if (newTime !== undefined) {
    updateData.appointment_time = newTime
  }

  const { error } = await frontdesk()
    .from('appointment_tbl')
    .update(updateData)
    .eq('appointment_id', appointmentId)

  if (error) {
    throw error
  }
}

