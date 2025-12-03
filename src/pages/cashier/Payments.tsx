import { useEffect, useState } from 'react'
import PaymentTable from '@/components/cashier/PaymentTable'
import supabase from '@/utils/supabase'

type BillingItem = {
  bill_id: string
  appointment_id: number
  payable_amount?: number
  payment_option?: string
  payment_status_name?: string
  patientName?: string
}

export default function Billing() {
  const [billing, setBilling] = useState<BillingItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBilling()
  }, [])

  async function loadBilling() {
    setLoading(true)
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from('billing_view') 
        .select('bill_id, appointment_id, payable_amount, payment_option, payment_status_id')

      if (paymentError) throw paymentError
      if (!paymentData) return setBilling([])

      const appointmentIds = [...new Set(paymentData.map(r => r.appointment_id))]

      const { data: apptData, error: apptError } = await supabase
        .from('appointment_tbl')
        .select('appointment_id, patient_id')
        .in('appointment_id', appointmentIds)

      if (apptError) throw apptError

      const patientIds = [...new Set(apptData.map(a => a.patient_id))]

      const { data: patientData, error: patientError } = await supabase
        .from('patient_tbl')
        .select('patient_id, f_name, l_name')
        .in('patient_id', patientIds)

      if (patientError) throw patientError

      const statusIds = [...new Set(paymentData.map(r => r.payment_status_id))]
      const { data: statusData, error: statusError } = await supabase
        .from('pm_status_view')
        .select('appointment_status_id, appointment_status_name')
        .in('appointment_status_id', statusIds)

      if (statusError) throw statusError

      const mergedData = paymentData.map((b: any) => {
        const appt = apptData.find(a => a.appointment_id === b.appointment_id)
        const patient = patientData.find(p => p.patient_id === appt?.patient_id)
        const status = statusData.find(s => s.appointment_status_id === b.payment_status_id)

        return {
          bill_id: b.bill_id,
          appointment_id: b.appointment_id,
          payable_amount: b.payable_amount,
          payment_option: b.payment_option,
          payment_status_name: status?.appointment_status_name ?? 'Unknown',
          patientName: patient ? `${patient.f_name} ${patient.l_name}` : 'Unknown'
        }
      })

      setBilling(mergedData)
    } catch (err) {
      console.error('Error fetching billing:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      <PaymentTable items={billing} basePath="/cashier/payments" />
    </div>
  )
}
