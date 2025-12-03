type BillingItem = {
    bill_id: string
    appointment_id: number
    payable_amount: number
    payment_status_id: string
    payment_option: string
    patientName?: string
  }
  
  export const sampleBilling: BillingItem[] = [
    {
      bill_id: "BILL-001",
      appointment_id: 200,
      payable_amount: 850.0,
      payment_status_id: "paid",      // matches PaymentTable column
      payment_option: "gcash",        // matches PaymentTable column
      patientName: "Juan Dela Cruz"   // optional but your table can show it
    },
    {
      bill_id: "BILL-002",
      appointment_id: 201,
      payable_amount: 1200.0,
      payment_status_id: "pending",
      payment_option: "cash",
      patientName: "Maria Santos"
    }
  ]
  