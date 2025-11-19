import React from 'react'
import CashierTable from '@/components/cashier/CashierTable'
import samplePayments from '@/components/cashier/mockData'

export default function Refunds() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold">Refunds</h1>
            <p className="text-sm text-muted-foreground">List of refunds (template).</p>
            <div className="mt-4">
                <CashierTable items={samplePayments.filter(p => p.status === 'refunded')} basePath="/cashier/refunds" />
            </div>
        </div>
    )
}
