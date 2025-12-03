// ============================================
// DENTIST MANAGEMENT TYPES
// ============================================

export interface DentistSchedule {
  day: string
  time: string
}

export interface ServiceCategory {
  service_category_id: number
  category_name: string
}

export interface Service {
  service_id: number
  service_category_id: number
  service_name: string
  service_fee: number | null
}

export interface DentistInfo {
  id: string // Formatted: DEN-001
  personnelId: number
  dentistInfoId: number
  employeeNo: string | null
  name: string
  firstName: string
  lastName: string
  middleName: string | null
  suffix: string | null
  email: string | null
  phone: string | null
  birthdate: string | null
  gender: string | null
  address: {
    houseNo: string | null
    street: string | null
    barangay: string | null
    city: string | null
    country: string | null
  }
  licenseNumber: string | null
  specialization: string | null
  specializationId: number | null
  services: string[]
  status: 'active' | 'on-leave' | 'inactive'
  schedule: DentistSchedule[]
  totalPatients: number
  totalTreatments: number
  joinedDate: string | null
}

export interface DentistPatient {
  id: number
  dentistId: number
  patientName: string
  patientId: number
  lastVisit: string | null
  nextAppointment: string | null
  status: 'active' | 'completed' | 'inactive'
}

export interface DentistTreatmentLog {
  id: number
  dentistId: number
  patientName: string
  patientId: number
  service: string
  serviceId: number | null
  date: string
  notes: string | null
  status: 'completed' | 'in-progress' | 'pending'
  cost: number | null
}

export interface DentistPrescription {
  id: number
  dentistId: number
  patientName: string
  patientId: number
  medication: string
  dosage: string | null
  frequency: string | null
  duration: string | null
  date: string
  reason: string | null
}

export interface DentistFollowUp {
  id: number
  dentistId: number
  patientName: string
  patientId: number
  service: string
  recommendedDate: string
  notes: string | null
  priority: 'high' | 'medium' | 'routine'
}

export interface DentistManagementStats {
  totalDentists: number
  totalTreatments: number
  patientsServed: number
  pendingTreatments: number
}
