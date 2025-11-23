import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, MessageSquare, List, MoreHorizontal } from 'lucide-react'
import { X, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// framer-motion removed — use simple transitions for now
import { useEffect } from 'react';

const inventoryData = {
    Consumables: [
        { id: 'SUP001', name: 'Latex Gloves (Medium)', quantity: '45 boxes', exp: '12/15/2024', supplier: 'MedSupply Co.', unitCost: 2.5, status: 'Critical' },
        { id: 'SUP002', name: 'Dental Masks', quantity: '78 boxes', exp: '03/20/2025', supplier: 'DentalCare Ltd.', unitCost: 1.8, status: 'Low Stock' },
        { id: 'SUP003', name: 'Disposable Syringes', quantity: '22 packs', exp: '06/10/2025', supplier: 'SafeMed Inc', unitCost: 0.85, status: 'In Stock' },
    ],
    Medicines: [
        { id: 'MED001', name: 'Ibuprofen 200mg', quantity: '120 tablets', exp: '09/01/2026', supplier: 'PharmaDirect', unitCost: 6.0, status: 'In Stock' },
        { id: 'MED002', name: 'Amoxicillin 500mg', quantity: '60 capsules', exp: '02/14/2026', supplier: 'Medico Supplies', unitCost: 12.5, status: 'Low Stock' },
        { id: 'MED003', name: 'Paracetamol Syrup', quantity: '15 bottles', exp: '07/30/2025', supplier: 'HealthFirst', unitCost: 3.2, status: 'Critical' },
    ],
    Equipment: [
        { id: 'EQ001', name: 'Dental Drill', quantity: '2 units', exp: 'N/A', supplier: 'DentalTech', unitCost: 450.0, status: 'In Stock' },
        { id: 'EQ002', name: 'X-Ray Film', quantity: '50 sheets', exp: '11/11/2026', supplier: 'RadiologyPro', unitCost: 35.0, status: 'Low Stock' },
        { id: 'EQ003', name: 'Sterilizer', quantity: '1 unit', exp: 'N/A', supplier: 'CleanMed', unitCost: 800.0, status: 'Critical' },
    ],
};

export default function InventoryTable() {
    const [activeTab, setActiveTab] = useState<'Consumables' | 'Medicines' | 'Equipment'>('Consumables');
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({ item: '', supplier: '', quantity: '', unit: '', unitCost: '' })
    const [inventory, setInventory] = useState(inventoryData);
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [actionMode, setActionMode] = useState<'edit' | 'select'>('edit');
    // single selected item id handled previously; replaced by `selectedIds` for bulk
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingItem, setEditingItem] = useState<any | null>(null);
        const [isStockModalOpen, setIsStockModalOpen] = useState(false);
        const [stockStage, setStockStage] = useState<'selected' | 'summary' | 'success'>('selected');
        const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
        const [isStockSuccessOpen, setIsStockSuccessOpen] = useState(false);
        const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
        const [restockStage, setRestockStage] = useState<'selected' | 'success'>('selected');
        const [restockQuantities, setRestockQuantities] = useState<Record<string, number>>({});
        const [isRestockSuccessOpen, setIsRestockSuccessOpen] = useState(false);

    const renderStatusBadge = (status: string) => {
        const base = 'inline-flex items-center rounded-full px-3 h-6 text-xs font-semibold tracking-wide';
        const cls = status === 'Critical'
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-200'
            : status === 'Low Stock'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200';
        return <span className={`${base} ${cls}`}>{status}</span>;
    };

    // toggle select single id
    function toggleSelectId(id: string) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    // bulk change status for selected ids
    function bulkChangeStatus(newStatus: string) {
        if (selectedIds.length === 0) return
        setInventory((prev: any) => {
            const updated: any = {}
            Object.keys(prev).forEach((key) => {
                updated[key] = prev[key].map((it: any) => selectedIds.includes(it.id) ? { ...it, status: newStatus } : it)
            })
            return updated
        })
        setSelectedIds([])
    }

        function openStockOut() {
            if (selectedIds.length === 0) return
            // set default quantities to 1 for each selected item
            const defaults: Record<string, number> = {}
            selectedIds.forEach(id => defaults[id] = 1)
            setStockQuantities(defaults)
            setStockStage('selected')
            setIsStockModalOpen(true)
        }

        function openRestock() {
            if (selectedIds.length === 0) return
            const defaults: Record<string, number> = {}
            selectedIds.forEach(id => defaults[id] = 1)
            setRestockQuantities(defaults)
            setRestockStage('selected')
            setIsRestockModalOpen(true)
        }

    const tabList = ['Consumables', 'Medicines', 'Equipment'] as const;
    const items = inventory[activeTab];
    const filteredItems = items.filter((it: any) => selectedStatus === 'All Status' ? true : it.status === selectedStatus);
    const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((it:any) => selectedIds.includes(it.id));

    const allItems = (Object.values(inventory) as any[]).flat();
    const selectedItems = allItems.filter(it => selectedIds.includes(it.id));

    useEffect(() => {
        // clear selection when switching tabs or when switching out of select mode
        if (actionMode !== 'select') setSelectedIds([])
    }, [actionMode])

    // DO NOT clear `selectedIds` on tab switch so selection persists across tabs

    return (
        <div className="space-y-6 px-6 pb-8">
            {/* Header */}
            <Card className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#04282a] dark:to-[#072a2d] shadow-lg">
                <CardHeader className="px-6 py-3">
                    <div className="flex w-full items-start justify-between gap-6">
                        <div className="space-y-0.5">
                            <CardTitle className="text-3xl tracking-widest text-cyan-700 dark:text-cyan-300 flex items-center gap-3">
                                <List className="w-7 h-7 text-cyan-700 dark:text-cyan-300" />
                                Inventory Table
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Manage your dental supplies and item inventory</CardDescription>
                        </div>
                            <div className="flex items-center gap-1.5">
                            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                                <SelectTrigger size="sm" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a4748] px-3 font-semibold text-cyan-700 dark:text-cyan-100 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Status">All Status</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="In Stock">In Stock</SelectItem>
                                </SelectContent>
                            </Select>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a4748] px-3 font-semibold text-cyan-700 dark:text-cyan-100 shadow-sm">Quick Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuRadioGroup value={actionMode} onValueChange={(v) => setActionMode(v as 'edit' | 'select')}>
                                        <DropdownMenuRadioItem value="edit">Edit</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="select">Select</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="sm" className="p-2" aria-label="Notifications">
                                <Bell className="text-slate-700 dark:text-slate-300" size={20} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Table + Tabs */}
            <Card className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#071a1b] shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-hidden rounded-t-3xl">
                        <div className="px-10 pt-8">
                            {/* Tabs */}
                            <div className="mb-5 rounded-2xl bg-slate-100 dark:bg-[#063338]/60 px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-300">
                                <div className="flex items-center justify-center gap-14">
                                    {tabList.map(tab => (
                                        <button
                                            key={tab}
                                            className={cn(
                                                activeTab === tab
                                                    ? 'text-cyan-300 font-bold underline underline-offset-4'
                                                    : 'text-slate-700/80 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-200',
                                                'tracking-[0.35em]'
                                            )}
                                            onClick={() => setActiveTab(tab)}
                                            tabIndex={0}
                                            aria-current={activeTab === tab ? 'page' : undefined}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
                                <thead className="bg-slate-50 dark:bg-[#041017] text-[11px] uppercase tracking-[0.35em] text-slate-600 dark:text-slate-400">
                                    <tr className="align-middle">
                                        <th scope="col" className="px-4 py-4 text-left">
                                            {actionMode === 'select' ? (
                                                    <input
                                                    type="checkbox"
                                                    aria-label="select-all"
                                                    checked={allFilteredSelected}
                                                    onChange={() => {
                                                        if (allFilteredSelected) setSelectedIds(prev => prev.filter(id => !filteredItems.some((f:any) => f.id === id)))
                                                        else setSelectedIds(prev => Array.from(new Set([...prev, ...filteredItems.map((it:any) => it.id)])))
                                                    }}
                                                    className="rounded border-slate-200 dark:border-slate-600 bg-transparent text-cyan-700 dark:text-cyan-400"
                                                />
                                            ) : null}
                                        </th>
                                        <th scope="col" className="px-8 py-4 font-medium">Item</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Quantity</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Expiration Date</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Supplier</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Unit Cost</th>
                                        <th scope="col" className="px-6 py-4 font-medium">Status</th>
                                        <th scope="col" className="px-6 py-4" aria-label="Notes"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071a1b] text-slate-800 dark:text-slate-200 transition-colors ${selectedIds.includes(item.id) ? 'ring-2 ring-cyan-600 dark:bg-[#0b2f31]' : 'hover:bg-slate-50 dark:hover:bg-[#092325]'}`}
                                        >
                                            <td className="px-8 py-5 font-semibold align-middle">
                                                {actionMode === 'select' && (
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`select-${item.id}`}
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => toggleSelectId(item.id)}
                                                        className="mr-3 align-middle rounded border-slate-200 dark:border-slate-600 bg-transparent text-cyan-700 dark:text-cyan-400"
                                                    />
                                                )}
                                                <div className="text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                                                <div className="mt-1 text-xs tracking-wide text-slate-500 dark:text-slate-400">{item.id}</div>
                                            </td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">{item.quantity}</td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">{item.exp}</td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300">{item.supplier}</td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatCurrency(item.unitCost)}</td>
                                            <td className="px-6 py-5 align-middle">{renderStatusBadge(item.status)}</td>
                                            <td className="px-6 py-5 align-middle text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare size={16} className="text-slate-700 dark:text-slate-300" />
                                                    <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="p-1 text-slate-700 dark:text-slate-300"><MoreHorizontal size={16} /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuRadioGroup value={actionMode} onValueChange={(v) => {
                                                                const mode = v as 'edit' | 'select'
                                                                setActionMode(mode)
                                                                if (mode === 'edit') setEditingItem(item)
                                                                if (mode === 'select') toggleSelectId(item.id)
                                                            }}>
                                                                <DropdownMenuRadioItem value="edit">Edit</DropdownMenuRadioItem>
                                                                <DropdownMenuRadioItem value="select">Select</DropdownMenuRadioItem>
                                                            </DropdownMenuRadioGroup>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer legend + actions */}
                    <div className="flex flex-col gap-5 rounded-b-3xl bg-white dark:bg-[#071a1b] px-10 py-8">
                        <div className="flex flex-wrap items-center gap-7 text-xs text-slate-700 dark:text-slate-300">
                            <button onClick={() => setSelectedStatus('Critical')} className="flex items-center gap-2"><span className="inline-flex h-2 w-2 rounded-full bg-red-500" />Critical</button>
                            <button onClick={() => setSelectedStatus('Low Stock')} className="flex items-center gap-2"><span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />Low Stock</button>
                            <button onClick={() => setSelectedStatus('In Stock')} className="flex items-center gap-2"><span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />In Stock</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="ghost" size="sm" className="rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0b4f50] px-5 text-cyan-700 dark:text-cyan-100 shadow-sm" onClick={() => setIsNewOrderOpen(true)}>New Order</Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={selectedIds.length === 0 || actionMode !== 'select'
                                    ? 'rounded-full border border-slate-200 dark:border-slate-700 px-5 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    : 'rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0b4f50] px-5 text-cyan-700 dark:text-cyan-100 shadow-sm'}
                                onClick={() => { if (selectedIds.length > 0 && actionMode === 'select') openStockOut() }}
                                disabled={selectedIds.length === 0 || actionMode !== 'select'}
                            >Stock out</Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={selectedIds.length === 0 || actionMode !== 'select'
                                    ? 'rounded-full border border-slate-200 dark:border-slate-700 px-5 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                    : 'rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0b4f50] px-5 text-cyan-700 dark:text-cyan-100 shadow-sm'}
                                onClick={() => { if (selectedIds.length > 0 && actionMode === 'select') openRestock() }}
                                disabled={selectedIds.length === 0 || actionMode !== 'select'}
                            >Restock</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-4 bg-black/50" onClick={() => setEditingItem(null)}>
                    <Card className="w-full max-w-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] rounded-t-2xl px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Edit Item</h3>
                            <button className="text-white" onClick={() => setEditingItem(null)} aria-label="Close">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field orientation="vertical">
                                    <FieldLabel>Item Name</FieldLabel>
                                    <FieldContent>
                                        <Input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} />
                                    </FieldContent>
                                </Field>
                                <Field orientation="vertical">
                                    <FieldLabel>Quantity</FieldLabel>
                                    <FieldContent>
                                        <Input value={editingItem.quantity} onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })} />
                                    </FieldContent>
                                </Field>
                            </div>
                        </CardContent>
                        <CardContent className="flex justify-end gap-2 pt-0">
                            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                            <Button onClick={() => {
                                setInventory((prev: any) => ({
                                    ...prev,
                                    [activeTab]: prev[activeTab].map((it: any) => it.id === editingItem.id ? editingItem : it)
                                }))
                                setEditingItem(null)
                            }}>Save</Button>
                        </CardContent>
                    </Card>
                </div>
                
            )}

            {/* Stock Out Success */}
            {isStockSuccessOpen && (
                <div className="fixed inset-0 z-60 flex items-start justify-center pt-20 px-4 bg-black/50" onClick={() => setIsStockSuccessOpen(false)}>
                    <Card className="rounded-2xl w-full max-w-md text-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-200" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">Items Successfully Stocked Out!</h3>
                            <p className="text-sm text-muted-foreground mt-2">The items you selected have been recorded successfully.</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsStockSuccessOpen(false)}>Done</Button>
                            </div>
                        </CardContent>
                        <button className="absolute top-4 right-4 text-slate-500" onClick={() => setIsStockSuccessOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </Card>
                </div>
            )}

            {/* New Order Modal */}
            {isNewOrderOpen && (
                
                    <div
                        className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-4 bg-black/50"
                        onClick={() => setIsNewOrderOpen(false)}
                    >
                    <Card className="w-full max-w-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] rounded-t-2xl px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">New Order</h3>
                            <button className="text-white" onClick={() => setIsNewOrderOpen(false)} aria-label="Close">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field orientation="vertical">
                                    <FieldLabel>Item Name</FieldLabel>
                                    <FieldContent>
                                        <Input placeholder="Dental Chair" value={newOrder.item} onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })} />
                                    </FieldContent>
                                </Field>
                                <Field orientation="vertical">
                                    <FieldLabel>Supplier Name</FieldLabel>
                                    <FieldContent>
                                        <Select onValueChange={(v) => setNewOrder({ ...newOrder, supplier: v })}>
                                            <SelectTrigger size="sm">
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MedSupply Co.">MedSupply Co.</SelectItem>
                                                <SelectItem value="DentalCare Ltd.">DentalCare Ltd.</SelectItem>
                                                <SelectItem value="SafeMed Inc">SafeMed Inc</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field orientation="vertical">
                                    <FieldLabel>Quantity</FieldLabel>
                                    <FieldContent>
                                        <Input placeholder="100" value={newOrder.quantity} onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })} />
                                    </FieldContent>
                                </Field>
                                <Field orientation="vertical">
                                    <FieldLabel>Units</FieldLabel>
                                    <FieldContent>
                                        <Select onValueChange={(v) => setNewOrder({ ...newOrder, unit: v })}>
                                            <SelectTrigger size="sm">
                                                <SelectValue placeholder="Select units" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="boxes">boxes</SelectItem>
                                                <SelectItem value="packs">packs</SelectItem>
                                                <SelectItem value="units">units</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>
                                <Field orientation="vertical">
                                    <FieldLabel>Unit Cost</FieldLabel>
                                    <FieldContent>
                                        <Input placeholder={formatCurrency(2.98)} value={newOrder.unitCost} onChange={(e) => setNewOrder({ ...newOrder, unitCost: e.target.value })} />
                                    </FieldContent>
                                </Field>
                            </div>
                        </CardContent>
                        <CardContent className="flex justify-end gap-2 pt-0">
                            <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>Cancel</Button>
                            <Button onClick={() => {
                                setIsNewOrderOpen(false)
                                setIsSuccessOpen(true)
                            }}>Save</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Success Modal */}
            {isSuccessOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50" onClick={() => setIsSuccessOpen(false)}>
                    <Card className="rounded-2xl w-full max-w-md text-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-200" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">New Order Successful!</h3>
                            <p className="text-sm text-muted-foreground mt-2">The item you inputted has been successfully saved.</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsSuccessOpen(false)}>Done</Button>
                            </div>
                        </CardContent>
                        <button className="absolute top-4 right-4 text-slate-500" onClick={() => setIsSuccessOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </Card>
                </div>
            )}

            {/* Stock Out Modal */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/50">
                    <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-popover shadow-lg transition-transform duration-150 transform scale-100">
                        <div className="bg-[#00a8a8] px-6 py-4 flex items-center justify-between text-white">
                            <h3 className="text-lg font-semibold">Stock Out</h3>
                            <button onClick={() => setIsStockModalOpen(false)} aria-label="Close">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <CardContent>
                            {stockStage === 'selected' && (
                                <div>
                                    <h4 className="font-semibold mb-2">Selected Item</h4>
                                    <div className="space-y-2">
                                        {selectedItems.map(it => (
                                            <div key={it.id} className="flex items-center justify-between gap-4 border rounded p-3">
                                                <div>
                                                    <div className="font-semibold">{it.name}</div>
                                                    <div className="text-xs text-slate-400">{it.id}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">{it.status}</div>
                                                    <Input type="number" value={stockQuantities[it.id] ?? 1} onChange={(e) => setStockQuantities(prev => ({ ...prev, [it.id]: Number(e.target.value) }))} className="w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-4 gap-2">
                                        <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
                                        <Button onClick={() => setStockStage('summary')}>Next</Button>
                                    </div>
                                </div>
                            )}
                            {stockStage === 'summary' && (
                                <div>
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <table className="w-full text-sm text-slate-800 dark:text-slate-200">
                                        <thead className="text-xs text-slate-600 dark:text-slate-400">
                                            <tr>
                                                <th>Item Name</th>
                                                <th className="text-right">Remaining</th>
                                                <th className="text-right">Stock Out</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItems.map(it => (
                                                <tr key={it.id} className="border-b">
                                                    <td className="py-2">{it.name}<div className="text-xs text-slate-400">{it.id}</div></td>
                                                    <td className="py-2 text-right">{it.quantity}</td>
                                                    <td className="py-2 text-right">{stockQuantities[it.id]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end mt-4 gap-2">
                                        <Button variant="outline" onClick={() => setStockStage('selected')}>Back</Button>
                                        <Button onClick={() => { bulkChangeStatus('Low Stock'); setStockStage('success'); setIsStockModalOpen(false); setIsStockSuccessOpen(true); }}>Stock out</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            <AnimatePresence>
                {isRestockModalOpen && (
                    <motion.div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <motion.div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-popover shadow-lg"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                        >
                        <div className="bg-[#00a8a8] px-6 py-4 flex items-center justify-between text-white">
                            <h3 className="text-lg font-semibold">Restock</h3>
                            <button onClick={() => setIsRestockModalOpen(false)} aria-label="Close">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <CardContent>
                            {restockStage === 'selected' && (
                                <div>
                                    <h4 className="font-semibold mb-2">Selected Item</h4>
                                    <div className="space-y-2">
                                        {selectedItems.map(it => (
                                            <div key={it.id} className="flex items-center justify-between gap-4 border rounded p-3">
                                                <div>
                                                    <div className="font-semibold">{it.name}</div>
                                                    <div className="text-xs text-slate-400">{it.id}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">{it.status}</div>
                                                    <Input type="number" value={restockQuantities[it.id] ?? 1} onChange={(e) => setRestockQuantities(prev => ({ ...prev, [it.id]: Number(e.target.value) }))} className="w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-4 gap-2">
                                        <Button variant="outline" onClick={() => setIsRestockModalOpen(false)}>Cancel</Button>
                                        <Button onClick={() => { bulkChangeStatus('In Stock'); setIsRestockModalOpen(false); setIsRestockSuccessOpen(true); }}>Restock Now</Button>
                                    </div>
                                </div>
                            )}
                            {/* Removed the summary step - out of Restock flow per request */}
                        </CardContent>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Restock Success */}
            {isRestockSuccessOpen && (
                <div className="fixed inset-0 z-60 flex items-start justify-center pt-20 px-4 bg-black/50" onClick={() => setIsRestockSuccessOpen(false)}>
                    <Card className="rounded-2xl w-full max-w-md text-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-200" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">Items Successfully Restocked!</h3>
                            <p className="text-sm text-muted-foreground mt-2">The items you selected have been restocked.</p>
                            <div className="mt-6">
                                <Button onClick={() => setIsRestockSuccessOpen(false)}>Done</Button>
                            </div>
                        </CardContent>
                        <button className="absolute top-4 right-4 text-slate-500" onClick={() => setIsRestockSuccessOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
}
