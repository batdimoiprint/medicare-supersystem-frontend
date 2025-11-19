import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import type { PaymentRow } from './mockData'

export default function CashierTable({ items, basePath }: { items?: PaymentRow[]; basePath: string }) {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [methodFilter, setMethodFilter] = useState<string | undefined>(undefined)

    const filtered = useMemo(() => {
        if (!items) return []
        return items.filter(i => {
            const matchesQuery = [i.patientName, i.id].join(' ').toLowerCase().includes(query.toLowerCase())
            const matchesMethod = methodFilter ? i.method.toLowerCase() === methodFilter : true
            return matchesQuery && matchesMethod
        })
    }, [items, query, methodFilter])

    function openDetails(id: string) {
        navigate(`${basePath}/${id}`)
    }

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <Input placeholder="Search by patient or id" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Select onValueChange={(val) => setMethodFilter(val || undefined)}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <tr>
                        <TableHead>Patient</TableHead>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </tr>
                </TableHeader>
                <TableBody>
                    {filtered.map(row => (
                        <TableRow key={row.id} onClick={() => openDetails(row.id)} className="cursor-pointer">
                            <TableCell>{row.patientName}</TableCell>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{`₱ ${row.amount.toFixed(2)}`}</TableCell>
                            <TableCell>{row.method}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell>{row.paymentDate}</TableCell>
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
