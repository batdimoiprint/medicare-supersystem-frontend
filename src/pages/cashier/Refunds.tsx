import { useEffect, useState } from 'react'
import CashierTable from '@/components/cashier/RefundTable'
import supabase from '@/utils/supabase'

type RefundItem = {
    refund_id: string
    appointment_id: number
    refund_amount?: number
    refund_status?: string
    notes?: string
    patientName?: string 
  }

export default function Refunds() {
  const [refunds, setRefunds] = useState<RefundItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRefunds()
  }, [])

  async function loadRefunds() {
    setLoading(true)
    try {
      const { data: refundsData, error: refundsError } = await supabase
        .from("refund_tbl")
        .select("refund_id, appointment_id, refund_amount, refund_status, notes")

      if (refundsError) throw refundsError
      if (!refundsData) throw new Error("No refunds found")

      const appointmentIds = Array.from(
        new Set(refundsData.map(r => r.appointment_id).filter(id => id != null))
      )

      let appointmentsData: any[] = []
      if (appointmentIds.length > 0) {
        const { data, error } = await supabase
          .from("appointment_tbl")
          .select("appointment_id, patient_id")
          .in("appointment_id", appointmentIds)

        if (error) throw error
        appointmentsData = data ?? []
      }

      const patientIds = Array.from(
        new Set(appointmentsData.map(a => a.patient_id).filter(id => id != null))
      )

      let patientsData: any[] = []
      if (patientIds.length > 0) {
        const { data, error } = await supabase
          .from("patient_tbl")
          .select("patient_id, f_name, l_name")
          .in("patient_id", patientIds)

        if (error) throw error
        patientsData = data ?? []
      }

      const refundsWithPatient = refundsData.map((r: any) => {
        const appointment = appointmentsData.find(a => a.appointment_id === r.appointment_id)
        const patient = patientsData.find(p => p.patient_id === appointment?.patient_id)
        return {
          ...r,
          patientName: patient ? `${patient.f_name} ${patient.l_name}` : undefined
        }
      })

      setRefunds(refundsWithPatient)
    } catch (error) {
      console.error("Error fetching refunds:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      <CashierTable items={refunds} basePath="/cashier/refunds" />
    </div>
  )
}