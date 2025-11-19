import React from 'react'
import ReceptionistTable from '@/components/receptionist/ReceptionistTable'
import sampleAppointments from '@/components/receptionist/mockData'

export default function CancelRequests() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Cancel Requests</h1>
            <p className="text-sm text-muted-foreground">List of appointment cancel requests (template).</p>
            <div className="mt-4">
                <ReceptionistTable items={sampleAppointments.filter(a => a.status === 'cancelled')} basePath="/receptionist/cancel-requests" />
            </div>
        </div>
    )
}
