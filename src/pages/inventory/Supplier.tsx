import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import { DownloadCloud, Funnel, Users, Package, Mail, Phone, MapPin, Star, Plus, X, Calendar, CheckCircle } from 'lucide-react'

function SupplierPage() {
    const [activeTab, setActiveTab] = useState<'directory' | 'orders'>('directory')
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState({ name: '', address: '', email: '', phone: '', contact: '', category: '' })

    const initialSuppliers = [
        {
            id: 'SUP001', name: 'MedSupply Co.', address: '123 Medical St, Healthcare City, HC 12345',
            contactName: 'John Smith', contactEmail: 'orders@medsupply.com', contactPhone: '+1 (555) 123-4567',
            category: 'General Supplies', rating: 4.8, totalOrders: 45, lastOrder: '9/20/2024', status: 'Active'
        },
        {
            id: 'SUP002', name: 'PharmaCorp', address: '456 Pharma Ave, Medicine Town, MT 67890',
            contactName: 'Dr. Emily Davis', contactEmail: 'sales@pharmacorp.com', contactPhone: '+1 (555) 987-6543',
            category: 'Pharmaceuticals', rating: 4.9, totalOrders: 28, lastOrder: '9/22/2024', status: 'Active'
        },
        {
            id: 'SUP003', name: 'DentalTech Pro', address: '789 Tech Blvd, Innovation City, IC 13579',
            contactName: 'Michael Chen', contactEmail: 'support@dentaltechpro.com', contactPhone: '+1 (555) 456-7890',
            category: 'Equipment', rating: 4.7, totalOrders: 12, lastOrder: '9/18/2024', status: 'Active'
        },
        {
            id: 'SUP004', name: 'SafeMed Inc.', address: '321 Safety St, Secure City, SC 24680',
            contactName: 'Sarah Wilson', contactEmail: 'orders@safemed.com', contactPhone: '+1 (555) 321-0987',
            category: 'Safety Equipment', rating: 4.6, totalOrders: 8, lastOrder: '8/15/2024', status: 'Inactive'
        },
    ]
    const [suppliers, setSuppliers] = useState(initialSuppliers)

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editForm, setEditForm] = useState<any | null>(null)
    const [editHoverRating, setEditHoverRating] = useState<number | null>(null)
    const [showConfirmRemove, setShowConfirmRemove] = useState(false)
    const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
    const [showConfirmSave, setShowConfirmSave] = useState(false)
    const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false)
    const [showAddSuccess, setShowAddSuccess] = useState(false)
    const [isAddSuccessOpen, setIsAddSuccessOpen] = useState(false)
    const [pendingSaveAction, setPendingSaveAction] = useState<'add'|'edit'|null>(null)
    const [formErrors, setFormErrors] = useState<{ name?: string } | null>(null)

    const purchaseOrders = useMemo(() => ([
        { id: 'PO-2024-0156', items: 'Latex Gloves, Dental Masks', supplier: 'MedSupply Co.', date: '2024-09-20', cost: 245.0 },
        { id: 'PO-2024-0157', items: 'Lidocaine 2%', supplier: 'PharmaCorp', date: '2024-09-22', cost: 186.5 },
        { id: 'PO-2024-0158', items: 'Amalgam Capsules', supplier: 'DentalTech Pro', date: '2024-09-25', cost: 420.8 },
    ]), [])

    function printElementById(id: string, title = 'Supplier') {
        const el = document.getElementById(id)
        if (!el) {
            window.print()
            return
        }
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (!printWindow) return
        const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`).join('')
        const styles = `\n            <style>\n                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 8px; }\n            </style>\n        `
        const tableEl = el.querySelector('table')
        const headerHtml = `<div class="mb-2 font-sans"><h3 class="text-lg mb-2">${title}</h3></div>`
        const bodyHtml = tableEl ? headerHtml + tableEl.outerHTML : el.outerHTML
        printWindow.document.write(`<!doctype html><html><head><title>${title}</title>${styleLinks}${styles}</head><body>${bodyHtml}</body></html>`)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    function handleSaveEdit() {
        if (!editForm) return
        setSuppliers(prev => prev.map(s => s.id === editForm.id ? { ...editForm } : s))
        setIsEditOpen(false)
        setTimeout(() => setShowEditModal(false), 200)
    }

    function handleRemove() {
        if (!editForm) return
        setSuppliers(prev => prev.filter(s => s.id !== editForm.id))
        setIsEditOpen(false)
        setIsConfirmRemoveOpen(false)
        setTimeout(() => setShowEditModal(false), 200)
        setTimeout(() => setShowConfirmRemove(false), 300)
    }

    function performSave() {
        if (pendingSaveAction === 'add') {
            const newSupplier = {
                id: `SUP${Date.now()}`,
                name: form.name,
                address: form.address,
                contactName: form.contact,
                contactEmail: form.email,
                contactPhone: form.phone,
                category: form.category || 'General Supplies',
                rating: 0,
                totalOrders: 0,
                lastOrder: '',
                status: 'Active'
            }
            setSuppliers(prev => [newSupplier, ...prev])
            setIsAddOpen(false)
            setIsConfirmSaveOpen(false)
            setTimeout(() => setShowConfirmSave(false), 200)
            setTimeout(() => setShowAddModal(false), 300)
            // show success modal for add
            setShowAddSuccess(true)
            setTimeout(() => setIsAddSuccessOpen(true), 10)
            setForm({ name: '', address: '', email: '', phone: '', contact: '', category: '' })
        } else if (pendingSaveAction === 'edit') {
            handleSaveEdit()
            setIsConfirmSaveOpen(false)
            setTimeout(() => setShowConfirmSave(false), 200)
        }
        setPendingSaveAction(null)
        setShowConfirmSave(false)
    }

    return (
        <div className="px-6 md:px-12">
            <div className="w-full max-w-screen-2xl mx-auto space-y-6">
                <Card className="w-full py-3 -mt-2">
                    <CardHeader className="px-6 py-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl mb-0 flex items-center gap-3 text-slate-900 dark:text-slate-100">
                                    Supplier
                                </CardTitle>
                                <p className="text-muted-foreground">Manage your suppliers and vendor information</p>
                            </div>
                            <div className="flex items-center gap-2">
                                                <Button size="sm" className="bg-[#00a8a8] text-white" onClick={() => { setShowAddModal(true); setTimeout(() => setIsAddOpen(true), 10) }}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Supplier
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Tabs - mimic the look of Stock Logs */}
                <div className="w-full max-w-screen-2xl mx-auto px-6 flex justify-center mt-2 z-10">
                    <div className="w-full flex rounded-[20px] bg-slate-50 dark:bg-[#0f2b2b] items-center h-[44px] shadow-sm">
                        <button onClick={() => setActiveTab('directory')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'directory' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200')}> Supplier Directory</button>
                        <button onClick={() => setActiveTab('orders')} className={cn('w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2', activeTab === 'orders' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200')}> Purchase Orders</button>
                    </div>
                </div>

                <div className="w-full -mt-3">
                    <div className="pt-4 pb-4">
                        <div className="grid grid-cols-1 gap-6">
                            {activeTab === 'directory' ? (
                                <Card>
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Supplier Directory <span className="text-sm text-slate-400 dark:text-slate-300">({suppliers.length})</span></div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">Directory</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-slate-500 dark:text-slate-300">&nbsp;</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <div className="flex items-center justify-end gap-2 mb-3 print:hidden">
                                                <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-300"><Funnel className="w-4 h-4" /> <span className="text-xs dark:text-slate-200">Filter</span></div>
                                                <Button size="sm" variant="ghost" className="bg-[#00a8a8] text-white" onClick={() => printElementById('supplier-directory-print', 'Supplier Directory')}>
                                                    <DownloadCloud className="w-4 h-4 mr-2" /> Export
                                                </Button>
                                            </div>
                                            <div id="supplier-directory-print">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                                    <thead className="bg-transparent">
                                                        <tr className="text-xs text-slate-400 dark:text-slate-300">
                                                            <th className="pl-6 py-4 text-left">Supplier</th>
                                                            <th className="px-6 py-4 text-left">Contact</th>
                                                            <th className="px-6 py-4 text-left">Category</th>
                                                            <th className="px-6 py-4 text-left">Rating</th>
                                                            <th className="px-6 py-4 text-left">Total Orders</th>
                                                            <th className="px-6 py-4 text-left">Last Order</th>
                                                            <th className="px-6 py-4 text-left">Status</th>
                                                            <th className="pr-6 py-4 text-left">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-slate-800">
                                                        {suppliers.map((s, idx) => (
                                                            <tr key={s.id} className={cn('group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors', idx === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-transparent')}>
                                                                <td className="pl-6 py-6 text-sm text-slate-700 dark:text-slate-200">
                                                                    <div className="font-medium">{s.name}</div>
                                                                    <div className="text-xs text-slate-400 dark:text-slate-300 mt-1 flex items-center gap-2"><MapPin className="w-3 h-3" /> {s.address}</div>
                                                                </td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">
                                                                    <div className="font-medium">{s.contactName}</div>
                                                                    <div className="text-xs text-slate-400 dark:text-slate-300 mt-1 flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> <span className="truncate">{s.contactEmail}</span></div>
                                                                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> <span>{s.contactPhone}</span></div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">{s.category}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200 align-middle">
                                                                    <div className="flex items-center gap-2 h-full">
                                                                        <span className="leading-none">{s.rating}</span>
                                                                        <Star className="w-4 h-4 text-amber-400 self-center" />
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">{s.totalOrders}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">{s.lastOrder}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">
                                                                    <div className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold', s.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200')}>{s.status}</div>
                                                                </td>
                                                                <td className="pr-6 py-6 text-sm text-slate-700 dark:text-slate-200 text-right">
                                                                    <Button size="sm" variant="ghost" className="rounded-md border border-slate-200 dark:border-slate-700 dark:text-slate-200" onClick={() => {
                                                                        setEditForm({ ...s })
                                                                        setShowEditModal(true)
                                                                        setTimeout(() => setIsEditOpen(true), 10)
                                                                    }}>Edit</Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Purchase Orders <span className="text-sm text-slate-400 dark:text-slate-300">({purchaseOrders.length} Orders)</span></div>
                                                            <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">Quantity</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-slate-500 dark:text-slate-300">&nbsp;</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <div className="flex items-center justify-end gap-2 mb-3 print:hidden">
                                                <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-300"><Funnel className="w-4 h-4" /> <span className="text-xs dark:text-slate-200">Filter</span></div>
                                                <Button size="sm" variant="ghost" className="bg-[#00a8a8] text-white" onClick={() => printElementById('purchase-orders-print', 'Purchase Orders')}>
                                                    <DownloadCloud className="w-4 h-4 mr-2" /> Export
                                                </Button>
                                            </div>
                                            <div id="purchase-orders-print">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                                    <thead className="bg-transparent">
                                                        <tr className="text-xs text-slate-400 dark:text-slate-300">
                                                            <th className="pl-6 py-4 text-left">Order ID</th>
                                                            <th className="px-6 py-4 text-left">Item Name</th>
                                                            <th className="px-6 py-4 text-left">Supplier</th>
                                                            <th className="px-6 py-4 text-left">Date Delivered</th>
                                                            <th className="pr-6 py-4 text-left">Total Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-slate-800">
                                                        {purchaseOrders.map((po, idx) => (
                                                            <tr key={po.id} className={cn('group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors', idx === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-transparent')}>
                                                                <td className="pl-6 py-6 text-sm text-slate-700 dark:text-slate-200">{po.id}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200 whitespace-normal">{po.items}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">{po.supplier}</td>
                                                                <td className="px-6 py-6 text-sm text-slate-700 dark:text-slate-200">{po.date}</td>
                                                                <td className="pr-6 py-6 text-sm text-slate-700 dark:text-slate-200">{formatCurrency(po.cost)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Add Supplier Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isAddOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsAddOpen(false); setTimeout(() => setShowAddModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isAddOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[600px] m-4 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-[#00a8a8] px-4 py-3 text-white">
                                <div className="flex items-center gap-3">
                                    <Plus className="w-5 h-5" />
                                    <div className="text-lg font-semibold">Add Supplier</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setIsAddOpen(false); setTimeout(() => setShowAddModal(false), 200) }}>
                                        <X className="w-5 h-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field orientation="vertical">
                                        <FieldLabel>Supplier Name</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Supplier Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                            {!form.name?.trim() && formErrors?.name && (
                                                <p className="text-xs mt-1 text-red-500">{formErrors.name}</p>
                                            )}
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Contact Person</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field orientation="vertical">
                                        <FieldLabel>Address</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Email Address</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field orientation="vertical">
                                        <FieldLabel>Contact Number</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Contact Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Company Address</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Address" />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field orientation="vertical">
                                        <FieldLabel>Category</FieldLabel>
                                        <FieldContent>
                                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                                <SelectTrigger size="sm" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a4748] px-3">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General Supplies">General Supplies</SelectItem>
                                                    <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                </div>
                            </CardContent>
                            <CardContent className="flex items-center justify-end gap-3 py-4">
                                <Button variant="outline" onClick={() => { setIsAddOpen(false); setTimeout(() => setShowAddModal(false), 200) }}>Cancel</Button>
                                <Button
                                    onClick={() => {
                                        if (!form.name?.trim()) { setFormErrors({ name: 'Supplier name is required' }); return }
                                        setFormErrors(null)
                                        setPendingSaveAction('add')
                                        setShowConfirmSave(true)
                                        setTimeout(() => setIsConfirmSaveOpen(true), 10)
                                    }}
                                    className={cn('bg-[#00a8a8] text-white', !form.name?.trim() ? 'opacity-50 cursor-not-allowed' : '')}
                                >Save</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {/* Edit Supplier Modal */}
            {showEditModal && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isEditOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsEditOpen(false); setTimeout(() => setShowEditModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isEditOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[600px] m-4 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-[#00a8a8] px-4 py-3 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="text-lg font-semibold">Edit Action</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setIsEditOpen(false); setTimeout(() => setShowEditModal(false), 200) }}>
                                        <X className="w-5 h-5 text-white" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Supplier Information</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field orientation="vertical">
                                        <FieldLabel>Supplier Name</FieldLabel>
                                        <FieldContent>
                                                <Input placeholder="Supplier Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                                {!editForm?.name?.trim() && (
                                                    <p className="text-xs mt-1 text-red-500">Supplier name is required</p>
                                                )}
                                            </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Contact Person</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Contact Person" value={editForm.contactName || editForm.contact} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value, contact: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field orientation="vertical">
                                        <FieldLabel>Contact Number</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Contact Number" value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Email Address</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Email Address" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field orientation="vertical">
                                        <FieldLabel>Category</FieldLabel>
                                        <FieldContent>
                                            <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                                                <SelectTrigger size="sm" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a4748] px-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="General Supplies">General Supplies</SelectItem>
                                                    <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Company Address</FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div>
                                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Ratings</div>
                                        <div className="flex items-center gap-1">
                                            {[1,2,3,4,5].map(i => (
                                                <Star
                                                    key={i}
                                                    className={cn('w-5 h-5 cursor-pointer', (editHoverRating ?? editForm.rating ?? 0) >= i ? 'text-amber-400' : 'text-slate-300')}
                                                    onMouseEnter={() => { setEditHoverRating(i); setEditForm({ ...editForm, rating: i }) }}
                                                    onMouseLeave={() => setEditHoverRating(null)}
                                                    onClick={() => setEditForm({ ...editForm, rating: i })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Field orientation="vertical">
                                            <FieldLabel>Status</FieldLabel>
                                            <FieldContent>
                                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                                    <SelectTrigger size="sm" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0a4748] px-3">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Active">Active</SelectItem>
                                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FieldContent>
                                        </Field>
                                    </div>
                                </div>
                            </CardContent>
                            <CardContent className="flex items-center justify-end gap-3 py-4">
                                <Button variant="outline" onClick={() => { setIsEditOpen(false); setTimeout(() => setShowEditModal(false), 200) }}>Cancel</Button>
                                <Button onClick={() => {
                                    if (!editForm?.name?.trim()) return
                                    setPendingSaveAction('edit')
                                    setShowConfirmSave(true)
                                    setTimeout(() => setIsConfirmSaveOpen(true), 10)
                                }} className={cn('bg-[#00a8a8] text-white', !editForm?.name?.trim() ? 'opacity-50 cursor-not-allowed' : '')}>Save</Button>
                                <Button className="bg-red-600 text-white" onClick={() => { setShowConfirmRemove(true); setTimeout(() => setIsConfirmRemoveOpen(true), 10) }}>Remove</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {/* Confirm Remove Modal */}
            {showConfirmRemove && editForm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isConfirmRemoveOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsConfirmRemoveOpen(false); setTimeout(() => setShowConfirmRemove(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isConfirmRemoveOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[420px] m-4 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-[#00a8a8] px-4 py-3 text-white">
                                <div></div>
                                <Button variant="ghost" size="sm" onClick={() => { setIsConfirmRemoveOpen(false); setTimeout(() => setShowConfirmRemove(false), 200) }}>
                                    <X className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center border-2 border-red-600 text-red-600 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-lg font-semibold mb-2">Are you sure you want to remove {editForm.name}?</div>
                                <div className="text-sm text-slate-500 mb-6">This action cannot be undone.</div>
                                <div className="flex items-center gap-3 justify-center">
                                    <Button className="bg-red-600 text-white" onClick={() => { handleRemove(); setIsConfirmRemoveOpen(false); setTimeout(() => setShowConfirmRemove(false), 200) }}>Remove</Button>
                                    <Button variant="outline" onClick={() => { setIsConfirmRemoveOpen(false); setTimeout(() => setShowConfirmRemove(false), 200) }}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {/* Confirm Save Modal */}
            {showConfirmSave && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isConfirmSaveOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsConfirmSaveOpen(false); setTimeout(() => setShowConfirmSave(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isConfirmSaveOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[420px] m-4 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-[#00a8a8] px-4 py-3 text-white">
                                <div></div>
                                <Button variant="ghost" size="sm" onClick={() => { setIsConfirmSaveOpen(false); setTimeout(() => setShowConfirmSave(false), 200) }}>
                                    <X className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm1 15H11v-2h2v2zm0-4H11V7h2v6z" />
                                    </svg>
                                </div>
                                <div className="text-lg font-semibold mb-2">
                                    {pendingSaveAction === 'add' ? `Are you sure you want to add ${form.name || 'this supplier'}?` : `Are you sure you want to save changes to ${editForm?.name || ''}?`}
                                </div>
                                <div className="text-sm text-slate-500 mb-6">Please confirm that you want to save this supplier information.</div>
                                <div className="flex items-center gap-3 justify-center">
                                    <Button className="bg-[#00a8a8] text-white" onClick={() => performSave()}>Confirm</Button>
                                    <Button variant="outline" onClick={() => { setIsConfirmSaveOpen(false); setTimeout(() => setShowConfirmSave(false), 200) }}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {/* Add Success Modal */}
            {showAddSuccess && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isAddSuccessOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsAddSuccessOpen(false); setTimeout(() => setShowAddSuccess(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isAddSuccessOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[420px] m-4 rounded-lg overflow-hidden bg-white shadow-lg">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div></div>
                                <button aria-label="close" onClick={() => { setIsAddSuccessOpen(false); setTimeout(() => setShowAddSuccess(false), 200) }}>
                                    <X className="w-5 h-5 text-slate-700" />
                                </button>
                            </div>
                            <CardContent className="p-6 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-emerald-400 text-white mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div className="text-lg font-semibold mb-2 text-slate-900">Supplier Added Successfully</div>
                                <div className="text-sm text-slate-600 mb-6">Supplier Name has been successfully added.</div>
                                <div className="flex items-center gap-3 justify-center">
                                    <Button className="bg-[#00a8a8] text-white" onClick={() => { setIsAddSuccessOpen(false); setTimeout(() => setShowAddSuccess(false), 200) }}>Done</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SupplierPage;