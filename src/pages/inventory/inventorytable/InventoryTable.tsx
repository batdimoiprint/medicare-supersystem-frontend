import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, MessageSquare, List, Minus, Plus } from 'lucide-react'
import { X, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatCurrency } from '@/lib/utils'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'

import { useState } from 'react';
// framer-motion removed — use simple transitions for now
import { useEffect } from 'react';
import supabase from '@/utils/supabase';

export default function InventoryTable() {
    const [activeTab, setActiveTab] = useState<'Consumables' | 'Medicines' | 'Equipment'>('Consumables');
    
    // New Order Modal State
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({ item: '', supplier: '', quantity: '', unit: '', unitCost: '' })
    const [inventory, setInventory] = useState<{
        Consumables: any[];
        Medicines: any[];
        Equipment: any[];
    }>({
        Consumables: [],
        Medicines: [],
        Equipment: [],
    });
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [actionMode, setActionMode] = useState<'view' | 'edit' | 'select'>('view');
    // single selected item id handled previously; replaced by `selectedIds` for bulk
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [changedItemIds, setChangedItemIds] = useState<Set<string>>(new Set());
    const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(false);
    
    // Stock Out Modal State
    const [showStockModal, setShowStockModal] = useState(false);
    const [isStockOpen, setIsStockOpen] = useState(false);
    
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Notes Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteItemId, setNoteItemId] = useState<string | null>(null);
    const [noteItemTab, setNoteItemTab] = useState<'Consumables' | 'Medicines' | 'Equipment'>('Consumables');
    const [noteContent, setNoteContent] = useState('');
    const [noteModalType, setNoteModalType] = useState<'inventory'|'stockout'>('inventory');

    useEffect(() => {
        fetchInventory();
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase
                .schema('inventory')
                .from('suppliers_tbl')
                .select('supplier_id, supplier_name');
            
            if (error) throw error;
            setSuppliers(data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchInventory = async () => {
        try {
            // Fetch Equipment
            const { data: equipmentData, error: equipmentError } = await supabase
                .schema('inventory')
                .from('equipment_tbl')
                .select('*');

            if (equipmentError) throw equipmentError;

            // Fetch Medicines
            const { data: medicineData, error: medicineError } = await supabase
                .schema('inventory')
                .from('medicine_tbl')
                .select('*');

            if (medicineError) throw medicineError;

            // Fetch Consumables
            const { data: consumablesData, error: consumablesError } = await supabase
                .schema('inventory')
                .from('consumables_tbl')
                .select('*');

            if (consumablesData && consumablesData.length > 0) {
                console.log('DEBUG: First consumable item keys:', Object.keys(consumablesData[0]));
            }

            if (consumablesError) throw consumablesError;

            // Map Equipment
            const mappedEquipment = (equipmentData || []).map((item: any) => ({
                id: item.equipment_id, // Assuming ID column
                name: item.equipment_name,
                quantity: `${item.quantity} units`, // Format quantity
                exp: item.expiry_date || '--',
                supplier: item.supplier_name || '--', 
                unitCost: item.unit_cost,
                notes: item.notes || '',
                category: 'Equipment',
                status: item.quantity === 0 ? 'Critical' : item.quantity < 10 ? 'Low Stock' : 'In Stock'
            }));

            // Map Medicines
            const mappedMedicines = (medicineData || []).map((item: any) => ({
                id: item.medicine_id, // Assuming ID column
                name: item.medicine_name,
                quantity: `${item.quantity} units`,
                exp: item.expiry_date || '--',
                supplier: item.supplier_name || '--',
                unitCost: item.unit_cost,
                notes: item.notes || '',
                category: 'Medicines',
                status: item.quantity === 0 ? 'Critical' : item.quantity < 10 ? 'Low Stock' : 'In Stock'
            }));

            // Map Consumables
            const mappedConsumables = (consumablesData || []).map((item: any) => {
                // Debug log to see what we are getting
                // console.log('Mapping item:', item); 
                return {
                    id: item.consumables_id, // Use the exact column name from DB
                    name: item.consumable_name,
                    quantity: `${item.quantity} units`,
                    exp: item.expiry_date || '--',
                    supplier: item.supplier_name || '--',
                    unitCost: item.unit_cost,
                    notes: item.notes || '',
                    category: 'Consumables',
                    status: item.quantity === 0 ? 'Critical' : item.quantity < 10 ? 'Low Stock' : 'In Stock'
                };
            });

            setInventory({
                Consumables: mappedConsumables,
                Medicines: mappedMedicines,
                Equipment: mappedEquipment
            });

        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleUpdateItem = (id: string, field: string, value: any) => {
        setInventory((prev: any) => ({
            ...prev,
            [activeTab]: prev[activeTab].map((it: any) =>
                it.id === id ? { ...it, [field]: field === 'unitCost' ? parseFloat(value) || 0 : value } : it
            )
        }));
        setChangedItemIds(prev => new Set(prev).add(id));
    }

    const handleSaveChanges = async () => {
        try {
            const updates = Array.from(changedItemIds).map(async (id) => {
                if (!id || id === 'undefined') return; // Skip invalid IDs
                const item = inventory[activeTab].find((it: any) => it.id === id);
                if (!item) return;

                let table = '';
                let idCol = '';
                const category = item.category || activeTab;
                if (category === 'Consumables') { table = 'consumables_tbl'; idCol = 'consumables_id'; }
                else if (category === 'Medicines') { table = 'medicine_tbl'; idCol = 'medicine_id'; }
                else if (category === 'Equipment') { table = 'equipment_tbl'; idCol = 'equipment_id'; }

                if (table) {
                    const { error } = await supabase
                        .schema('inventory')
                        .from(table)
                        .update({
                            [activeTab === 'Medicines' ? 'medicine_name' : activeTab === 'Equipment' ? 'equipment_name' : 'consumable_name']: item.name,
                            expiry_date: item.exp === '--' ? null : item.exp,
                            unit_cost: item.unitCost
                        })
                        .eq(idCol, id);

                    if (error) throw error;
                }
            });

            await Promise.all(updates);
            setChangedItemIds(new Set());
            setActionMode('view');
            setIsSaveSuccessOpen(true);
        } catch (error: any) {
            console.error('Error saving changes:', error);
            alert(`Failed to save changes: ${error.message}`);
        }
    };

    const handleSaveNewOrder = async () => {
        try {
            const table = activeTab === 'Medicines' ? 'medicine_tbl' : activeTab === 'Equipment' ? 'equipment_tbl' : activeTab === 'Consumables' ? 'consumables_tbl' : null;
            
            if (!table) {
                alert('Please select a valid tab to add items.');
                return;
            }

            const payload: any = {
                quantity: parseInt(newOrder.quantity) || 0,
                unit_cost: parseFloat(newOrder.unitCost) || 0,
                // expiry_date: null // Add if form has date picker
            };

            let itemName = '';
            if (activeTab === 'Medicines') {
                itemName = newOrder.item;
                payload.medicine_name = newOrder.item;
            } else if (activeTab === 'Equipment') {
                itemName = newOrder.item;
                payload.equipment_name = newOrder.item;
                // payload.equipment_type = 'General'; // Optional default
            } else if (activeTab === 'Consumables') {
                itemName = newOrder.item;
                payload.consumable_name = newOrder.item;
                // payload.consumable_type = 'General'; // Optional default
            }

            // Insert into stock_in table first
            const now = new Date();
            const lockUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

            const { error: stockInError } = await supabase
                .schema('inventory')
                .from('stock_in')
                .insert({
                    id: crypto.randomUUID(),
                    item_name: itemName,
                    category: activeTab,
                    quantity: parseInt(newOrder.quantity) || 0,
                    units: newOrder.unit,
                    unit_cost: parseFloat(newOrder.unitCost) || 0,
                    status: 'Pending',
                    supplier: newOrder.supplier,
                    created_at: now.toISOString(),
                    lock_until: lockUntil.toISOString()
                });

            if (stockInError) throw stockInError;

            // NOTE: We are NOT inserting into the main inventory tables yet.
            // The item will only appear in the inventory table after it is "Received" in Stock Logs.

            setIsNewOrderOpen(false);
            setTimeout(() => setShowNewOrderModal(false), 200);
            setIsSuccessOpen(true);
            setNewOrder({ item: '', supplier: '', quantity: '', unit: '', unitCost: '' }); // Reset form
            // fetchInventory(); // Do not refresh inventory yet as item is not there

        } catch (error: any) {
            console.error('Error saving order:', error);
            alert(`Failed to save order: ${error.message}`);
        }
    };
        const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
        const [stockNotes, setStockNotes] = useState('');
        const [noteTarget, setNoteTarget] = useState<string>('batch');
        const [stockNotesPerItem, setStockNotesPerItem] = useState<Record<string, string>>({});
        const [stockFlowStep, setStockFlowStep] = useState<'input' | 'summary' | 'success'>('input');
        const [isStockSuccessOpen, setIsStockSuccessOpen] = useState(false);
        
        // Restock Modal State
        const [showRestockModal, setShowRestockModal] = useState(false);
        const [isRestockOpen, setIsRestockOpen] = useState(false);
        
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

    const handleStockOut = async () => {
        try {
            const updates = selectedItems.map(async (item) => {
                const qtyToOut = stockQuantities[item.id] || 0;
                if (qtyToOut <= 0) return;

                // 1. Insert into stock_out
                const noteToUse = noteTarget === 'batch' ? stockNotes || 'Stock Out' : (stockNotesPerItem[item.id] || stockNotes || 'Stock Out');
                const { error: logError } = await supabase
                    .schema('inventory')
                    .from('stock_out')
                    .insert({
                        item_name: item.name,
                        category: item.category || activeTab,
                        quantity: qtyToOut,
                        notes: noteToUse,
                        created_at: new Date().toISOString(),
                        supplier: item.supplier,
                        reference: `SO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                        user_name: 'Admin' // Placeholder
                    });
                
                if (logError) throw logError;

                // 2. Update Inventory Quantity
                let table = '';
                let idCol = '';
                if (activeTab === 'Consumables') { table = 'consumables_tbl'; idCol = 'consumables_id'; }
                else if (activeTab === 'Medicines') { table = 'medicine_tbl'; idCol = 'medicine_id'; }
                else if (activeTab === 'Equipment') { table = 'equipment_tbl'; idCol = 'equipment_id'; }

                if (table) {
                    const currentQty = parseInt(item.quantity) || 0;
                    const newQty = Math.max(0, currentQty - qtyToOut);

                    const { error: updateError } = await supabase
                        .schema('inventory')
                        .from(table)
                        .update({ quantity: newQty })
                        .eq(idCol, item.id);

                    if (updateError) throw updateError;
                }
            });

            await Promise.all(updates);

            // Success UI
            setStockFlowStep('success');
            setStockNotes(''); // Reset
            setStockNotesPerItem({}); // Reset per-item notes
            fetchInventory(); // Refresh table
            setSelectedIds([]);

        } catch (error: any) {
            console.error('Stock out error:', error);
            alert(`Failed to process stock out: ${error.message}`);
        }
    }

    const handleRestock = async () => {
        try {
            const updates = selectedItems.map(async (item) => {
                const qtyToAdd = restockQuantities[item.id] || 0;
                if (qtyToAdd <= 0) return;

                // 1. Log to stock_in as "Restocked"
                const { error: logError } = await supabase
                    .schema('inventory')
                    .from('stock_in')
                    .insert({
                        id: crypto.randomUUID(),
                        item_name: item.name,
                        category: activeTab,
                        quantity: qtyToAdd,
                        units: 'units', // Default unit
                        unit_cost: item.unitCost || 0,
                        status: 'Received', // Auto-received since it's a direct restock
                        supplier: item.supplier,
                        created_at: new Date().toISOString(),
                        // No lock needed for direct restock
                    });

                if (logError) throw logError;

                let table = '';
                let idCol = '';
                if (activeTab === 'Consumables') { table = 'consumables_tbl'; idCol = 'consumables_id'; }
                else if (activeTab === 'Medicines') { table = 'medicine_tbl'; idCol = 'medicine_id'; }
                else if (activeTab === 'Equipment') { table = 'equipment_tbl'; idCol = 'equipment_id'; }

                if (table) {
                    const currentQty = parseInt(item.quantity) || 0;
                    const newQty = currentQty + qtyToAdd;

                    const { error } = await supabase
                        .schema('inventory')
                        .from(table)
                        .update({ 
                            quantity: newQty,
                            status: newQty > 0 ? 'In Stock' : 'Critical'
                        })
                        .eq(idCol, item.id);

                    if (error) throw error;
                }
            });

            await Promise.all(updates);
            
            setIsRestockOpen(false); 
            setTimeout(() => setShowRestockModal(false), 200); 
            setIsRestockSuccessOpen(true);
            fetchInventory();
            setSelectedIds([]);

        } catch (error: any) {
            console.error('Restock error:', error);
            alert('Failed to restock: ' + error.message);
        }
    }

    // Notes modal helpers
    function openNoteModal(id: string, tab: 'Consumables' | 'Medicines' | 'Equipment', note?: string, type: 'inventory'|'stockout' = 'inventory') {
        setNoteItemId(id);
        setNoteItemTab(tab);
        setNoteContent(note || '');
        setNoteModalType(type);
        setShowNoteModal(true);
        setTimeout(() => setIsNoteOpen(true), 10);
    }

        async function handleSaveNote() {
            if (!noteItemId) return;
            // Inventory note: save to DB (personal notes)
            if (noteModalType === 'inventory') {
                try {
                    let table = '';
                    let idCol = '';
                    if (noteItemTab === 'Consumables') { table = 'consumables_tbl'; idCol = 'consumables_id'; }
                    else if (noteItemTab === 'Medicines') { table = 'medicine_tbl'; idCol = 'medicine_id'; }
                    else if (noteItemTab === 'Equipment') { table = 'equipment_tbl'; idCol = 'equipment_id'; }

                    if (table) {
                        const { error } = await supabase
                            .schema('inventory')
                            .from(table)
                            .update({ notes: noteContent })
                            .eq(idCol, noteItemId);
                        if (error) throw error;
                        setInventory(prev => ({
                            ...prev,
                            [noteItemTab]: prev[noteItemTab].map(it => it.id === noteItemId ? { ...it, notes: noteContent } : it)
                        }));
                    }
                } catch (err: any) {
                    console.error('Failed to save inventory note', err);
                    alert('Failed to save inventory note: ' + (err?.message || 'Unknown error'));
                }
            } else {
                // Stock-out note: only store locally (will be used at stock out time)
                setStockNotesPerItem(prev => ({ ...prev, [noteItemId]: noteContent }));
            }
            setIsNoteOpen(false);
            setTimeout(() => setShowNoteModal(false), 200);
        }

        function openStockOut() {
            if (selectedIds.length === 0) return
            // set default quantities to 0 for each selected item
            const defaults: Record<string, number> = {}
            selectedIds.forEach(id => defaults[id] = 0)
            setStockQuantities(defaults)
            // initialize per-item notes map using existing item.notes or empty
            const perNotes: Record<string, string> = {};
            selectedIds.forEach(id => {
                const item = allItems.find(it => it.id === id);
                perNotes[id] = item?.notes || '';
            })
            setStockNotesPerItem(perNotes);
            setStockFlowStep('input')
            setShowStockModal(true)
            setTimeout(() => setIsStockOpen(true), 10)
            // initialize notes UI state
            setStockNotes('');
            setNoteTarget('batch');
        }

        function openRestock() {
            if (selectedIds.length === 0) return
            const defaults: Record<string, number> = {}
            selectedIds.forEach(id => defaults[id] = 1)
            setRestockQuantities(defaults)
            setRestockStage('selected')
            setShowRestockModal(true)
            setTimeout(() => setIsRestockOpen(true), 10)
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
                                    <DropdownMenuRadioGroup value={actionMode} onValueChange={(v) => setActionMode(v as 'view' | 'edit' | 'select')}>
                                        <DropdownMenuRadioItem value="view">View</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="edit">Edit</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="select">Select</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {actionMode === 'edit' && changedItemIds.size > 0 && (
                                <Button 
                                    size="sm" 
                                    className="rounded-3xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm animate-in fade-in slide-in-from-right-4"
                                    onClick={handleSaveChanges}
                                >
                                    Save Changes
                                </Button>
                            )}
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
                                            <td className="px-4 py-5 align-middle">
                                                {actionMode === 'select' && (
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`select-${item.id}`}
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={() => toggleSelectId(item.id)}
                                                        className="rounded border-slate-200 dark:border-slate-600 bg-transparent text-cyan-700 dark:text-cyan-400"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-8 py-5 font-semibold align-middle">
                                                {actionMode === 'edit' ? (
                                                    <div className="space-y-1">
                                                        <Input 
                                                            value={item.name} 
                                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                            className="h-8 font-semibold"
                                                        />
                                                        <div className="text-xs tracking-wide text-slate-500 dark:text-slate-400 px-3">{item.id}</div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                                                        <div className="mt-1 text-xs tracking-wide text-slate-500 dark:text-slate-400">{item.id}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {actionMode === 'edit' ? (
                                                    <Input 
                                                        type="date"
                                                        value={item.exp === '--' ? '' : item.exp} 
                                                        onChange={(e) => handleUpdateItem(item.id, 'exp', e.target.value)}
                                                        className="h-8 w-full"
                                                    />
                                                ) : (
                                                    item.exp
                                                )}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300">{item.supplier}</td>
                                            <td className="px-6 py-5 align-middle text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {actionMode === 'edit' ? (
                                                    <Input 
                                                        type="number"
                                                        value={item.unitCost} 
                                                        onChange={(e) => handleUpdateItem(item.id, 'unitCost', e.target.value)}
                                                        className="h-8 w-full"
                                                    />
                                                ) : (
                                                    formatCurrency(item.unitCost)
                                                )}
                                            </td>
                                            <td className="px-6 py-5 align-middle">{renderStatusBadge(item.status)}</td>
                                            <td className="px-6 py-5 align-middle text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-3 relative">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => openNoteModal(item.id, activeTab, stockNotesPerItem[item.id] || item.notes, 'inventory')}
                                                                    className="relative inline-flex items-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    aria-label={`notes-${item.id}`}
                                                                >
                                                                    <MessageSquare size={16} className="text-slate-700 dark:text-slate-300" />
                                                                    {item.notes ? (
                                                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[11px] rounded-full bg-rose-500 text-white">1</span>
                                                                    ) : null}
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-sm max-w-[220px]">
                                                                    {item.notes ? item.notes : 'Add a note to this item'}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
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
                            <Button variant="ghost" size="sm" className="rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0b4f50] px-5 text-cyan-700 dark:text-cyan-100 shadow-sm" onClick={() => { setShowNewOrderModal(true); setTimeout(() => setIsNewOrderOpen(true), 10) }}>New Order</Button>
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
            {showNewOrderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isNewOrderOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsNewOrderOpen(false); setTimeout(() => setShowNewOrderModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isNewOrderOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-2xl rounded-2xl overflow-hidden m-4">
                            <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] rounded-t-2xl px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">New Order Sheet</h3>
                                <button className="text-white" onClick={() => { setIsNewOrderOpen(false); setTimeout(() => setShowNewOrderModal(false), 200) }} aria-label="Close">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field orientation="vertical">
                                        <FieldLabel>Item Name <span className="text-red-500">*</span></FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="Dental Chair" value={newOrder.item} onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Supplier Name <span className="text-red-500">*</span></FieldLabel>
                                        <FieldContent>
                                            <Select onValueChange={(v) => setNewOrder({ ...newOrder, supplier: v })}>
                                                <SelectTrigger size="sm">
                                                    <SelectValue placeholder="Select Supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.supplier_id} value={supplier.supplier_name}>
                                                            {supplier.supplier_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field orientation="vertical">
                                        <FieldLabel>Quantity <span className="text-red-500">*</span></FieldLabel>
                                        <FieldContent>
                                            <Input placeholder="100" value={newOrder.quantity} onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })} />
                                        </FieldContent>
                                    </Field>
                                    <Field orientation="vertical">
                                        <FieldLabel>Unit Cost <span className="text-red-500">*</span></FieldLabel>
                                        <FieldContent>
                                            <Input 
                                                placeholder={formatCurrency(0)} 
                                                value={newOrder.unitCost} 
                                                readOnly 
                                                className="bg-slate-100 text-slate-500 cursor-not-allowed"
                                                onChange={(e) => setNewOrder({ ...newOrder, unitCost: e.target.value })} 
                                            />
                                        </FieldContent>
                                    </Field>
                                </div>
                            </CardContent>
                            <CardContent className="flex justify-end gap-2 pt-0 pb-6">
                                <Button variant="outline" onClick={() => { setIsNewOrderOpen(false); setTimeout(() => setShowNewOrderModal(false), 200) }}>Cancel</Button>
                                <Button onClick={handleSaveNewOrder}>Save</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isNoteOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isNoteOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-[640px] rounded-2xl overflow-hidden m-4">
                            <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] rounded-t-2xl px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Item Note</h3>
                                <button className="text-white" onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }} aria-label="Close">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <CardContent className="space-y-4 pt-6">
                                <div className="text-sm text-slate-700 dark:text-slate-300">Leave a note for the doctor or staff. This will be saved directly to the item's record.</div>
                                <div>
                                    <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Type your note here..." className="min-h-[120px]" />
                                </div>
                            </CardContent>
                            <CardContent className="flex justify-end gap-2 pt-0 pb-6">
                                <Button variant="outline" onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }}>Cancel</Button>
                                <Button onClick={handleSaveNote}>Save</Button>
                            </CardContent>
                        </Card>
                    </div>
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
            {showStockModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isStockOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isStockOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Input Step */}
                        {stockFlowStep === 'input' && (
                            <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4 border border-slate-200 dark:border-slate-700">
                                <div className="bg-[#00b8b8] px-6 py-4 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white/20 rounded-lg">
                                            <List className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-wide">Stock Out</h3>
                                    </div>
                                    <button onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }} aria-label="Close" className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                
                                <div className="p-8 space-y-8">
                                    {/* Selected Item Header */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xl font-bold text-[#00b8b8]">Selected Item</h4>
                                        <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                            {new Date().toLocaleDateString()}
                                            <List className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-[#0b2527] px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            <div className="col-span-6">Item Name</div>
                                            <div className="col-span-3 text-center">Status</div>
                                            <div className="col-span-3 text-center">Quantity</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedItems.map(it => (
                                                <div key={it.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center bg-white dark:bg-[#0f2e30]">
                                                    <div className="col-span-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">{it.name}</div>
                                                            {stockNotesPerItem[it.id] ? (
                                                                <div className="text-xs text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20">Note</div>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">{it.quantity}</div>
                                                    </div>
                                                    <div className="col-span-3 flex justify-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-xs font-bold",
                                                            it.status === 'In Stock' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                                            it.status === 'Low Stock' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                        )}>
                                                            {it.status}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-3 flex justify-center">
                                                        <Input 
                                                            type="number" 
                                                            value={stockQuantities[it.id] ?? 0} 
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    setStockQuantities(prev => ({ ...prev, [it.id]: 0 }));
                                                                    return;
                                                                }
                                                                const num = parseInt(val);
                                                                setStockQuantities(prev => ({ ...prev, [it.id]: isNaN(num) ? 0 : num }))
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-24 text-center font-bold h-10 border-slate-300 dark:border-slate-600 focus:ring-[#00b8b8]"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    <div className="space-y-4">
                                        <h5 className="text-slate-600 dark:text-slate-300 font-medium">Notes</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Apply note to</label>
                                                <Select value={noteTarget} onValueChange={setNoteTarget}>
                                                    <SelectTrigger className="h-11 border-slate-300 dark:border-slate-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        <SelectItem value="batch">Entire batch (default)</SelectItem>
                                                        {selectedItems.map(it => (
                                                            <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Note content</label>
                                                {noteTarget === 'batch' ? (
                                                    <>
                                                        <Textarea 
                                                            placeholder="Add optional notes about why items are stocked out..." 
                                                            className="min-h-[100px] resize-none border-slate-300 dark:border-slate-600"
                                                            value={stockNotes}
                                                            onChange={(e) => setStockNotes(e.target.value)}
                                                            maxLength={800}
                                                        />
                                                        <div className="text-right text-xs text-slate-400">
                                                            {stockNotes.length}/800
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Textarea 
                                                            placeholder="Add a specific note for the selected item..." 
                                                            className="min-h-[100px] resize-none border-slate-300 dark:border-slate-600"
                                                            value={stockNotesPerItem[noteTarget] || ''}
                                                            onChange={(e) => setStockNotesPerItem(prev => ({ ...prev, [noteTarget]: e.target.value }))}
                                                            maxLength={800}
                                                        />
                                                        <div className="text-right text-xs text-slate-400">
                                                            {(stockNotesPerItem[noteTarget] || '').length}/800
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                className="bg-[#00b8b8] hover:bg-[#009e9e] text-white rounded-full px-6"
                                                onClick={() => {
                                                    // Apply the current active note (batch or item) to all selected items
                                                    const perNotesCopy: Record<string, string> = { ...stockNotesPerItem };
                                                    const noteToApply = noteTarget === 'batch' ? stockNotes : stockNotesPerItem[noteTarget] || '';
                                                    selectedIds.forEach(id => {
                                                        perNotesCopy[id] = noteToApply;
                                                    })
                                                    setStockNotesPerItem(perNotesCopy);
                                                    setNoteTarget('batch');
                                                }}
                                            >
                                                Apply to all items
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex flex-col items-center gap-4 pt-4">
                                        <Button 
                                            size="lg"
                                            className={cn(
                                                "w-40 rounded-full font-bold text-lg transition-all",
                                                Object.values(stockQuantities).some(q => q > 0) 
                                                    ? "bg-slate-300 hover:bg-slate-400 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                                    : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                            )}
                                            onClick={() => setStockFlowStep('summary')}
                                            disabled={!Object.values(stockQuantities).some(q => q > 0)}
                                        >
                                            Stock out
                                        </Button>
                                        <p className="text-xs text-slate-400">
                                            Enter at least one quantity greater than zero
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Step */}
                        {stockFlowStep === 'summary' && (
                            <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4 border border-slate-200 dark:border-slate-700">
                                <div className="bg-[#00b8b8] px-6 py-4 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white/20 rounded-lg">
                                            <List className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold tracking-wide">Stock Out</h3>
                                    </div>
                                    <button onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }} aria-label="Close" className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                
                                <div className="p-8 space-y-8">
                                    {/* Summary Header */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xl font-bold text-[#00b8b8]">Summary</h4>
                                        <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                            {new Date().toLocaleDateString()}
                                            <List className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Summary Table */}
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-[#0b2527] px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            <div className="col-span-4">Item Name</div>
                                            <div className="col-span-3 text-center">Remaining</div>
                                            <div className="col-span-3 text-center">Stock Out</div>
                                            <div className="col-span-2 text-center">All stock</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedItems.map(it => {
                                                const currentQty = parseInt(it.quantity) || 0;
                                                const outQty = stockQuantities[it.id] || 0;
                                                const newQty = Math.max(0, currentQty - outQty);
                                                return (
                                                    <div key={it.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center bg-white dark:bg-[#0f2e30]">
                                                        <div className="col-span-4 font-bold text-slate-800 dark:text-slate-100">{it.name}</div>
                                                        <div className="col-span-3 text-center text-slate-600 dark:text-slate-300">{currentQty}</div>
                                                        <div className="col-span-3 text-center text-slate-600 dark:text-slate-300">{outQty}</div>
                                                        <div className="col-span-2 text-center font-bold text-slate-800 dark:text-slate-100">{newQty}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex flex-col items-center gap-4 pt-4">
                                        <Button 
                                            size="lg"
                                            className="w-40 rounded-full font-bold text-lg bg-[#00b8b8] hover:bg-[#009e9e] text-white"
                                            onClick={handleStockOut}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Step */}
                        {stockFlowStep === 'success' && (
                            <Card className="w-full max-w-md rounded-2xl overflow-hidden m-4 text-center">
                                <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }}>
                                    <X className="w-5 h-5" />
                                </button>
                                <CardContent className="pt-12 pb-10 px-8">
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
                                        <CheckCircle className="w-14 h-14 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Items Successfully Stocked Out!</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">The item you selected has been recorded successfully.</p>
                                    <Button 
                                        size="lg"
                                        className="w-32 rounded-full font-bold bg-[#00b8b8] hover:bg-[#009e9e] text-white"
                                        onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }}
                                    >
                                        Done
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {showRestockModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isRestockOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsRestockOpen(false); setTimeout(() => setShowRestockModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isRestockOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4 border border-slate-200 dark:border-slate-700">
                            <div className="bg-[#00b8b8] px-6 py-4 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <List className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold tracking-wide">{restockStage === 'selected' ? 'Restock' : 'Restock (Completed)'}</h3>
                                </div>
                                <button onClick={() => { setIsRestockOpen(false); setTimeout(() => setShowRestockModal(false), 200) }} aria-label="Close" className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-bold text-cyan-500 dark:text-cyan-400">
                                        {selectedItems[0]?.supplier || 'Unknown Supplier'}
                                    </h4>
                                    <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                        {new Date().toLocaleDateString()}
                                        <List className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-[#0b2527] px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        <div className="col-span-8">Item Name</div>
                                        <div className="col-span-4 text-center">Quantity</div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedItems.map(it => (
                                            <div key={it.id} className="px-6 py-6 grid grid-cols-12 gap-4 items-center bg-white dark:bg-[#0f2e30]">
                                                <div className="col-span-8">
                                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">{it.name}</div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{it.quantity}</div>
                                                </div>
                                                <div className="col-span-4 flex justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-lg border-slate-200 dark:border-slate-700"
                                                            onClick={() => setRestockQuantities(prev => ({ ...prev, [it.id]: Math.max(0, (prev[it.id] || 0) - 1) }))}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <Input 
                                                            type="number" 
                                                            value={restockQuantities[it.id] ?? 0} 
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    setRestockQuantities(prev => ({ ...prev, [it.id]: 0 }));
                                                                    return;
                                                                }
                                                                const num = parseInt(val);
                                                                setRestockQuantities(prev => ({ ...prev, [it.id]: isNaN(num) ? 0 : num }))
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-20 text-center font-bold h-10 border-slate-200 dark:border-slate-700 focus:ring-[#00b8b8]"
                                                        />
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-lg border-slate-200 dark:border-slate-700"
                                                            onClick={() => setRestockQuantities(prev => ({ ...prev, [it.id]: (prev[it.id] || 0) + 1 }))}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col items-center gap-4 pt-4">
                                    <Button 
                                        size="lg"
                                        className="w-40 rounded-full font-bold text-lg bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
                                        onClick={handleRestock}
                                    >
                                        Restock
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Success */}
            {isRestockSuccessOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRestockSuccessOpen(false)} />
                    <div className="relative z-10 transform-gpu animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-md rounded-2xl overflow-hidden m-4 text-center shadow-2xl border-0">
                            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setIsRestockSuccessOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                            <CardContent className="pt-12 pb-10 px-8">
                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 animate-in zoom-in duration-500">
                                    <CheckCircle className="w-14 h-14 text-emerald-500 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Restock Successfully!</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8">The item you inputted has been successfully saved.</p>
                                <Button 
                                    size="lg"
                                    className="w-32 rounded-full font-bold bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
                                    onClick={() => setIsRestockSuccessOpen(false)}
                                >
                                    Done
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Save Changes Success */}
            {isSaveSuccessOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSaveSuccessOpen(false)} />
                    <div className="relative z-10 transform-gpu animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <Card className="w-full max-w-md rounded-2xl overflow-hidden m-4 text-center shadow-2xl border-0">
                            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setIsSaveSuccessOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                            <CardContent className="pt-12 pb-10 px-8">
                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 animate-in zoom-in duration-500">
                                    <CheckCircle className="w-14 h-14 text-emerald-500 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Changes Saved!</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8">Your inventory changes have been successfully updated.</p>
                                <Button 
                                    size="lg"
                                    className="w-32 rounded-full font-bold bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
                                    onClick={() => setIsSaveSuccessOpen(false)}
                                >
                                    Done
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
