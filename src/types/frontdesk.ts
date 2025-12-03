// Frontdesk Schema Types for Supabase

export interface AppointmentStatus {
  appointment_status_id: number
  appointment_status_name: string
}

export interface Appointment {
  appointment_id: number
  patient_id: number
  service_id: number | null
  appointment_time: string | null // time without time zone
  appointment_date: string | null // date
  appointment_status_id: number | null
  created_at: string | null
  personnel_id: number | null
  // Joined relations
  appointment_status?: AppointmentStatus
  patient?: {
    patient_id: number
    first_name: string
    last_name: string
  }
  service?: {
    service_id: number
    service_name: string
  }
  personnel?: {
    personnel_id: number
    first_name: string
    last_name: string
  }
}

export interface Followup {
  followup_id: number
  patient_id: number
  appointment_id: number | null
  followup_date: string | null
  followup_time: string | null
  service_id: number | null
  appointment_status_id: number | null
  personnel_id: number | null
  // Joined relations
  appointment_status?: AppointmentStatus
  patient?: {
    patient_id: number
    first_name: string
    last_name: string
  }
}

export interface PaymentStatus {
  appointment_status_id: number
  appointment_status_name: string
}

export interface BillService {
  bill_service_id: number
  bill_id: number
  service_id: number | null
  billed_quantity: number | null
  billed_unit_price: number | null
  sub_total: number | null
}

export interface BillMedicine {
  bill_medicine_id: number
  bill_id: number
  medicine_id: number | null
  billed_quantity: number | null
  billed_unit_price: number | null
  sub_total: number | null
}

export interface BillEquipment {
  bill_equipment_id: number
  bill_id: number
  equipment_id: number | null
  billed_quantity: number | null
  billed_unit_price: number | null
  sub_total: number | null
}

export interface BillConsumable {
  bill_consumable_id: number
  bill_id: number
  consumables_id: number | null
  billed_quantity: number | null
  billed_unit_price: number | null
  sub_total: number | null
}

export interface Billing {
  bill_id: number
  patient_id: number
  appointment_id: number | null
  followup_id: number | null
  bill_service_id: number | null
  bill_medicine_id: number | null
  bill_equipment_id: number | null
  total_amount: number | null
  payable_amount: number | null
  cash_paid: number | null
  change_amount: number | null
  payment_option: string | null // USER-DEFINED enum
  payment_status_id: number | null
  paymongo_payment_id: number | null
  bill_consumable_id: number | null
}

export interface ReservationFee {
  reservation_fee_id: number
  appointment_id: number
  payment_id: number | null
  reservation_fee_status: string | null // USER-DEFINED enum
  created_at: string | null
}

export interface Refund {
  refund_id: number
  appointment_id: number
  reservation_fee_id: number | null
  reason: string | null // USER-DEFINED enum
  notes: string | null
  refund_amount: number | null
  refund_status: string | null // USER-DEFINED enum
}

export interface BillHistory {
  bill_history_id: number
  bill_id: number | null
}

// Dashboard specific types
export interface DashboardStats {
  todaysAppointments: number
  pendingFollowups: number
  cancelRequests: number
  avgWaitMinutes: number
}

export interface AppointmentsByDay {
  day: string
  count: number
}

export interface AppointmentStatusDistribution {
  status: string
  count: number
}

export interface RecentActivity {
  id: number
  type: 'appointment_confirmed' | 'appointment_cancelled' | 'followup_scheduled' | 'refund_requested'
  description: string
  timestamp: string
  patientName?: string
}

/**
 * Detailed appointment information for the details page
 */
export interface AppointmentDetail {
  appointment_id: number
  patient_id: number
  service_id: number | null
  appointment_time: string | null
  appointment_date: string | null
  appointment_status_id: number | null
  personnel_id: number | null
  created_at: string | null
  // Patient info (joined from patient_record.patient_tbl)
  appointment_status_name: string | null
  patient_first_name: string | null
  patient_last_name: string | null
  patient_middle_name: string | null
  patient_suffix: string | null
  patient_email: string | null
  patient_contact: string | null
  patient_secondary_contact: string | null
  patient_gender: string | null
  patient_birthdate: string | null
  patient_address: string | null
  // Personnel info (joined from public.personnel_tbl)
  personnel_first_name: string | null
  personnel_last_name: string | null
  // Service info (joined from dentist.services_tbl)
  service_name: string | null
  service_description: string | null
  service_fee: number | null
  service_duration: string | null
  service_category_name: string | null
}

/**
 * Followup table row for display in lists
 */
export interface FollowupTableRow {
  id: string
  patientName: string
  doctorAssigned: string
  status: string
  appointmentDate: string
  followupTime: string | null
  serviceId: number | null
  originalAppointmentId: number | null
}

/**
 * Detailed followup information for the details page
 */
export interface FollowupDetail {
  followup_id: number
  patient_id: number
  appointment_id: number | null
  followup_date: string | null
  followup_time: string | null
  service_id: number | null
  appointment_status_id: number | null
  personnel_id: number | null
  // Status info
  appointment_status_name: string | null
  // Patient info (joined from patient_record.patient_tbl)
  patient_first_name: string | null
  patient_last_name: string | null
  patient_middle_name: string | null
  patient_suffix: string | null
  patient_email: string | null
  patient_contact: string | null
  patient_secondary_contact: string | null
  patient_gender: string | null
  patient_birthdate: string | null
  patient_address: string | null
  // Personnel info (joined from public.personnel_tbl)
  personnel_first_name: string | null
  personnel_last_name: string | null
  // Service info (joined from dentist.services_tbl)
  service_name: string | null
  service_description: string | null
  service_fee: number | null
  service_duration: string | null
  service_category_name: string | null
  // Original appointment info
  original_appointment_date: string | null
  original_appointment_time: string | null
  original_appointment_service: string | null
}

// ==========================================
// ADMIN APPOINTMENTS TYPES
// ==========================================

/**
 * Admin Dashboard Appointment Stats
 */
export interface AdminAppointmentStats {
  pendingRequests: number
  approvedToday: number
  rescheduledCount: number
  cancelledCount: number
}

/**
 * Pending appointment for admin view
 */
export interface AdminPendingAppointment {
  id: number
  patient: string
  patientId: number
  service: string
  serviceId: number | null
  date: string
  time: string | null
  dentist: string
  dentistId: number | null
  type: 'new' | 'followup' | 'reschedule'
  status: string
  reservationFee: number | null
  paymentReceiptUrl: string | null
  notes: string | null
  referenceNumber: string | null
  createdAt: string | null
}

/**
 * Completed appointment for admin view
 */
export interface AdminCompletedAppointment {
  id: number
  patient: string
  patientId: number
  service: string
  serviceId: number | null
  date: string
  time: string | null
  dentist: string
  dentistId: number | null
  status: string
  completedAt: string | null
}

/**
 * Rescheduled appointment for admin view
 */
export interface AdminRescheduledAppointment {
  id: number
  patient: string
  patientId: number
  service: string
  serviceId: number | null
  originalDate: string | null
  newDate: string
  newTime: string | null
  dentist: string
  dentistId: number | null
  reason: string | null
}

/**
 * Cancelled appointment for admin view
 */
export interface AdminCancelledAppointment {
  id: number
  patient: string
  patientId: number
  service: string
  serviceId: number | null
  date: string
  dentist: string
  dentistId: number | null
  reason: string | null
  cancelledBy: string
  cancelledAt: string | null
}
