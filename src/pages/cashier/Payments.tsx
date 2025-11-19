import CashierTable from '@/components/cashier/CashierTable'
import samplePayments from '@/components/cashier/mockData'

export default function Payments() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Payments</h1>
            <p className="text-sm text-muted-foreground">List of payments (template).</p>
            <div className="mt-4">
                <CashierTable items={samplePayments} basePath="/cashier/payments" />
            </div>
        </div>
    )
}
