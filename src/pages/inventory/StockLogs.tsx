import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, DownloadCloud, Funnel, ArrowUp, ArrowDown, Clipboard, User, Lock } from 'lucide-react'
import supabase from '@/utils/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function StockLogs() {
    const [activeTab, setActiveTab] = useState<'in' | 'out'>('in')
    const [subTab, setSubTab] = useState<'ordered' | 'received'>('ordered')
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [stockInLogs, setStockInLogs] = useState<any[]>([])
    const [stockOutLogs, setStockOutLogs] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        // Update time every second to check for lock expiration in real-time
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchStockLogs();
    }, []);

    useEffect(() => {
        const checkAutoUnlock = async () => {
            const updates: string[] = [];
            const LOCK_DURATION = parseInt(localStorage.getItem('stocklogs.lockMs') || (48 * 60 * 60 * 1000).toString());

            stockInLogs.forEach(log => {
                const item = log.original_data;
                // Only check items that are Pending and NOT yet unlocked
                if (item.status === 'Pending' && !item.unlock && !item.force_unlock) {
                    let shouldUnlock = false;
                    
                    const lockTime = item.lock_until ? new Date(item.lock_until).getTime() : 0;
                    const dateObj = item.created_at ? new Date(item.created_at) : null;
                    const createdTime = dateObj ? dateObj.getTime() : 0;

                    // Unlock if EITHER lock_until has passed OR created_at + duration has passed
                    // This allows manual backdating of created_at to force unlock
                    if ((lockTime > 0 && currentTime >= lockTime) || 
                        (createdTime > 0 && currentTime >= createdTime + LOCK_DURATION)) {
                        shouldUnlock = true;
                    }

                    if (shouldUnlock) {
                        updates.push(item.id);
                    }
                }
            });

            if (updates.length > 0) {
                try {
                    // Persist unlock to DB
                    const { error } = await supabase
                        .schema('inventory')
                        .from('stock_in')
                        .update({ unlock: true })
                        .in('id', updates);

                    if (!error) {
                        // Update local state
                        setStockInLogs(prev => prev.map(log => 
                            updates.includes(log.id) 
                                ? { ...log, original_data: { ...log.original_data, unlock: true } } 
                                : log
                        ));
                    }
                } catch (error) {
                    console.error('Error auto-unlocking items:', error);
                }
            }
        };

        checkAutoUnlock();
    }, [currentTime, stockInLogs]);

    const fetchStockLogs = async () => {
        try {
            // Fetch Stock In
            const { data: inData, error: inError } = await supabase
                .schema('inventory')
                .from('stock_in')
                .select('*')
                .order('created_at', { ascending: false });

            if (inError) throw inError;

            // Fetch Stock Out
            const { data: outData, error: outError } = await supabase
                .schema('inventory')
                .from('stock_out')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (outError) console.error('Error fetching stock out:', outError);

            const mappedInLogs = (inData || []).map((item: any) => {
                const dateObj = item.created_at ? new Date(item.created_at) : null;
                
                return {
                    id: item.id,
                    date: dateObj ? dateObj.toISOString().split('T')[0] : '--',
                    time: dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    action: 'Stock In',
                    item: item.item_name,
                    supplier: item.supplier || '--',
                    qty: item.quantity,
                    user: 'Admin', 
                    status: item.status || 'Pending',
                    ref: `PO-${item.id.toString().slice(0, 8)}`,
                    note: 'Ordered via Inventory Table',
                    original_data: item // Keep original data for moves and dynamic lock calc
                };
            });

            const mappedOutLogs = (outData || []).map((item: any) => {
                const dateObj = item.created_at ? new Date(item.created_at) : null;
                return {
                    id: item.id,
                    date: dateObj ? dateObj.toISOString().split('T')[0] : '--',
                    time: dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    action: 'Stock Out',
                    item: item.item_name,
                    supplier: item.supplier || '--',
                    qty: item.quantity,
                    user: item.user_name || 'Admin',
                    status: 'Completed',
                    ref: item.reference || `SO-${item.id.toString().slice(0, 8)}`,
                    note: item.notes || '',
                    original_data: item
                };
            });

            setStockInLogs(mappedInLogs);
            setStockOutLogs(mappedOutLogs);
        } catch (error) {
            console.error('Error fetching stock logs:', error);
        }
    };

    const updateStockStatus = async (id: string, newStatus: string) => {
        try {
            const currentLog = stockInLogs.find(l => l.id === id);
            if (!currentLog) return;

            if (currentLog.isLocked) {
                alert(`This item is locked for ${currentLog.remainingHours} more hours.`);
                return;
            }

            // Feature 2: Auto-Move to Inventory on "Received"
            if (newStatus === 'Received' && !currentLog.original_data.moved_to_inventory) {
                const itemData = currentLog.original_data;
                const category = itemData.category || 'Consumables'; 
                
                let targetTable = 'consumables_tbl';
                let nameColumn = 'consumable_name';

                // Normalize category check
                if (category === 'Medicines' || category === 'medicine') {
                    targetTable = 'medicine_tbl';
                    nameColumn = 'medicine_name';
                } else if (category === 'Equipment' || category === 'equipment') {
                    targetTable = 'equipment_tbl';
                    nameColumn = 'equipment_name';
                }

                // Construct payload with dynamic name column
                const payload: any = {
                    [nameColumn]: itemData.item_name,
                    quantity: itemData.quantity,
                    unit_cost: itemData.unit_cost || 0,
                    supplier_name: itemData.supplier, // Updated to match schema
                    // units column removed as it doesn't exist in inventory tables
                    // category removed as it maps to specific type columns (e.g. consumable_type) which are nullable
                };

                // Insert into inventory table
                const { error: moveError } = await supabase
                    .schema('inventory')
                    .from(targetTable)
                    .insert(payload);

                if (moveError) {
                    console.error('Error moving to inventory:', moveError);
                    alert(`Failed to move item to inventory: ${moveError.message}`);
                    return;
                }

                // Mark as moved in stock_in
                await supabase
                    .schema('inventory')
                    .from('stock_in')
                    .update({ moved_to_inventory: true })
                    .eq('id', id);
            }

            const { error } = await supabase
                .schema('inventory')
                .from('stock_in')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Refresh logs to move item between tabs
            fetchStockLogs();

        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredLogs = useMemo(() => {
        let source = [];
        
        if (activeTab === 'out') {
            source = stockOutLogs;
        } else {
            // Active Tab is 'in'
            if (subTab === 'ordered') {
                // Show items that originated as Orders (have lock_until), regardless of status (Pending or Received)
                source = stockInLogs.filter(l => l.original_data.lock_until !== null);
            } else {
                // subTab === 'received' (which user calls "Stock In" tab)
                // Show items that originated as Restocks (no lock_until)
                source = stockInLogs.filter(l => l.original_data.lock_until === null);
            }
        }
        
        const base = source.filter(l => statusFilter === 'All' || l.status === statusFilter)
        
        // Dynamic Lock Calculation based on currentTime
        const processed = base.map(log => {
            const item = log.original_data;
            let isLocked = false;
            let remainingHours = 0;
            let unlockTime = 0;
            const LOCK_DURATION = parseInt(localStorage.getItem('stocklogs.lockMs') || (48 * 60 * 60 * 1000).toString());

            // Check manual overrides first
            if (item.unlock || item.force_unlock) {
                isLocked = false;
            } else if (activeTab === 'in' && subTab === 'ordered') {
                const lockTime = item.lock_until ? new Date(item.lock_until).getTime() : 0;
                const dateObj = item.created_at ? new Date(item.created_at) : null;
                const createdTime = dateObj ? dateObj.getTime() : 0;
                
                // Determine the effective unlock time (earliest of lock_until or created_at + duration)
                if (lockTime > 0 && createdTime > 0) {
                    unlockTime = Math.min(lockTime, createdTime + LOCK_DURATION);
                } else if (lockTime > 0) {
                    unlockTime = lockTime;
                } else if (createdTime > 0) {
                    unlockTime = createdTime + LOCK_DURATION;
                }

                if (unlockTime > 0 && currentTime < unlockTime) {
                    isLocked = true;
                    remainingHours = Math.ceil((unlockTime - currentTime) / (1000 * 60 * 60));
                }
            }
            return { ...log, isLocked, remainingHours, unlockTime };
        });

        return processed
    }, [activeTab, subTab, statusFilter, stockInLogs, stockOutLogs, currentTime])

    const totalToday = useMemo(() => {
        const type = activeTab === 'in' ? 'Stock In' : 'Stock Out'
        const source = activeTab === 'in' ? stockInLogs : stockOutLogs
        return source.filter(l => l.action === type && new Date(l.date).toDateString() === new Date().toDateString()).length
    }, [activeTab, stockInLogs, stockOutLogs])

    // Export to PDF using jsPDF
    function exportToPDF() {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header background
        doc.setFillColor(7, 42, 45); // Dark teal #072a2d
        doc.rect(0, 0, pageWidth, 32, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Stock Logs Report', 14, 15);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const tabLabel = activeTab === 'in' 
            ? (subTab === 'ordered' ? 'Stock In - Ordered' : 'Stock In - Restocked') 
            : 'Stock Out';
        doc.text(`${tabLabel} | ${filteredLogs.length} transactions`, 14, 23);

        // Company name and date on right
        doc.setFontSize(9);
        doc.setTextColor(180, 220, 220);
        doc.setFont('helvetica', 'bold');
        doc.text('MEDICARE DENTAL CLINIC', pageWidth - 14, 12, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated: ${today}`, pageWidth - 14, 19, { align: 'right' });
        
        const timeNow = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(timeNow, pageWidth - 14, 25, { align: 'right' });

        // Prepare table data
        const showStatusColumn = !(activeTab === 'in' && subTab === 'received');
        
        const tableHeaders = showStatusColumn 
            ? ['Date & Time', 'Item', 'User', 'Supplier', 'Reference', activeTab === 'out' ? 'Notes' : 'Status']
            : ['Date & Time', 'Item', 'User', 'Supplier', 'Reference'];

        const tableData = filteredLogs.map(log => {
            const baseData = [
                `${log.date}\n${log.time}`,
                log.item,
                log.user,
                log.supplier || '-',
                log.ref
            ];
            
            if (showStatusColumn) {
                if (activeTab === 'out') {
                    baseData.push(log.note || '-');
                } else {
                    baseData.push(log.isLocked ? 'Ordered' : log.status);
                }
            }
            
            return baseData;
        });

        // Generate table
        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 40,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 4,
                lineColor: [200, 210, 210],
                lineWidth: 0.1,
                textColor: [50, 50, 50],
            },
            headStyles: {
                fillColor: [0, 168, 168], // Teal header
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 5,
            },
            alternateRowStyles: {
                fillColor: [248, 252, 252],
            },
            columnStyles: {
                0: { cellWidth: 35 }, // Date & Time
                1: { cellWidth: 55 }, // Item
                2: { cellWidth: 30 }, // User
                3: { cellWidth: 45 }, // Supplier
                4: { cellWidth: 35 }, // Reference
                5: { cellWidth: showStatusColumn ? 45 : 0 }, // Status/Notes
            },
            willDrawCell: (data) => {
                // Set text colors for status column
                if (data.section === 'body' && data.column.index === 5 && showStatusColumn && activeTab === 'in') {
                    const status = filteredLogs[data.row.index]?.status;
                    const isLocked = filteredLogs[data.row.index]?.isLocked;
                    
                    if (status === 'Received' && !isLocked) {
                        data.cell.styles.textColor = [22, 163, 74]; // Green
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'Pending' || isLocked) {
                        data.cell.styles.textColor = [180, 83, 9]; // Amber
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'Cancelled') {
                        data.cell.styles.textColor = [220, 38, 38]; // Red
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            margin: { top: 40, right: 14, bottom: 25, left: 14 },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 25;
        
        doc.setDrawColor(200, 210, 210);
        doc.setLineWidth(0.3);
        doc.line(14, Math.min(finalY + 8, pageHeight - 18), pageWidth - 14, Math.min(finalY + 8, pageHeight - 18));
        
        doc.setFontSize(8);
        doc.setTextColor(120, 130, 140);
        doc.setFont('helvetica', 'normal');
        doc.text('Medicare Dental Clinic - Inventory Management System', 14, Math.min(finalY + 14, pageHeight - 10));
        
        doc.text('Page 1 of 1', pageWidth - 14, Math.min(finalY + 14, pageHeight - 10), { align: 'right' });

        // Save the PDF
        const filename = `stock-logs-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
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
                        <button onClick={() => setActiveTab('in')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'in' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200')}> <ArrowUp className={cn('w-4 h-4', activeTab === 'in' ? 'text-white' : 'text-emerald-700 dark:text-emerald-300')} /> Stock In</button>
                        <button onClick={() => setActiveTab('out')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'out' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200')}> <ArrowDown className={cn('w-4 h-4', activeTab === 'out' ? 'text-white' : 'text-amber-700 dark:text-amber-300')} /> Stock Out</button>
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
                                                        <div className="text-sm text-slate-600 dark:text-slate-300">{activeTab === 'in' ? 'Stock In today' : 'Stock Out today'}</div>
                                                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalToday}</div>
                                                    </div>
                                                    <div className={cn('p-2 rounded-md inline-flex items-center justify-center', activeTab === 'in' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-800/30 dark:text-amber-200')}>
                                                        {activeTab === 'in' ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
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
                                            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{filteredLogs.length}</div>
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
                                {activeTab === 'in' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button 
                                            onClick={() => setSubTab('ordered')} 
                                            className={cn(
                                                "px-4 py-1 rounded-full text-xs font-medium transition-colors",
                                                subTab === 'ordered' 
                                                    ? "bg-[#00a8a8] text-white shadow-md" 
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            Ordered
                                        </button>
                                        <button 
                                            onClick={() => setSubTab('received')} 
                                            className={cn(
                                                "px-4 py-1 rounded-full text-xs font-medium transition-colors",
                                                subTab === 'received' 
                                                    ? "bg-[#00a8a8] text-white shadow-md" 
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            Stock In
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">Chronological record</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 print:hidden">
                                    <Funnel className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                                        <SelectTrigger size="sm" className="rounded-3xl border border-slate-700 dark:border-slate-700 bg-[#f8faf8] dark:bg-[#082726] px-3 text-sm shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All">All Status</SelectItem>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Received">Received</SelectItem>
                                                    {activeTab === 'out' && <SelectItem value="Completed">Completed</SelectItem>}
                                                </SelectContent>
                                    </Select>
                                </div>
                                <Button size="sm" variant="ghost" className="bg-[#00a8a8] text-white print:hidden" onClick={exportToPDF} aria-label="Export Logs">
                                    <DownloadCloud className="w-4 h-4 mr-2" /> Export Logs
                                </Button>
                            </div>
                        </div>

                        <div id="stock-logs-print" className="w-full overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-100">
                                <thead className="text-xs text-slate-400 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date & Time</th>
                                        <th className="px-4 py-3 font-medium">Item</th>
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium">Supplier</th>
                                        <th className="px-4 py-3 font-medium">Reference</th>
                                        {!(activeTab === 'in' && subTab === 'received') && (
                                            <th className="px-4 py-3 font-medium">{activeTab === 'out' ? 'Notes' : 'Status'}</th>
                                        )}
                                    </tr>
                                </thead>    
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-4 align-middle">
                                                <div className="font-medium text-cyan-500 dark:text-cyan-400 text-sm">{log.date}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                                            </td>
                                            <td className="px-4 py-4 align-middle font-medium text-slate-700 dark:text-slate-200">
                                                {log.item}
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span>{log.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-middle text-slate-600 dark:text-slate-300">
                                                {log.supplier}
                                            </td>
                                            <td className="px-4 py-4 align-middle text-slate-600 dark:text-slate-300">
                                                {log.ref}
                                            </td>
                                            {!(activeTab === 'in' && subTab === 'received') && (
                                                <td className="px-4 py-4 align-middle">
                                                    {activeTab === 'out' ? (
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">{log.note}</span>
                                                    ) : (
                                                        log.isLocked ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-all bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 cursor-not-allowed opacity-90">
                                                                            <Lock className="w-3 h-3" />
                                                                            <span>Ordered</span>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Locked for 48 hours</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <Select value={log.status} onValueChange={(val) => updateStockStatus(log.id, val)}>
                                                                <SelectTrigger className={cn('h-7 w-auto min-w-[100px] text-xs font-medium rounded-full border px-3 transition-all', 
                                                                    log.status === 'Received' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                                                                    log.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                                                                    log.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                                                )}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Pending">Ordered</SelectItem>
                                                                    <SelectItem value="Received">Received</SelectItem>
                                                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )
                                                    )}
                                                </td>
                                            )}
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
