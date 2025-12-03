import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

type TableItem = {
    refund_id?: string
    patientName?: string
    appointment_id?: string | number
    amount?: number
    refund_amount?: number
    status?: string
    refund_status?: string
    notes?: string
    id?: string
  }
  
export default function RefundTable({ items, basePath }: { items?: TableItem[]; basePath: string }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!items) return []
    return items.filter(i =>
      JSON.stringify(i).toLowerCase().includes(query.toLowerCase())
    )
  }, [items, query])

  function openDetails(id: string) {
    navigate(`${basePath}/${id}`)
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>ID</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {filtered.map(row => {
            const id = String(row.appointment_id ?? row.id ?? row.refund_id ?? '')

            return (
              <TableRow key={id} onClick={() => openDetails(id)} className="cursor-pointer">
                <TableCell>{id}</TableCell>
                <TableCell>{row.patientName ?? row.appointment_id}</TableCell>
                <TableCell>{`₱ ${(row.amount ?? row.refund_amount ?? 0).toFixed(2)}`}</TableCell>
                <TableCell>{row.status ?? row.refund_status}</TableCell>
                <TableCell>{row.notes}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); openDetails(id); }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}