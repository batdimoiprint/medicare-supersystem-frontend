import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

type TableItem = {
  bill_id?: string
  appointment_id?: string | number
  payable_amount?: number
  payment_status_name?: string
  payment_option?: string
  patientName?: string
}

export default function PaymentTable({ items, basePath }: { items?: TableItem[]; basePath: string }) {
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
            <TableHead>Bill ID</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Option</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>

        <TableBody>
          {filtered.map(row => {
            const id = String(row.appointment_id ?? row.bill_id ?? '')

            return (
              <TableRow key={id} onClick={() => openDetails(id)} className="cursor-pointer">
                <TableCell>{row.bill_id}</TableCell>
                <TableCell>{row.patientName ?? "Unknown"}</TableCell>
                <TableCell>₱ {Number(row.payable_amount ?? 0).toFixed(2)}</TableCell>
                <TableCell>{row.payment_status_name ?? "Unknown"}</TableCell>
                <TableCell>{row.payment_option ?? "N/A"}</TableCell>
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
