import { Navigate } from 'react-router-dom'

export default function ReceptionistPage() {
    // Redirect to the dashboard as the main entry point
    return <Navigate to="/receptionist/dashboard" replace />
}