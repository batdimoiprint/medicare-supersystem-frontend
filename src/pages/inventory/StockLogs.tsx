import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Clock, DownloadCloud, Funnel, ArrowUp, ArrowDown, Clipboard, Edit } from 'lucide-react'

const sampleLogs = [
    { id: 'LOG-001', date: '2025-11-23 09:34', action: 'Stock In', item: 'Latex Gloves (Medium)', supplier: 'MedSupply Co.', qty: 100, user: 'Alice M.', status: 'Pending', ref: 'PO-2025-0156', note: 'Arrived from supplier' },
    { id: 'LOG-002', date: '2025-11-23 11:10', action: 'Stock Out', item: 'Disposable Syringes', supplier: 'SafeMed Inc', qty: 20, user: 'Front Desk', status: 'Received', ref: 'ADJ-0001', note: 'Used for patient treatments' },
    { id: 'LOG-003', date: '2025-11-22 08:50', action: 'Stock In', item: 'Ibuprofen 200mg', supplier: 'PharmaDirect', qty: 120, user: 'Inventory Team', status: 'Received', ref: 'PO-2025-0130', note: 'Batch update' },
    { id: 'LOG-004', date: '2025-11-21 14:02', action: 'Stock Out', item: 'X-Ray Film', supplier: 'RadiologyPro', qty: 5, user: 'Dentist Unit', status: 'On Hold', ref: 'ADJ-0002', note: 'Used for imaging' },
]

function StockLogs() {
    const [activeTab, setActiveTab] = useState<'in' | 'out'>('in')
    const [statusFilter, setStatusFilter] = useState<string>('All')

    const filteredLogs = useMemo(() => {
        const type = activeTab === 'in' ? 'Stock In' : 'Stock Out'
        const base = sampleLogs.filter(l => l.action === type && (statusFilter === 'All' || l.status === statusFilter))
        // For Stock Out, the 'On Hold' status should not be shown — exclude it from results
        if (activeTab === 'out') return base.filter(l => l.status !== 'On Hold')
        return base
    }, [activeTab, statusFilter])

    const totalInToday = sampleLogs.filter(l => l.action === 'Stock In' && l.date.startsWith('2025-11-23')).length

    // Print a specific element (transaction tracker) to the printer window
    function printElementById(id: string) {
        const el = document.getElementById(id)
        if (!el) {
            // fallback to window.print if element not found
            window.print()
            return
        }
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (!printWindow) return
        // collect stylesheet links from the page so the printed output keeps project styles
        const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`).join('')
        // Do not inject heavy fallback CSS — rely on Tailwind in the app stylesheet for printing.
        const styles = `
            <style>
                /* Minimal fallback in case the CSS link cannot be loaded in the print window */
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 8px; }
                .sr-only { position:absolute; left:-10000px; }
            </style>
        `
        // Only print the table itself (plus a minimal header), to avoid printing other UI chrome
        const tableEl = el.querySelector('table')
        const headerHtml = `<div class="mb-2 font-sans"><h3 class="text-lg mb-2">Transaction Tracker (${filteredLogs.length} items)</h3><p class="m-0 text-sm text-slate-400">Chronological record</p></div>`
        const bodyHtml = tableEl ? headerHtml + tableEl.outerHTML : el.outerHTML
        printWindow.document.write(`<!doctype html><html><head><title>Stock Logs</title>${styleLinks}${styles}</head><body>${bodyHtml}</body></html>`) 
        printWindow.document.close()
        printWindow.focus()
        // Wait for content to finish loading then print
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    return (
        <div className="px-6 md:px-12 text-slate-900 dark:text-slate-100">
            <div className="w-full max-w-screen-2xl mx-auto space-y-6">
                <Card className="w-full py-3 -mt-2">
                    <CardHeader className="px-6 py-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl mb-0 flex items-center gap-3 text-slate-900 dark:text-slate-100">
                                    <Clock className="w-7 h-7 text-cyan-300" />
                                    Stock Logs
                                </CardTitle>
                                <p className="text-muted-foreground dark:text-slate-300">Track all inventory movements and transactions</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Tabs (outside of cards) - placed below title card, overlapping stats card only */}
                <div className="w-full max-w-screen-2xl mx-auto px-6 flex justify-center mt-6 z-10">
                    <div className="w-full flex rounded-[20px] bg-slate-50 dark:bg-[#0f2b2b] items-center h-[44px] shadow-sm">
                        <button onClick={() => setActiveTab('in')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'in' ? 'bg-emerald-600 text-white shadow' : 'text-slate-700 dark:text-slate-200')}> <ArrowUp className={cn('w-4 h-4', activeTab === 'in' ? 'text-white' : 'text-emerald-700 dark:text-emerald-300')} /> Stock In</button>
                        <button onClick={() => setActiveTab('out')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'out' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 dark:text-slate-200')}> <ArrowDown className={cn('w-4 h-4', activeTab === 'out' ? 'text-white' : 'text-amber-700 dark:text-amber-300')} /> Stock Out</button>
                    </div>
                </div>

                {/* Stats (2 standalone cards side-by-side on md+) */}
                <div className="w-full -mt-3">
                    <div className="pt-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-6">
                            <div>
                                <Card className="min-h-[140px] h-full">
                                    <CardContent className="py-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-sm text-slate-600 dark:text-slate-300">Stock In today</div>
                                                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalInToday}</div>
                                                    </div>
                                                    <div className={cn('p-2 rounded-md inline-flex items-center justify-center', activeTab === 'in' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-800/30 dark:text-amber-200')}>
                                                        <ArrowUp className="w-6 h-6" />
                                                    </div>
                                                </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card className="min-h-[140px] h-full">
                                    <CardContent className="py-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">Total Transactions</div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{sampleLogs.length}</div>
                                        </div>
                                        <div className={cn('p-2 rounded-md inline-flex items-center justify-center', activeTab === 'in' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-800/30 dark:text-cyan-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-800/30 dark:text-amber-200')}>
                                            <Clipboard className="w-6 h-6" />
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Tracker */}
                <Card className="w-full">
                    <CardContent>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Transaction Tracker ({filteredLogs.length} items)</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-300">Chronological record</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 print:hidden">
                                    <Funnel className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                                        <SelectTrigger size="sm" className="rounded-3xl border border-slate-700 dark:border-slate-700 bg-[#f8faf8] dark:bg-[#082726] px-3 text-sm shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                                <SelectContent>
                                                    {activeTab === 'out' ? (
                                                        <>
                                                            <SelectItem value="All">All Status</SelectItem>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Received">Received</SelectItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SelectItem value="All">All Status</SelectItem>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Received">Received</SelectItem>
                                                            <SelectItem value="On Hold">On Hold</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                    </Select>
                                </div>
                                <Button size="sm" variant="ghost" className="bg-[#00a8a8] text-white print:hidden" onClick={() => printElementById('stock-logs-print')} aria-label="Export Logs">
                                    <DownloadCloud className="w-4 h-4 mr-2" /> Export Logs
                                </Button>
                            </div>
                        </div>

                        <div id="stock-logs-print" className="w-full overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-800 dark:text-slate-100">
                                <thead className="text-xs text-slate-400 dark:text-slate-300">
                                    <tr>
                                        <th className="px-3 py-1">Date & Time</th>
                                        <th className="px-3 py-1">Item</th>
                                        <th className="px-3 py-1">User</th>
                                        <th className="px-3 py-1">Supplier</th>
                                        <th className="px-3 py-1">Reference</th>
                                        {/* Qty column removed per request */}
                                        <th className="px-3 py-1">Status</th>
                                        <th className="px-3 py-1"> </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-800 hover:bg-[#071a1b]">
                                            <td className="px-3 py-1 text-slate-200 dark:text-slate-100">{log.date}</td>
                                                <td className="px-3 py-1 font-medium text-slate-100 dark:text-slate-100">{log.item}<div className="text-xs text-slate-400 dark:text-slate-300">{log.id}</div></td>
                                                <td className="px-3 py-1 text-slate-100 dark:text-slate-100">{log.user}</td>
                                                <td className="px-3 py-1 text-slate-200 dark:text-slate-100">{log.supplier}</td>
                                                <td className="px-3 py-1 text-slate-200 dark:text-slate-100">{log.ref}</td>
                                            <td className="px-4 py-3">
                                                <div className={cn('inline-flex items-center gap-2 px-2 py-0 rounded-full text-[10px] font-semibold', log.status === 'Received' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/30 dark:text-emerald-200' : log.status === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-800/30 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200')}>
                                                    {log.status}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 dark:text-slate-200">
                                                <div className="flex items-center gap-3 justify-end">
                                                    <Button variant="ghost" size="sm" className="p-1 text-slate-700 dark:text-slate-100 print:hidden" aria-label="Open Log"><Edit className="w-4 h-4" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default StockLogs;
