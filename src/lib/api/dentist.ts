import supabase from '@/utils/supabase'
import type {
  DentistInfo,
  DentistPatient,
  DentistTreatmentLog,
  DentistPrescription,
  DentistFollowUp,
  DentistManagementStats,
} from '@/types/dentist'

// Helper to access dentist schema
const dentist = () => supabase.schema('dentist')

// Helper to access frontdesk schema
const frontdesk = () => supabase.schema('frontdesk')

// Status IDs
const COMPLETED_STATUS_ID = 4

// ============================================
// DENTIST MANAGEMENT API FUNCTIONS
// ============================================

/**
 * Fetch dentist management stats
 */
export async function fetchDentistManagementStats(): Promise<DentistManagementStats> {
  try {
    // First, get the "Scheduled" status ID dynamically
    const { data: scheduledStatus } = await frontdesk()
      .from('appointment_status_tbl')
      .select('appointment_status_id')
      .ilike('appointment_status_name', 'Scheduled')
      .single()

    const scheduledStatusId = scheduledStatus?.appointment_status_id ?? null

    // Run all queries in parallel for better performance
    const [
      dentistCountResult,
      completedTreatmentsResult,
      completedAppointmentsResult,
      pendingTreatmentsResult
    ] = await Promise.all([
      // Count total dentists from dentist_info_tbl
      dentist()
        .from('dentist_info_tbl')
        .select('*', { count: 'exact', head: true }),
      
      // Count total completed appointments (treatments)
      frontdesk()
        .from('appointment_tbl')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_status_id', COMPLETED_STATUS_ID),
      
      // Get patient_ids from completed appointments for unique count
      frontdesk()
        .from('appointment_tbl')
        .select('patient_id')
        .eq('appointment_status_id', COMPLETED_STATUS_ID),
      
      // Count pending treatments (appointments with "Scheduled" status)
      scheduledStatusId
        ? frontdesk()
            .from('appointment_tbl')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_status_id', scheduledStatusId)
        : Promise.resolve({ count: 0, error: null, data: null, status: 200, statusText: 'OK' })
    ])

    // Log errors if any
    if (dentistCountResult.error) {
      console.error('Error fetching total dentists:', dentistCountResult.error)
    }
    if (completedTreatmentsResult.error) {
      console.error('Error fetching total treatments:', completedTreatmentsResult.error)
    }
    if (completedAppointmentsResult.error) {
      console.error('Error fetching patients served:', completedAppointmentsResult.error)
    }
    if (pendingTreatmentsResult.error) {
      console.error('Error fetching pending treatments:', pendingTreatmentsResult.error)
    }

    // Calculate unique patients from completed appointments
    const uniquePatients = new Set(
      completedAppointmentsResult.data?.map(a => a.patient_id) ?? []
    )

    const stats = {
      totalDentists: dentistCountResult.count ?? 0,
      totalTreatments: completedTreatmentsResult.count ?? 0,
      patientsServed: uniquePatients.size,
      pendingTreatments: pendingTreatmentsResult.count ?? 0,
    }

    console.log('Dentist Management Stats:', stats)

    return stats
  } catch (error) {
    console.error('Error in fetchDentistManagementStats:', error)
    return {
      totalDentists: 0,
      totalTreatments: 0,
      patientsServed: 0,
      pendingTreatments: 0,
    }
  }
}

/**
 * Fetch all dentists with their details
 */
export async function fetchAllDentists(): Promise<DentistInfo[]> {
  // Get dentist info with personnel data
  const { data: dentistInfos, error } = await dentist()
    .from('dentist_info_tbl')
    .select(`
      dentist_info_id,
      personnel_id,
      license_number,
      service_category_id
    `)

  if (error) {
    console.error('Error fetching dentist info:', error)
    throw error
  }

  console.log('Fetched dentist infos:', dentistInfos)

  if (!dentistInfos || dentistInfos.length === 0) {
    return []
  }

  // Get personnel details from public schema (dentist_info_tbl has FK to personnel_tbl)
  const personnelIds = dentistInfos.map(d => d.personnel_id)
  const { data: personnelData, error: personnelError } = await supabase
    .from('personnel_tbl')
    .select(`
      personnel_id,
      employee_no,
      f_name,
      l_name,
      m_name,
      suffix,
      birthdate,
      gender,
      house_no,
      street,
      barangay,
      city,
      country,
      contact_no,
      email,
      account_status,
      role_id,
      created_at
    `)
    .in('personnel_id', personnelIds)

  if (personnelError) {
    console.error('Error fetching personnel data:', personnelError)
  }

  console.log('Fetched personnel data:', personnelData)

  const personnelMap = new Map(
    personnelData?.map(p => [p.personnel_id, p]) ?? []
  )

  // Get service categories (specializations)
  const categoryIds = dentistInfos
    .filter(d => d.service_category_id)
    .map(d => d.service_category_id)
  
  const { data: categories } = await dentist()
    .from('service_category_tbl')
    .select('service_category_id, category_name')
    .in('service_category_id', categoryIds)

  const categoryMap = new Map(
    categories?.map(c => [c.service_category_id, c.category_name]) ?? []
  )

  // Get services for each category
  const { data: allServices } = await dentist()
    .from('services_tbl')
    .select('service_id, service_category_id, service_name')
    .in('service_category_id', categoryIds)

  const servicesByCategory = new Map<number, string[]>()
  allServices?.forEach(s => {
    if (!servicesByCategory.has(s.service_category_id)) {
      servicesByCategory.set(s.service_category_id, [])
    }
    servicesByCategory.get(s.service_category_id)!.push(s.service_name)
  })

  // Get schedules for each dentist
  const { data: schedules } = await dentist()
    .from('dentist_schedule_tbl')
    .select('personnel_id, day_of_week, time_in, time_out')
    .in('personnel_id', personnelIds)

  const schedulesByPersonnel = new Map<number, Array<{ day: string; time: string }>>()
  schedules?.forEach(s => {
    if (!schedulesByPersonnel.has(s.personnel_id)) {
      schedulesByPersonnel.set(s.personnel_id, [])
    }
    if (s.day_of_week && s.time_in && s.time_out) {
      schedulesByPersonnel.get(s.personnel_id)!.push({
        day: s.day_of_week,
        time: `${s.time_in} - ${s.time_out}`,
      })
    }
  })

  // Get completed appointments count per dentist
  const { data: appointmentCounts } = await frontdesk()
    .from('appointment_tbl')
    .select('personnel_id, patient_id')
    .eq('appointment_status_id', COMPLETED_STATUS_ID)
    .in('personnel_id', personnelIds)

  const treatmentCountByPersonnel = new Map<number, number>()
  const patientsByPersonnel = new Map<number, Set<number>>()
  
  appointmentCounts?.forEach(a => {
    if (a.personnel_id) {
      treatmentCountByPersonnel.set(
        a.personnel_id, 
        (treatmentCountByPersonnel.get(a.personnel_id) ?? 0) + 1
      )
      if (!patientsByPersonnel.has(a.personnel_id)) {
        patientsByPersonnel.set(a.personnel_id, new Set())
      }
      patientsByPersonnel.get(a.personnel_id)!.add(a.patient_id)
    }
  })

  // Build dentist info array
  return dentistInfos.map(d => {
    const personnel = personnelMap.get(d.personnel_id)
    const specialization = d.service_category_id 
      ? categoryMap.get(d.service_category_id) ?? null 
      : null
    const services = d.service_category_id 
      ? servicesByCategory.get(d.service_category_id) ?? [] 
      : []
    const schedule = schedulesByPersonnel.get(d.personnel_id) ?? []
    const totalTreatments = treatmentCountByPersonnel.get(d.personnel_id) ?? 0
    const totalPatients = patientsByPersonnel.get(d.personnel_id)?.size ?? 0

    // Determine status based on personnel account_status or default to active
    let status: 'active' | 'on-leave' | 'inactive' = 'active'
    if (personnel?.account_status) {
      const personnelStatus = String(personnel.account_status).toLowerCase()
      if (personnelStatus === 'on-leave' || personnelStatus === 'on_leave') {
        status = 'on-leave'
      } else if (personnelStatus === 'inactive') {
        status = 'inactive'
      }
    }

    return {
      id: `DEN-${String(d.dentist_info_id).padStart(3, '0')}`,
      personnelId: d.personnel_id,
      dentistInfoId: d.dentist_info_id,
      employeeNo: personnel?.employee_no ?? null,
      name: personnel ? `Dr. ${personnel.f_name} ${personnel.l_name}` : `Dentist #${d.personnel_id}`,
      firstName: personnel?.f_name ?? '',
      lastName: personnel?.l_name ?? '',
      middleName: personnel?.m_name ?? null,
      suffix: personnel?.suffix ?? null,
      email: personnel?.email ?? null,
      phone: personnel?.contact_no ?? null,
      birthdate: personnel?.birthdate ?? null,
      gender: personnel?.gender ?? null,
      address: {
        houseNo: personnel?.house_no ?? null,
        street: personnel?.street ?? null,
        barangay: personnel?.barangay ?? null,
        city: personnel?.city ?? null,
        country: personnel?.country ?? null,
      },
      licenseNumber: d.license_number,
      specialization,
      specializationId: d.service_category_id,
      services,
      status,
      schedule,
      totalPatients,
      totalTreatments,
      joinedDate: personnel?.created_at ?? null,
    }
  })
}

/**
 * Get patients assigned/treated by a specific dentist
 */
export async function fetchDentistPatients(personnelId: number): Promise<DentistPatient[]> {
  // Get all appointments for this dentist
  const { data: appointments, error } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_id, patient_id, appointment_date, appointment_status_id')
    .eq('personnel_id', personnelId)
    .order('appointment_date', { ascending: false })

  if (error) {
    throw error
  }

  if (!appointments || appointments.length === 0) {
    return []
  }

  // Group by patient and get their last visit and next appointment
  const patientIds = [...new Set(appointments.map(a => a.patient_id))]
  
  // Get patient names
  const { data: patients } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('patient_id, f_name, l_name')
    .in('patient_id', patientIds)

  const patientMap = new Map(
    patients?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []
  )

  // Build patient list with visit info
  const patientVisits = new Map<number, {
    lastVisit: string | null
    nextAppointment: string | null
    hasCompleted: boolean
    hasPending: boolean
  }>()

  const today = new Date().toISOString().split('T')[0]

  appointments.forEach(apt => {
    if (!patientVisits.has(apt.patient_id)) {
      patientVisits.set(apt.patient_id, {
        lastVisit: null,
        nextAppointment: null,
        hasCompleted: false,
        hasPending: false,
      })
    }
    
    const visit = patientVisits.get(apt.patient_id)!
    
    // Completed appointments (status = 3)
    if (apt.appointment_status_id === COMPLETED_STATUS_ID) {
      visit.hasCompleted = true
      if (apt.appointment_date && (!visit.lastVisit || apt.appointment_date > visit.lastVisit)) {
        visit.lastVisit = apt.appointment_date
      }
    }
    
    // Future appointments (pending/confirmed)
    if (apt.appointment_date && apt.appointment_date >= today && 
        (apt.appointment_status_id === 1 || apt.appointment_status_id === 2)) {
      visit.hasPending = true
      if (!visit.nextAppointment || apt.appointment_date < visit.nextAppointment) {
        visit.nextAppointment = apt.appointment_date
      }
    }
  })

  return patientIds.map((patientId, idx) => {
    const visit = patientVisits.get(patientId)!
    let status: 'active' | 'completed' | 'inactive' = 'inactive'
    
    if (visit.hasPending) {
      status = 'active'
    } else if (visit.hasCompleted) {
      status = 'completed'
    }

    return {
      id: idx + 1,
      dentistId: personnelId,
      patientName: patientMap.get(patientId) ?? `Patient #${patientId}`,
      patientId,
      lastVisit: visit.lastVisit,
      nextAppointment: visit.nextAppointment,
      status,
    }
  })
}

/**
 * Get treatment logs for a specific dentist
 */
export async function fetchDentistTreatmentLogs(personnelId: number): Promise<DentistTreatmentLog[]> {
  // Get completed and in-progress appointments
  const { data: appointments, error } = await frontdesk()
    .from('appointment_tbl')
    .select('appointment_id, patient_id, service_id, appointment_date, appointment_status_id, notes')
    .eq('personnel_id', personnelId)
    .in('appointment_status_id', [1, 2, 3]) // Pending, Confirmed, Completed
    .order('appointment_date', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  if (!appointments || appointments.length === 0) {
    return []
  }

  // Get patient names
  const patientIds = [...new Set(appointments.map(a => a.patient_id))]
  const { data: patients } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('patient_id, f_name, l_name')
    .in('patient_id', patientIds)

  const patientMap = new Map(
    patients?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []
  )

  // Get service names and fees
  const serviceIds = [...new Set(appointments.filter(a => a.service_id).map(a => a.service_id))]
  const { data: services } = await dentist()
    .from('services_tbl')
    .select('service_id, service_name, service_fee')
    .in('service_id', serviceIds)

  const serviceMap = new Map(
    services?.map(s => [s.service_id, { name: s.service_name, fee: s.service_fee }]) ?? []
  )

  return appointments.map((apt, idx) => {
    const service = apt.service_id ? serviceMap.get(apt.service_id) : null
    let status: 'completed' | 'in-progress' | 'pending' = 'pending'
    
    if (apt.appointment_status_id === COMPLETED_STATUS_ID) {
      status = 'completed'
    } else if (apt.appointment_status_id === 2) {
      status = 'in-progress'
    }

    return {
      id: idx + 1,
      dentistId: personnelId,
      patientName: patientMap.get(apt.patient_id) ?? `Patient #${apt.patient_id}`,
      patientId: apt.patient_id,
      service: service?.name ?? 'Unknown Service',
      serviceId: apt.service_id,
      date: apt.appointment_date ?? '',
      notes: apt.notes,
      status,
      cost: service?.fee ?? null,
    }
  })
}

/**
 * Get prescriptions issued by a specific dentist
 */
export async function fetchDentistPrescriptions(personnelId: number): Promise<DentistPrescription[]> {
  // Get prescriptions with medicine info
  const { data: prescriptions, error } = await dentist()
    .from('prescription_tbl')
    .select(`
      prescription_id,
      medicine_id,
      instructions,
      dosage,
      frequency,
      duration,
      created_at
    `)
    .eq('personnel_id', personnelId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  if (!prescriptions || prescriptions.length === 0) {
    return []
  }

  // Get medicine names from inventory schema
  const medicineIds = [...new Set(prescriptions.map(p => p.medicine_id))]
  const { data: medicines } = await supabase
    .schema('inventory')
    .from('medicine_tbl')
    .select('medicine_id, medicine_name')
    .in('medicine_id', medicineIds)

  const medicineMap = new Map(
    medicines?.map(m => [m.medicine_id, m.medicine_name]) ?? []
  )

  // For now, we don't have direct patient link in prescription_tbl
  // This would need to be joined through treatment_result_tbl -> treatment_plan_tbl
  // Simplified version:
  return prescriptions.map((p, idx) => ({
    id: idx + 1,
    dentistId: personnelId,
    patientName: 'Patient', // Would need proper join
    patientId: 0,
    medication: medicineMap.get(p.medicine_id) ?? `Medicine #${p.medicine_id}`,
    dosage: p.dosage,
    frequency: p.frequency,
    duration: p.duration,
    date: p.created_at ?? '',
    reason: p.instructions,
  }))
}

/**
 * Get follow-up recommendations for a specific dentist
 */
export async function fetchDentistFollowUps(personnelId: number): Promise<DentistFollowUp[]> {
  const today = new Date().toISOString().split('T')[0]

  // Get upcoming followups for this dentist
  const { data: followups, error } = await frontdesk()
    .from('followup_tbl')
    .select(`
      followup_id,
      patient_id,
      service_id,
      followup_date,
      appointment_status_id
    `)
    .eq('personnel_id', personnelId)
    .gte('followup_date', today)
    .order('followup_date', { ascending: true })
    .limit(50)

  if (error) {
    throw error
  }

  if (!followups || followups.length === 0) {
    return []
  }

  // Get patient names
  const patientIds = [...new Set(followups.map(f => f.patient_id))]
  const { data: patients } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('patient_id, f_name, l_name')
    .in('patient_id', patientIds)

  const patientMap = new Map(
    patients?.map(p => [p.patient_id, `${p.f_name} ${p.l_name}`]) ?? []
  )

  // Get service names
  const serviceIds = [...new Set(followups.filter(f => f.service_id).map(f => f.service_id))]
  const { data: services } = await dentist()
    .from('services_tbl')
    .select('service_id, service_name')
    .in('service_id', serviceIds)

  const serviceMap = new Map(
    services?.map(s => [s.service_id, s.service_name]) ?? []
  )

  return followups.map((f, idx) => {
    // Determine priority based on how soon the followup is
    const followupDate = new Date(f.followup_date ?? today)
    const daysUntil = Math.ceil((followupDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    let priority: 'high' | 'medium' | 'routine' = 'routine'
    if (daysUntil <= 7) {
      priority = 'high'
    } else if (daysUntil <= 30) {
      priority = 'medium'
    }

    return {
      id: idx + 1,
      dentistId: personnelId,
      patientName: patientMap.get(f.patient_id) ?? `Patient #${f.patient_id}`,
      patientId: f.patient_id,
      service: f.service_id ? (serviceMap.get(f.service_id) ?? 'Follow-up') : 'Follow-up Checkup',
      recommendedDate: f.followup_date ?? '',
      notes: null, // followup_tbl doesn't have notes field
      priority,
    }
  })
}

/**
 * Get all service categories (specializations)
 */
export async function fetchServiceCategories(): Promise<Array<{ id: number; name: string }>> {
  const { data, error } = await dentist()
    .from('service_category_tbl')
    .select('service_category_id, category_name')
    .order('category_name')

  if (error) {
    throw error
  }

  return (data ?? []).map(c => ({
    id: c.service_category_id,
    name: c.category_name,
  }))
}
