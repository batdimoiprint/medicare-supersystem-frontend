   type RefundRow = {
    refund_id: number
    appointment_id: number
    refund_amount: number
    refund_status: string
    notes?: string
  }
  
  export const sampleRefunds: RefundRow[] = [
    { refund_id: 1001, appointment_id: 200, refund_amount: 150.0, refund_status: 'refunded', notes: 'Duplicate charge' },
  ]