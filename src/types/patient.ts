// ============================================
// PATIENT RECORDS TYPES
// ============================================

export interface PatientRecordsStats {
  totalPatients: number
  activePatients: number
  newThisMonth: number
  visitsThisMonth: number
}

export interface PatientAllergy {
  allergy_id: number
  allergy_name: string
  allergy_severity: 'Mild' | 'Moderate' | 'Severe' | null
}

export interface PatientHealthProblem {
  health_problem_id: number
  health_problem_name: string
  health_problem_severity: 'Mild' | 'Moderate' | 'Severe' | null
}

export interface PatientEmergencyContact {
  ec_f_name: string
  ec_l_name: string
  ec_contact_no: string
  ec_relationship: string
  ec_email: string | null
}

export interface PatientInfo {
  id: string // Formatted: PAT-001
  patientId: number
  name: string
  firstName: string
  lastName: string
  middleName: string | null
  suffix: string | null
  email: string | null
  phone: string | null
  secondaryPhone: string | null
  address: string | null
  birthDate: string | null
  gender: string | null
  bloodType: string | null
  accountStatus: 'Pending' | 'Active' | 'Inactive' | 'Suspended'
  registeredDate: string | null
  lastVisit: string | null
  totalVisits: number
  imageUrl: string | null
  allergies: PatientAllergy[]
  healthProblems: PatientHealthProblem[]
  emergencyContact: PatientEmergencyContact | null
}

export interface PatientTreatmentHistory {
  id: number
  patientId: number
  date: string
  service: string
  serviceId: number | null
  dentist: string
  dentistId: number | null
  notes: string | null
  status: 'completed' | 'in-progress' | 'cancelled'
  cost: number | null
}

export interface PatientPrescription {
  id: number
  patientId: number
  date: string
  medication: string
  medicineId: number | null
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  prescribedBy: string
  prescribedById: number | null
  status: 'active' | 'completed'
}

export interface PatientFollowUp {
  id: number
  patientId: number
  scheduledDate: string
  scheduledTime: string | null
  service: string
  serviceId: number | null
  dentist: string
  dentistId: number | null
  notes: string | null
  status: 'scheduled' | 'recommended' | 'completed' | 'cancelled'
}

export interface PatientBillingHistory {
  id: number
  patientId: number
  date: string
  service: string
  amount: number
  method: 'cash' | 'paymongo' | 'gcash' | null
  status: 'paid' | 'pending' | 'partial'
}
