import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Eye, MoreHorizontal, CheckCircle, XCircle, Clock, Loader2, RotateCcw, CheckCircle2, X, AlertCircle } from 'lucide-react'
import { useConfirmAppointment, useCancelAppointment, useCompleteAppointment, useSetPendingAppointment } from '@/hooks/use-appointments'
import { useConfirmFollowup, useCancelFollowup, useCompleteFollowup, useSetPendingFollowup } from '@/hooks/use-followups'
import { useApproveCancellation, useRejectCancellation } from '@/hooks/use-cancel-requests'
import { motion, AnimatePresence } from 'framer-motion'

export type AppointmentRow = {
    id: string
    patientName: string
    doctorAssigned: string
    status: string
    appointmentDate: string
}

type TableType = 'appointment' | 'followup' | 'cancel-request'

// Success message mapping for different actions
const successMessages: Record<string, string> = {
    'confirm': 'Appointment confirmed successfully!',
    'cancel': 'Appointment cancelled successfully!',
    'complete': 'Appointment marked as completed!',
    'pending': 'Appointment set to pending!',
    'approve': 'Cancellation approved! Refund submitted for processing.',
    'reject': 'Cancellation rejected. Appointment restored.',
}

export default function ReceptionistTable({
    items,
    basePath,
    type = 'appointment',
}: {
    items?: AppointmentRow[]
    basePath: string // e.g., '/receptionist/appointments'
    type?: TableType
}) {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Appointment mutation hooks
    const confirmAppointmentMutation = useConfirmAppointment()
    const cancelAppointmentMutation = useCancelAppointment()
    const completeAppointmentMutation = useCompleteAppointment()
    const pendingAppointmentMutation = useSetPendingAppointment()

    // Followup mutation hooks
    const confirmFollowupMutation = useConfirmFollowup()
    const cancelFollowupMutation = useCancelFollowup()
    const completeFollowupMutation = useCompleteFollowup()
    const pendingFollowupMutation = useSetPendingFollowup()

    // Cancel request mutation hooks
    const approveCancellationMutation = useApproveCancellation()
    const rejectCancellationMutation = useRejectCancellation()

    const showSuccess = (action: string) => {
        setSuccessMessage(successMessages[action] || 'Action completed successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
    }

    const showError = (message: string) => {
        setErrorMessage(message)
        setTimeout(() => setErrorMessage(null), 4000)
    }

    const filtered = useMemo(() => {
        if (!items) return []
        return items.filter(i => {
            const matchesQuery = [i.patientName, i.doctorAssigned].join(' ').toLowerCase().includes(query.toLowerCase())
            const matchesStatus = statusFilter ? i.status.toLowerCase() === statusFilter.toLowerCase() : true
            return matchesQuery && matchesStatus
        })
    }, [items, query, statusFilter])

    function openDetails(id: string) {
        navigate(`${basePath}/${id}`)
    }

    async function handleStatusChange(id: string, action: 'confirm' | 'cancel' | 'complete' | 'pending' | 'approve' | 'reject') {
        setUpdatingId(id)
        const recordId = parseInt(id, 10)
        
        try {
            if (type === 'cancel-request') {
                switch (action) {
                    case 'approve':
                        await approveCancellationMutation.mutateAsync({ appointmentId: recordId })
                        break
                    case 'reject':
                        await rejectCancellationMutation.mutateAsync(recordId)
                        break
                }
            } else if (type === 'followup') {
                switch (action) {
                    case 'confirm':
                        await confirmFollowupMutation.mutateAsync(recordId)
                        break
                    case 'cancel':
                        await cancelFollowupMutation.mutateAsync(recordId)
                        break
                    case 'complete':
                        await completeFollowupMutation.mutateAsync(recordId)
                        break
                    case 'pending':
                        await pendingFollowupMutation.mutateAsync(recordId)
                        break
                }
            } else {
                switch (action) {
                    case 'confirm':
                        await confirmAppointmentMutation.mutateAsync(recordId)
                        break
                    case 'cancel':
                        await cancelAppointmentMutation.mutateAsync(recordId)
                        break
                    case 'complete':
                        await completeAppointmentMutation.mutateAsync(recordId)
                        break
                    case 'pending':
                        await pendingAppointmentMutation.mutateAsync(recordId)
                        break
                }
            }
            showSuccess(action)
        } catch (error) {
            console.error('Failed to update status:', error)
            showError('Failed to update status. Please try again.')
        } finally {
            setUpdatingId(null)
        }
    }

    const isUpdating = (id: string) => updatingId === id

    return (
        <div>
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

            <div className="flex gap-2 mb-4">
                <Input placeholder="Search by patient or doctor" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Select onValueChange={(val) => setStatusFilter(val || undefined)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="followup">Followup</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <tr>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Appointment Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </tr>
                </TableHeader>
                <TableBody>
                    {filtered.map(row => (
                        <TableRow key={row.id} onClick={() => openDetails(row.id)} className="cursor-pointer">
                            <TableCell>{row.patientName}</TableCell>
                            <TableCell>{row.doctorAssigned}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell>{row.appointmentDate}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetails(row.id); }}>
                                        <Eye className="w-4 h-4" />
                                        <span className="sr-only">View</span>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" disabled={isUpdating(row.id)}>
                                                {isUpdating(row.id) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <MoreHorizontal className="w-4 h-4" />
                                                )}
                                                <span className="sr-only">More actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => openDetails(row.id)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {type === 'cancel-request' ? (
                                                <>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'approve')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                        Approve Cancellation
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'reject')}
                                                    >
                                                        <RotateCcw className="w-4 h-4 mr-2 text-blue-500" />
                                                        Reject Request
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'confirm')}
                                                        disabled={row.status.toLowerCase() === 'confirmed'}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                                                        Confirm
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'complete')}
                                                        disabled={row.status.toLowerCase() === 'completed'}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                        Mark Completed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'pending')}
                                                        disabled={row.status.toLowerCase() === 'pending'}
                                                    >
                                                        <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                                                        Set Pending
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(row.id, 'cancel')}
                                                        disabled={row.status.toLowerCase() === 'cancelled'}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Cancel Appointment
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
