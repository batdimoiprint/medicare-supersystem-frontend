
import ReceptionistTable from '@/components/receptionist/ReceptionistTable'
import sampleAppointments from '@/components/receptionist/mockData'

export default function Appointments() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Appointments</h1>
            <p className="text-sm text-muted-foreground">List of appointments for the receptionist role (template).</p>
            <div className="mt-4">
                {/* <ReceptionistTable items={sampleAppointments} basePath="/receptionist/appointments" /> */}
            </div>
        </div>
    )
}
