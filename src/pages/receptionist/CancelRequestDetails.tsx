import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCancelRequestDetails, useApproveCancellation, useRejectCancellation } from '@/hooks/use-cancel-requests'
import { Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CancelRequestDetails() {
    const { appointment_id } = useParams()
    const navigate = useNavigate()
    const appointmentId = appointment_id ? parseInt(appointment_id, 10) : undefined
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [approvalNotes, setApprovalNotes] = useState('')

    const { data: appointment, isLoading, isError } = useCancelRequestDetails(appointmentId)
    const approveMutation = useApproveCancellation()
    const rejectMutation = useRejectCancellation()

    const showSuccess = (message: string) => {
        setSuccessMessage(message)
        setTimeout(() => {
            setSuccessMessage(null)
            navigate('/receptionist/cancel-requests')
        }, 2000) // Navigate after 2 seconds
    }

    const showError = (message: string) => {
        setErrorMessage(message)
        setTimeout(() => setErrorMessage(null), 4000)
    }

    const handleApprove = async () => {
        if (!appointmentId) return
        try {
            await approveMutation.mutateAsync({ 
                appointmentId, 
                notes: approvalNotes.trim() || undefined 
            })
            showSuccess('Cancellation approved! Refund has been submitted for processing.')
        } catch (error) {
            console.error('Failed to approve cancellation:', error)
            showError('Failed to approve cancellation. Please try again.')
        }
    }

    const handleReject = async () => {
        if (!appointmentId) return
        try {
            await rejectMutation.mutateAsync(appointmentId)
            showSuccess('Cancellation rejected. Appointment restored to Confirmed status.')
        } catch (error) {
            console.error('Failed to reject cancellation:', error)
            showError('Failed to reject cancellation. Please try again.')
        }
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
            {/* Success Message */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="ml-2 hover:bg-white/20 rounded p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-[100] bg-destructive text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="ml-2 hover:bg-white/20 rounded p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <Input value={
                                [
                                    appointment.patient_first_name,
                                    appointment.patient_middle_name,
                                    appointment.patient_last_name,
                                    appointment.patient_suffix
                                ].filter(Boolean).join(' ') || 'N/A'
                            } readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Patient ID</Label>
                            <Input value={appointment.patient_id?.toString() || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input value={appointment.patient_gender || 'N/A'} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Birthdate</Label>
                                <Input value={appointment.patient_birthdate || 'N/A'} readOnly className="bg-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Contact</Label>
                            <Input value={appointment.patient_contact || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Contact</Label>
                            <Input value={appointment.patient_secondary_contact || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={appointment.patient_email || 'N/A'} readOnly className="bg-muted" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={appointment.patient_address || 'N/A'} readOnly className="bg-muted" />
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
                        {appointment.service_category_name && (
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input value={appointment.service_category_name} readOnly className="bg-muted" />
                            </div>
                        )}
                        {appointment.service_description && (
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={appointment.service_description} readOnly className="bg-muted" />
                            </div>
                        )}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Service Fee</Label>
                                <Input value={appointment.service_fee ? `₱ ${appointment.service_fee.toFixed(2)}` : 'N/A'} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input value={appointment.service_duration || 'N/A'} readOnly className="bg-muted" />
                            </div>
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
                        <div className="space-y-2">
                            <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                            <Textarea
                                id="approval-notes"
                                placeholder="Add notes for this cancellation approval..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                className="min-h-[80px]"
                            />
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
