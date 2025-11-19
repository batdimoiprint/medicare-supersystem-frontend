import { useParams } from 'react-router-dom'

export default function CancelRequestDetails() {
    const { appointment_id } = useParams()
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Cancel Request Details</h1>
            <p className="text-sm text-muted-foreground">Cancel request for appointment ID: {appointment_id}</p>
        </div>
    )
}
