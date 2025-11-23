import type { AppointmentRow } from './ReceptionistTable'

export const sampleAppointments: AppointmentRow[] = [
    { id: '1001', patientName: 'John Doe', doctorAssigned: 'Dr. Perez', status: 'confirmed', appointmentDate: '2025-11-19 10:00' },
    { id: '1002', patientName: 'Jane Smith', doctorAssigned: 'Dr. Hepburn', status: 'completed', appointmentDate: '2025-11-19 09:00' },
    { id: '1003', patientName: 'Bob Johnson', doctorAssigned: 'Dr. Perez', status: 'cancelled', appointmentDate: '2025-11-18 13:00' },
    { id: '1004', patientName: 'Alice Cooper', doctorAssigned: 'Dr. Hepburn', status: 'pending', appointmentDate: '2025-11-20 11:00' },
    { id: '1005', patientName: 'Carlos Ruiz', doctorAssigned: 'Dr. Perez', status: 'followup', appointmentDate: '2025-11-21 14:00' },
]

export default sampleAppointments
