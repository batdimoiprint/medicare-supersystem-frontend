import React from 'react'
import { useParams } from 'react-router-dom'

export default function FollowupDetails() {
    const { appointment_id } = useParams()
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Followup Details</h1>
            <p className="text-sm text-muted-foreground">Followup for appointment ID: {appointment_id}</p>
        </div>
    )
}
