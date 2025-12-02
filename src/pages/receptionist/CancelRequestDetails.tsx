import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCancelRequestDetails, useApproveCancellation, useRejectCancellation } from '@/hooks/use-cancel-requests'
import { Loader2 } from 'lucide-react'

export default function CancelRequestDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()
    const appointmentId = appointment_id ? parseInt(appointment_id, 10) : undefined
    
    const { data: appointment, isLoading, isError } = useCancelRequestDetails(appointmentId)
    const approveMutation = useApproveCancellation()
    const rejectMutation = useRejectCancellation()
    
    const handleApprove = async () => {
        if (!appointmentId) return
        await approveMutation.mutateAsync(appointmentId)
        navigate('/receptionist/cancel-requests')
    }
    
    const handleReject = async () => {
        if (!appointmentId) return
        await rejectMutation.mutateAsync(appointmentId)
        navigate('/receptionist/cancel-requests')
    }
    
    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-72" />
                    <Skeleton className="h-72" />
                    <Skeleton className="h-72" />
                </div>
            </div>
        )
    }
    
    if (isError || !appointment) {
        return (
            <div className="p-6">
                <p className="text-destructive">Error loading cancel request details.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Cancel Request Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleApprove}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                        {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Approve Cancellation
                    </Button>
                    <Button 
                        onClick={handleReject}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                        {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Reject Request
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Patient Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={appointment.patient_first_name && appointment.patient_last_name 
                                ? `${appointment.patient_first_name} ${appointment.patient_last_name}` 
                                : 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value={appointment.patient_id?.toString() || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input value={appointment.patient_contact || 'N/A'} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: Appointment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appointment to Cancel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Appointment ID</Label>
                            <Input value={appointment.appointment_id?.toString() || appointment_id || "N/A"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Input value={appointment.service_name || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Dentist</Label>
                            <Input value={appointment.personnel_first_name && appointment.personnel_last_name
                                ? `Dr. ${appointment.personnel_first_name} ${appointment.personnel_last_name}`
                                : 'Not Assigned'} readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scheduled Date</Label>
                                <Input value={appointment.appointment_date || 'N/A'} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value={appointment.appointment_time || 'N/A'} readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Service Fee</Label>
                            <Input value={appointment.service_fee ? `₱ ${appointment.service_fee.toFixed(2)}` : 'N/A'} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Cancellation Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cancellation Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Status</Label>
                            <Input value={appointment.appointment_status_name || 'Cancelled'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Created At</Label>
                            <Input value={appointment.created_at 
                                ? new Date(appointment.created_at).toLocaleDateString() 
                                : 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <Separator />
                        <div className="space-y-2 pt-2">
                            <p className="text-sm text-muted-foreground">
                                <strong>Approve:</strong> Confirms the cancellation and may trigger refund processing.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                <strong>Reject:</strong> Restores the appointment to "Confirmed" status.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
