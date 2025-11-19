import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

export type AppointmentRow = {
    id: string
    patientName: string
    doctorAssigned: string
    status: string
    appointmentDate: string
}

export default function ReceptionistTable({
    items,
    basePath,
}: {
    items?: AppointmentRow[]
    basePath: string // e.g., '/receptionist/appointments'
}) {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

    const filtered = useMemo(() => {
        if (!items) return []
        return items.filter(i => {
            const matchesQuery = [i.patientName, i.doctorAssigned].join(' ').toLowerCase().includes(query.toLowerCase())
            const matchesStatus = statusFilter ? i.status === statusFilter : true
            return matchesQuery && matchesStatus
        })
    }, [items, query, statusFilter])

    function openDetails(id: string) {
        navigate(`${basePath}/${id}`)
    }

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <Input placeholder="Search by patient or doctor" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Select onValueChange={(val) => setStatusFilter(val || undefined)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All</SelectItem>
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
                                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); openDetails(row.id); }}>
                                    <Eye className="w-4 h-4" />
                                    <span className="sr-only">View</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
