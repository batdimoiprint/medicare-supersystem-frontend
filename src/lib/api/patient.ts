import supabase from '@/utils/supabase'
import type {
  PatientRecordsStats,
  PatientInfo,
  PatientTreatmentHistory,
  PatientPrescription,
  PatientFollowUp,
  PatientAllergy,
  PatientHealthProblem,
  PatientEmergencyContact,
} from '@/types/patient'

// Get the first day of current month in YYYY-MM-DD format
const getFirstDayOfMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Status ID for completed appointments
const COMPLETED_STATUS_ID = 4

// ============================================
// PATIENT RECORDS STATS API
// ============================================

/**
 * Fetch patient records statistics
 */
export async function fetchPatientRecordsStats(): Promise<PatientRecordsStats> {
  try {
    const firstDayOfMonth = getFirstDayOfMonth()
    const today = getTodayDate()

    console.log('fetchPatientRecordsStats: Date range:', { firstDayOfMonth, today })
    console.log('fetchPatientRecordsStats: COMPLETED_STATUS_ID:', COMPLETED_STATUS_ID)

    // Run all queries in parallel
    const [
      totalPatientsResult,
      activePatientsResult,
      newThisMonthResult,
      visitsThisMonthResult
    ] = await Promise.all([
      // Count total patients
      supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('*', { count: 'exact', head: true }),
      
      // Count active patients (account_status = 'Active')
      supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'Active'),
      
      // Count new patients this month (registered this month)
      supabase
        .schema('patient_record')
        .from('patient_tbl')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth),
      
      // Count completed appointments this month (visits)
      supabase
        .schema('frontdesk')
        .from('appointment_tbl')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_status_id', COMPLETED_STATUS_ID)
        .gte('appointment_date', firstDayOfMonth)
        .lte('appointment_date', today)
    ])

    // Log errors if any
    if (totalPatientsResult.error) {
      console.error('Error fetching total patients:', totalPatientsResult.error)
    }
    if (activePatientsResult.error) {
      console.error('Error fetching active patients:', activePatientsResult.error)
    }
    if (newThisMonthResult.error) {
      console.error('Error fetching new patients:', newThisMonthResult.error)
    }
    if (visitsThisMonthResult.error) {
      console.error('Error fetching visits:', visitsThisMonthResult.error)
    }
    
    console.log('Visits query result:', { 
      count: visitsThisMonthResult.count, 
      error: visitsThisMonthResult.error,
      data: visitsThisMonthResult.data 
    })

    const stats = {
      totalPatients: totalPatientsResult.count ?? 0,
      activePatients: activePatientsResult.count ?? 0,
      newThisMonth: newThisMonthResult.count ?? 0,
      visitsThisMonth: visitsThisMonthResult.count ?? 0,
    }

    console.log('Patient Records Stats:', stats)

    return stats
  } catch (error) {
    console.error('Error in fetchPatientRecordsStats:', error)
    return {
      totalPatients: 0,
      activePatients: 0,
      newThisMonth: 0,
      visitsThisMonth: 0,
    }
  }
}

// ============================================
// PATIENT LIST API
// ============================================

/**
 * Fetch all patients with their basic info and visit counts
 */
export async function fetchAllPatients(): Promise<PatientInfo[]> {
  console.log('fetchAllPatients: Starting to fetch patients...')
  
  // Fetch patients - simplified query first to debug
  const { data: patients, error: patientsError } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('fetchAllPatients: Query result:', { patients, patientsError })

  if (patientsError) {
    console.error('Error fetching patients:', patientsError)
    console.error('Error code:', patientsError.code)
    console.error('Error message:', patientsError.message)
    console.error('Error details:', patientsError.details)
    console.error('Error hint:', patientsError.hint)
    throw patientsError
  }

  if (!patients || patients.length === 0) {
    console.log('fetchAllPatients: No patients found')
    return []
  }

  console.log('fetchAllPatients: Found', patients.length, 'patients')

  const patientIds = patients.map(p => p.patient_id)

  // Fetch completed appointments count for each patient (total visits)
  const { data: appointments } = await supabase
    .schema('frontdesk')
    .from('appointment_tbl')
    .select('patient_id, appointment_date')
    .eq('appointment_status_id', COMPLETED_STATUS_ID)
    .in('patient_id', patientIds)
    .order('appointment_date', { ascending: false })

  // Group appointments by patient
  const visitCountByPatient = new Map<number, number>()
  const lastVisitByPatient = new Map<number, string>()
  
  appointments?.forEach(apt => {
    // Count visits
    visitCountByPatient.set(
      apt.patient_id,
      (visitCountByPatient.get(apt.patient_id) ?? 0) + 1
    )
    // Track last visit (first occurrence since sorted desc)
    if (!lastVisitByPatient.has(apt.patient_id) && apt.appointment_date) {
      lastVisitByPatient.set(apt.patient_id, apt.appointment_date)
    }
  })

  // Map to PatientInfo array
  return patients.map(p => ({
    id: `PAT-${String(p.patient_id).padStart(3, '0')}`,
    patientId: p.patient_id,
    name: `${p.f_name ?? ''} ${p.l_name ?? ''}`.trim() || `Patient #${p.patient_id}`,
    firstName: p.f_name ?? '',
    lastName: p.l_name ?? '',
    middleName: p.m_name ?? null,
    suffix: p.suffix ?? null,
    email: p.email ?? null,
    phone: p.pri_contact_no ?? null,
    secondaryPhone: p.sec_contact_no ?? null,
    address: p.address ?? null,
    birthDate: p.birthdate ?? null,
    gender: p.gender ?? null,
    bloodType: p.blood_type ?? null,
    accountStatus: p.account_status ?? 'Pending',
    registeredDate: p.created_at ?? null,
    lastVisit: lastVisitByPatient.get(p.patient_id) ?? null,
    totalVisits: visitCountByPatient.get(p.patient_id) ?? 0,
    imageUrl: p.image_url ?? null,
    allergies: [], // Will be fetched when viewing patient details
    healthProblems: [],
    emergencyContact: null,
  }))
}

// ============================================
// PATIENT DETAIL API
// ============================================

/**
 * Fetch a single patient's full details including allergies, health problems, emergency contact
 */
export async function fetchPatientDetails(patientId: number): Promise<PatientInfo | null> {
  // Fetch patient
  const { data: patient, error: patientError } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .select(`
      patient_id,
      f_name,
      l_name,
      m_name,
      suffix,
      email,
      pri_contact_no,
      sec_contact_no,
      address,
      birthdate,
      gender,
      blood_type,
      account_status,
      created_at,
      image_url
    `)
    .eq('patient_id', patientId)
    .single()

  if (patientError || !patient) {
    console.error('Error fetching patient details:', patientError)
    return null
  }

  // Fetch allergies, health problems, emergency contact, and visit data in parallel
  const [allergiesResult, healthProblemsResult, ecResult, visitsResult] = await Promise.all([
    // Fetch patient allergies
    supabase
      .schema('patient_record')
      .from('patient_allergies_tbl')
      .select(`
        allergy_id,
        dentist_allergies:allergy_id (
          allergy_id,
          allergy_name,
          allergy_severity
        )
      `)
      .eq('patient_id', patientId),
    
    // Fetch patient health problems
    supabase
      .schema('patient_record')
      .from('patient_health_problems_tbl')
      .select(`
        health_problem_id,
        dentist_health_problems:health_problem_id (
          health_problem_id,
          health_problem_name,
          health_problem_severity
        )
      `)
      .eq('patient_id', patientId),
    
    // Fetch emergency contact
    supabase
      .schema('patient_record')
      .from('emergency_contact_tbl')
      .select('ec_f_name, ec_l_name, ec_contact_no, ec_relationship, ec_email')
      .eq('patient_id', patientId)
      .single(),
    
    // Fetch visit count and last visit
    supabase
      .schema('frontdesk')
      .from('appointment_tbl')
      .select('appointment_date')
      .eq('patient_id', patientId)
      .eq('appointment_status_id', COMPLETED_STATUS_ID)
      .order('appointment_date', { ascending: false })
  ])

  // Process allergies - handle the join structure
  const allergies: PatientAllergy[] = []
  if (allergiesResult.data) {
    for (const item of allergiesResult.data) {
      // Try direct query if join doesn't work
      const { data: allergyData } = await supabase
        .schema('dentist')
        .from('allergies_tbl')
        .select('allergy_id, allergy_name, allergy_severity')
        .eq('allergy_id', item.allergy_id)
        .single()
      
      if (allergyData) {
        allergies.push({
          allergy_id: allergyData.allergy_id,
          allergy_name: allergyData.allergy_name ?? 'Unknown',
          allergy_severity: allergyData.allergy_severity ?? null,
        })
      }
    }
  }

  // Process health problems
  const healthProblems: PatientHealthProblem[] = []
  if (healthProblemsResult.data) {
    for (const item of healthProblemsResult.data) {
      const { data: hpData } = await supabase
        .schema('dentist')
        .from('health_problems_tbl')
        .select('health_problem_id, health_problem_name, health_problem_severity')
        .eq('health_problem_id', item.health_problem_id)
        .single()
      
      if (hpData) {
        healthProblems.push({
          health_problem_id: hpData.health_problem_id,
          health_problem_name: hpData.health_problem_name ?? 'Unknown',
          health_problem_severity: hpData.health_problem_severity ?? null,
        })
      }
    }
  }

  // Process emergency contact
  let emergencyContact: PatientEmergencyContact | null = null
  if (ecResult.data) {
    emergencyContact = {
      ec_f_name: ecResult.data.ec_f_name,
      ec_l_name: ecResult.data.ec_l_name,
      ec_contact_no: ecResult.data.ec_contact_no,
      ec_relationship: ecResult.data.ec_relationship,
      ec_email: ecResult.data.ec_email ?? null,
    }
  }

  // Process visits
  const totalVisits = visitsResult.data?.length ?? 0
  const lastVisit = visitsResult.data?.[0]?.appointment_date ?? null

  return {
    id: `PAT-${String(patient.patient_id).padStart(3, '0')}`,
    patientId: patient.patient_id,
    name: `${patient.f_name ?? ''} ${patient.l_name ?? ''}`.trim() || `Patient #${patient.patient_id}`,
    firstName: patient.f_name ?? '',
    lastName: patient.l_name ?? '',
    middleName: patient.m_name ?? null,
    suffix: patient.suffix ?? null,
    email: patient.email ?? null,
    phone: patient.pri_contact_no ?? null,
    secondaryPhone: patient.sec_contact_no ?? null,
    address: patient.address ?? null,
    birthDate: patient.birthdate ?? null,
    gender: patient.gender ?? null,
    bloodType: patient.blood_type ?? null,
    accountStatus: patient.account_status ?? 'Pending',
    registeredDate: patient.created_at ?? null,
    lastVisit,
    totalVisits,
    imageUrl: patient.image_url ?? null,
    allergies,
    healthProblems,
    emergencyContact,
  }
}

// ============================================
// PATIENT TREATMENT HISTORY API
// ============================================

/**
 * Fetch treatment history for a patient
 */
export async function fetchPatientTreatments(patientId: number): Promise<PatientTreatmentHistory[]> {
  // Fetch completed appointments as treatments
  const { data: appointments, error } = await supabase
    .schema('frontdesk')
    .from('appointment_tbl')
    .select(`
      appointment_id,
      appointment_date,
      service_id,
      personnel_id,
      notes,
      appointment_status_id
    `)
    .eq('patient_id', patientId)
    .eq('appointment_status_id', COMPLETED_STATUS_ID)
    .order('appointment_date', { ascending: false })

  if (error) {
    console.error('Error fetching patient treatments:', error)
    throw error
  }

  if (!appointments || appointments.length === 0) {
    return []
  }

  // Fetch service names
  const serviceIds = [...new Set(appointments.filter(a => a.service_id).map(a => a.service_id))]
  const { data: services } = await supabase
    .schema('dentist')
    .from('services_tbl')
    .select('service_id, service_name, service_fee')
    .in('service_id', serviceIds)

  const serviceMap = new Map(
    services?.map(s => [s.service_id, { name: s.service_name, fee: s.service_fee }]) ?? []
  )

  // Fetch personnel names
  const personnelIds = [...new Set(appointments.filter(a => a.personnel_id).map(a => a.personnel_id))]
  const { data: personnel } = await supabase
    .from('personnel_tbl')
    .select('personnel_id, f_name, l_name')
    .in('personnel_id', personnelIds)

  const personnelMap = new Map(
    personnel?.map(p => [p.personnel_id, `Dr. ${p.f_name} ${p.l_name}`]) ?? []
  )

  return appointments.map(apt => ({
    id: apt.appointment_id,
    patientId,
    date: apt.appointment_date ?? '',
    service: serviceMap.get(apt.service_id)?.name ?? 'Unknown Service',
    serviceId: apt.service_id,
    dentist: personnelMap.get(apt.personnel_id) ?? 'Unassigned',
    dentistId: apt.personnel_id,
    notes: apt.notes ?? null,
    status: 'completed' as const,
    cost: serviceMap.get(apt.service_id)?.fee ?? null,
  }))
}

// ============================================
// PATIENT PRESCRIPTIONS API
// ============================================

/**
 * Fetch prescriptions for a patient
 * Note: Currently prescriptions are not directly linked to patients in the schema.
 * This will need to be updated when patient_id is added to prescription_tbl
 * or when prescriptions are linked through treatment_result_tbl.
 */
export async function fetchPatientPrescriptions(_patientId: number): Promise<PatientPrescription[]> {
  // Note: Since prescriptions don't have direct patient_id in the current schema,
  // we return empty for now. This function is ready to be implemented when
  // the schema is updated to link prescriptions to patients.
  return []
}

// ============================================
// PATIENT FOLLOW-UPS API
// ============================================

/**
 * Fetch follow-ups for a patient
 */
export async function fetchPatientFollowUps(patientId: number): Promise<PatientFollowUp[]> {
  const { data: followups, error } = await supabase
    .schema('frontdesk')
    .from('followup_tbl')
    .select(`
      followup_id,
      followup_date,
      followup_time,
      service_id,
      personnel_id,
      appointment_status_id
    `)
    .eq('patient_id', patientId)
    .order('followup_date', { ascending: false })

  if (error) {
    console.error('Error fetching patient follow-ups:', error)
    throw error
  }

  if (!followups || followups.length === 0) {
    return []
  }

  // Fetch service names
  const serviceIds = [...new Set(followups.filter(f => f.service_id).map(f => f.service_id))]
  const { data: services } = await supabase
    .schema('dentist')
    .from('services_tbl')
    .select('service_id, service_name')
    .in('service_id', serviceIds)

  const serviceMap = new Map(
    services?.map(s => [s.service_id, s.service_name]) ?? []
  )

  // Fetch personnel names
  const personnelIds = [...new Set(followups.filter(f => f.personnel_id).map(f => f.personnel_id))]
  const { data: personnel } = await supabase
    .from('personnel_tbl')
    .select('personnel_id, f_name, l_name')
    .in('personnel_id', personnelIds)

  const personnelMap = new Map(
    personnel?.map(p => [p.personnel_id, `Dr. ${p.f_name} ${p.l_name}`]) ?? []
  )

  // Fetch statuses
  const { data: statuses } = await supabase
    .schema('frontdesk')
    .from('appointment_status_tbl')
    .select('appointment_status_id, appointment_status_name')

  const statusMap = new Map(
    statuses?.map(s => [s.appointment_status_id, s.appointment_status_name.toLowerCase()]) ?? []
  )

  return followups.map(f => {
    const statusName = statusMap.get(f.appointment_status_id) ?? 'scheduled'
    let status: 'scheduled' | 'recommended' | 'completed' | 'cancelled' = 'scheduled'
    if (statusName.includes('completed')) status = 'completed'
    else if (statusName.includes('cancelled')) status = 'cancelled'
    else if (statusName.includes('pending')) status = 'recommended'

    return {
      id: f.followup_id,
      patientId,
      scheduledDate: f.followup_date ?? '',
      scheduledTime: f.followup_time ?? null,
      service: serviceMap.get(f.service_id) ?? 'Unknown Service',
      serviceId: f.service_id,
      dentist: personnelMap.get(f.personnel_id) ?? 'Unassigned',
      dentistId: f.personnel_id,
      notes: null,
      status,
    }
  })
}

// ============================================
// PATIENT UPDATE API
// ============================================

/**
 * Update patient information
 */
export async function updatePatient(
  patientId: number,
  data: {
    f_name?: string
    l_name?: string
    m_name?: string
    suffix?: string
    email?: string
    pri_contact_no?: string
    sec_contact_no?: string
    address?: string
    birthdate?: string
    gender?: string
    blood_type?: string
  }
): Promise<void> {
  const { error } = await supabase
    .schema('patient_record')
    .from('patient_tbl')
    .update(data)
    .eq('patient_id', patientId)

  if (error) {
    console.error('Error updating patient:', error)
    throw error
  }
}

/**
 * Update patient emergency contact
 */
export async function updatePatientEmergencyContact(
  patientId: number,
  data: {
    ec_f_name?: string
    ec_l_name?: string
    ec_contact_no?: string
    ec_relationship?: string
    ec_email?: string
  }
): Promise<void> {
  // Check if emergency contact exists
  const { data: existing } = await supabase
    .schema('patient_record')
    .from('emergency_contact_tbl')
    .select('patient_id')
    .eq('patient_id', patientId)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .schema('patient_record')
      .from('emergency_contact_tbl')
      .update(data)
      .eq('patient_id', patientId)

    if (error) {
      console.error('Error updating emergency contact:', error)
      throw error
    }
  } else {
    // Insert new
    const { error } = await supabase
      .schema('patient_record')
      .from('emergency_contact_tbl')
      .insert({ patient_id: patientId, ...data })

    if (error) {
      console.error('Error inserting emergency contact:', error)
      throw error
    }
  }
}
