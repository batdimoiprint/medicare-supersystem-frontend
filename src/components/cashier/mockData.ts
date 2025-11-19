export type PaymentRow = {
    id: string
    patientName: string
    amount: number
    method: string
    status: 'processed' | 'pending' | 'failed' | 'refunded'
    paymentDate: string
}

export const samplePayments: PaymentRow[] = [
    { id: 'P1001', patientName: 'John Doe', amount: 150.0, method: 'Card', status: 'processed', paymentDate: '2025-11-19 10:00' },
    { id: 'P1002', patientName: 'Jane Smith', amount: 230.0, method: 'Cash', status: 'processed', paymentDate: '2025-11-19 09:00' },
    { id: 'P1003', patientName: 'Bob Johnson', amount: 100.0, method: 'Card', status: 'refunded', paymentDate: '2025-11-18 13:00' },
    { id: 'P1004', patientName: 'Alice Cooper', amount: 120.0, method: 'Card', status: 'pending', paymentDate: '2025-11-20 11:00' },
    { id: 'P1005', patientName: 'Carlos Ruiz', amount: 45.0, method: 'Cash', status: 'failed', paymentDate: '2025-11-21 14:00' },
]

export default samplePayments
