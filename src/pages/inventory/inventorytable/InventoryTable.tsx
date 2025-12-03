import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, MessageSquare, List, Minus, Plus, Package, Calendar, AlertTriangle, Trash2, Pencil, Check } from 'lucide-react'
import { X, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatCurrency } from '@/lib/utils'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

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

    // Batch Modal State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [isBatchOpen, setIsBatchOpen] = useState(false);
    const [batchItem, setBatchItem] = useState<any>(null);
    const [batches, setBatches] = useState<any[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    // Batch Editing State
    const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
    const [editingBatchExpiry, setEditingBatchExpiry] = useState<string>('');
    const [savingBatchExpiry, setSavingBatchExpiry] = useState(false);

    // Delete Confirmation Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [deleteItemName, setDeleteItemName] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

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
                id: `EQP-${String(item.equipment_id).padStart(5, '0')}`, // Formatted unique ID
                dbId: item.equipment_id, // Original database ID for DB operations
                name: item.equipment_name,
                quantity: `${item.quantity} boxes`, // Format quantity
                exp: item.expiry_date || '--',
                supplier: item.supplier_name || '--', 
                unitCost: item.unit_cost,
                notes: item.notes || '',
                category: 'Equipment',
                status: item.quantity === 0 ? 'Critical' : item.quantity < 10 ? 'Low Stock' : 'In Stock'
            }));

            // Map Medicines
            const mappedMedicines = (medicineData || []).map((item: any) => ({
                id: `MED-${String(item.medicine_id).padStart(5, '0')}`, // Formatted unique ID
                dbId: item.medicine_id, // Original database ID for DB operations
                name: item.medicine_name,
                quantity: `${item.quantity} boxes`,
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
                    id: `CON-${String(item.consumables_id).padStart(5, '0')}`, // Formatted unique ID
                    dbId: item.consumables_id, // Original database ID for DB operations
                    name: item.consumable_name,
                    quantity: `${item.quantity} boxes`,
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
                        .eq(idCol, item.dbId); // Use dbId for database operations

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

    const openDeleteConfirm = (id: string, name: string) => {
        setDeleteItemId(id);
        setDeleteItemName(name);
        setShowDeleteModal(true);
        setTimeout(() => setIsDeleteOpen(true), 10);
    };

    const closeDeleteModal = () => {
        setIsDeleteOpen(false);
        setTimeout(() => {
            setShowDeleteModal(false);
            setDeleteItemId(null);
            setDeleteItemName('');
        }, 200);
    };

    const handleDeleteItem = async () => {
        if (!deleteItemId) return;

        setIsDeleting(true);
        try {
            // Find the item to get the dbId
            const item = inventory[activeTab].find((it: any) => it.id === deleteItemId);
            if (!item) {
                throw new Error('Item not found');
            }

            let table = '';
            let idCol = '';
            
            if (activeTab === 'Consumables') { 
                table = 'consumables_tbl'; 
                idCol = 'consumables_id'; 
            } else if (activeTab === 'Medicines') { 
                table = 'medicine_tbl'; 
                idCol = 'medicine_id'; 
            } else if (activeTab === 'Equipment') { 
                table = 'equipment_tbl'; 
                idCol = 'equipment_id'; 
            }

            const { error } = await supabase
                .schema('inventory')
                .from(table)
                .delete()
                .eq(idCol, item.dbId); // Use dbId for database operations

            if (error) throw error;

            // Remove from local state
            setInventory((prev: any) => ({
                ...prev,
                [activeTab]: prev[activeTab].filter((it: any) => it.id !== deleteItemId)
            }));

            closeDeleteModal();
        } catch (error: any) {
            console.error('Error deleting item:', error);
            alert(`Failed to delete item: ${error.message}`);
        } finally {
            setIsDeleting(false);
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
        
        const [restockQuantities, setRestockQuantities] = useState<Record<string, number>>({});
        const [restockExpiryDates, setRestockExpiryDates] = useState<Record<string, string>>({});
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
                        .eq(idCol, item.dbId); // Use dbId for database operations

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

                const expiryDate = restockExpiryDates[item.id] || null;

                // 1. Log to stock_in as "Restocked"
                const { error: logError } = await supabase
                    .schema('inventory')
                    .from('stock_in')
                    .insert({
                        id: crypto.randomUUID(),
                        item_name: item.name,
                        category: activeTab,
                        quantity: qtyToAdd,
                        units: 'boxes', // Default unit
                        unit_cost: item.unitCost || 0,
                        status: 'Received', // Auto-received since it's a direct restock
                        supplier: item.supplier,
                        created_at: new Date().toISOString(),
                        expiry_date: expiryDate,
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
                        .eq(idCol, item.dbId); // Use dbId for database operations

                    if (error) throw error;
                }
            });

            await Promise.all(updates);
            
            setIsRestockOpen(false); 
            setTimeout(() => setShowRestockModal(false), 200); 
            setIsRestockSuccessOpen(true);
            setRestockExpiryDates({});
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

    // Batch modal helpers
    async function openBatchModal(item: any) {
        setBatchItem(item);
        setBatches([]);
        setBatchesLoading(true);
        setShowBatchModal(true);
        setTimeout(() => setIsBatchOpen(true), 10);

        try {
            // Fetch all stock_in records for this item (batches)
            const { data, error } = await supabase
                .schema('inventory')
                .from('stock_in')
                .select('*')
                .eq('item_name', item.name)
                .eq('category', item.category || activeTab)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBatches(data || []);
        } catch (error) {
            console.error('Error fetching batches:', error);
            setBatches([]);
        } finally {
            setBatchesLoading(false);
        }
    }

    function closeBatchModal() {
        setIsBatchOpen(false);
        setEditingBatchId(null);
        setEditingBatchExpiry('');
        setTimeout(() => setShowBatchModal(false), 200);
    }

    function startEditingBatchExpiry(batchId: number, currentExpiry: string | null) {
        setEditingBatchId(batchId);
        setEditingBatchExpiry(currentExpiry || '');
    }

    function cancelEditingBatchExpiry() {
        setEditingBatchId(null);
        setEditingBatchExpiry('');
    }

    async function saveBatchExpiry(batchId: number) {
        setSavingBatchExpiry(true);
        try {
            const { error } = await supabase
                .schema('inventory')
                .from('stock_in')
                .update({ expiry_date: editingBatchExpiry || null })
                .eq('id', batchId);

            if (error) throw error;

            // Update local state
            setBatches(prev => prev.map(b => 
                b.id === batchId ? { ...b, expiry_date: editingBatchExpiry || null } : b
            ));

            setEditingBatchId(null);
            setEditingBatchExpiry('');
        } catch (error: any) {
            console.error('Error updating batch expiry:', error);
            alert(`Failed to update expiry date: ${error.message}`);
        } finally {
            setSavingBatchExpiry(false);
        }
    }

    // Helper to check if a date is expired or expiring soon
    function getExpiryStatus(expiryDate: string | null): 'expired' | 'expiring-soon' | 'ok' | 'none' {
        if (!expiryDate) return 'none';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(expiryDate);
        expDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'expired';
        if (diffDays <= 30) return 'expiring-soon';
        return 'ok';
    }

        async function handleSaveNote() {
            if (!noteItemId) return;
            // Inventory note: save to DB (personal notes)
            if (noteModalType === 'inventory') {
                try {
                    // Find the item to get the dbId
                    const item = inventory[noteItemTab].find((it: any) => it.id === noteItemId);
                    if (!item) {
                        throw new Error('Item not found');
                    }

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
                            .eq(idCol, item.dbId); // Use dbId for database operations
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
            // Filter to only items in the current tab
            const currentTabItemIds = inventory[activeTab].map((it: any) => it.id);
            const selectedCurrentTabIds = selectedIds.filter(id => currentTabItemIds.includes(id));
            if (selectedCurrentTabIds.length === 0) return;
            
            // set default quantities to 0 for each selected item in current tab
            const defaults: Record<string, number> = {}
            selectedCurrentTabIds.forEach(id => defaults[id] = 0)
            setStockQuantities(defaults)
            // initialize per-item notes map using existing item.notes or empty
            const perNotes: Record<string, string> = {};
            selectedCurrentTabIds.forEach(id => {
                const item = inventory[activeTab].find((it: any) => it.id === id);
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
            // Filter to only items in the current tab
            const currentTabItemIds = inventory[activeTab].map((it: any) => it.id);
            const selectedCurrentTabIds = selectedIds.filter(id => currentTabItemIds.includes(id));
            if (selectedCurrentTabIds.length === 0) return;
            
            const defaults: Record<string, number> = {}
            const defaultExpiry: Record<string, string> = {}
            selectedCurrentTabIds.forEach(id => {
                defaults[id] = 1
                defaultExpiry[id] = ''
            })
            setRestockQuantities(defaults)
            setRestockExpiryDates(defaultExpiry)
            setShowRestockModal(true)
            setTimeout(() => setIsRestockOpen(true), 10)
        }

    const tabList = ['Consumables', 'Medicines', 'Equipment'] as const;
    const items = inventory[activeTab];
    const filteredItems = items.filter((it: any) => selectedStatus === 'All Status' ? true : it.status === selectedStatus);
    const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((it:any) => selectedIds.includes(it.id));

    const allItems = (Object.values(inventory) as any[]).flat();
    const selectedItems = allItems.filter(it => selectedIds.includes(it.id));
    
    // Selected items filtered to current tab only (for Stock Out and Restock modals)
    const selectedItemsCurrentTab = items.filter((it: any) => selectedIds.includes(it.id));

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
                                            onClick={() => actionMode === 'view' && openBatchModal(item)}
                                            className={cn(
                                                "border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071a1b] text-slate-800 dark:text-slate-200 transition-all",
                                                selectedIds.includes(item.id) ? "ring-2 ring-cyan-600 dark:bg-[#0b2f31]" : "",
                                                actionMode === 'view' && "cursor-pointer hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 hover:shadow-sm"
                                            )}
                                        >
                                            <td className="px-4 py-5 align-middle" onClick={(e) => e.stopPropagation()}>
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
                                                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                                        <Input 
                                                            value={item.name} 
                                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                            className="h-8 font-semibold"
                                                        />
                                                        <div className="text-xs tracking-wide text-slate-500 dark:text-slate-400 px-3">{item.id}</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-slate-900 dark:text-slate-100 leading-snug">{item.name}</div>
                                                        <div className="mt-1 text-xs tracking-wide text-slate-500 dark:text-slate-400">{item.id}</div>
                                                    </div>
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
                                            <td className="px-6 py-5 align-middle text-slate-500 dark:text-slate-400" onClick={(e) => e.stopPropagation()}>
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
                                                    {actionMode === 'edit' && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => openDeleteConfirm(item.id, item.name)}
                                                                        className="inline-flex items-center p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600"
                                                                        aria-label={`delete-${item.id}`}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <span className="text-sm">Delete this item</span>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
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
                        <div className="w-full max-w-xl rounded-lg overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4">
                            {/* Header */}
                            <div className="bg-[#00a8a8] px-4 py-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <Plus className="w-5 h-5" />
                                    <span className="text-lg font-semibold">New Order</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={() => { setIsNewOrderOpen(false); setTimeout(() => setShowNewOrderModal(false), 200) }} 
                                        aria-label="Close"
                                        className="hover:bg-white/20 rounded p-1 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Item Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                placeholder="Enter item name" 
                                                value={newOrder.item} 
                                                onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })}
                                                className="h-10 border-slate-200 dark:border-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Supplier <span className="text-red-500">*</span>
                                            </label>
                                            <Select onValueChange={(v) => setNewOrder({ ...newOrder, supplier: v })}>
                                                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="Select supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.supplier_id} value={supplier.supplier_name}>
                                                            {supplier.supplier_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number"
                                                placeholder="Enter quantity" 
                                                value={newOrder.quantity} 
                                                onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                                                className="h-10 border-slate-200 dark:border-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Unit Cost <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                placeholder={formatCurrency(0)} 
                                                value={newOrder.unitCost} 
                                                onChange={(e) => setNewOrder({ ...newOrder, unitCost: e.target.value })}
                                                className="h-10 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info text */}
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                    New orders will be added to pending stock-in records
                                </p>

                                {/* Footer Actions */}
                                <div className="flex justify-center gap-3 pt-2">
                                    <Button 
                                        variant="outline"
                                        className="rounded-full px-6"
                                        onClick={() => { setIsNewOrderOpen(false); setTimeout(() => setShowNewOrderModal(false), 200) }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        className="rounded-full px-8 font-semibold bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
                                        onClick={handleSaveNewOrder}
                                    >
                                        Save Order
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 transition-opacity duration-300 ease-out ${isNoteOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }} />
                    <div className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isNoteOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4 border border-slate-200 dark:border-slate-700">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] px-6 py-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold">Item Note</h3>
                                        <p className="text-xs text-white/70">Add or edit note</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }} 
                                    aria-label="Close"
                                    className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Leave a note for the doctor or staff. This will be saved directly to the item's record.
                                </p>
                                <Textarea 
                                    value={noteContent} 
                                    onChange={(e) => setNoteContent(e.target.value)} 
                                    placeholder="Type your note here..." 
                                    className="min-h-[120px] border-slate-200 dark:border-slate-700 resize-none"
                                />

                                {/* Footer Actions */}
                                <div className="flex justify-center gap-3 pt-2">
                                    <Button 
                                        variant="outline"
                                        className="rounded-full px-6"
                                        onClick={() => { setIsNoteOpen(false); setTimeout(() => setShowNoteModal(false), 200) }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        className="rounded-full px-8 font-semibold bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
                                        onClick={handleSaveNote}
                                    >
                                        Save Note
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                            <div className="w-full max-w-2xl rounded-lg overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4">
                                <div className="bg-[#00a8a8] px-4 py-3 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <Minus className="w-5 h-5" />
                                        <span className="text-lg font-semibold">Stock Out</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-xs">{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <button onClick={() => { setIsStockOpen(false); setTimeout(() => setShowStockModal(false), 200) }} aria-label="Close" className="hover:bg-white/20 rounded p-1 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
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
                                            <div className="col-span-3 text-center">Quantity <span className="text-red-500">*</span></div>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedItemsCurrentTab.map(it => (
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
                                                        {selectedItemsCurrentTab.map(it => (
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
                        <div className="w-full max-w-2xl rounded-lg overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl m-4">
                            <div className="bg-[#00a8a8] px-4 py-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <Plus className="w-5 h-5" />
                                    <span className="text-lg font-semibold">Restock</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <button onClick={() => { setIsRestockOpen(false); setTimeout(() => setShowRestockModal(false), 200) }} aria-label="Close" className="hover:bg-white/20 rounded p-1 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-5">
                                {/* Header Info */}
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-cyan-500 dark:text-cyan-400">
                                        {selectedItemsCurrentTab[0]?.supplier || 'Unknown Supplier'}
                                    </h4>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                        {new Date().toLocaleDateString()}
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-[#0b2527] px-4 py-2.5 grid grid-cols-12 gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        <div className="col-span-6">Item Name</div>
                                        <div className="col-span-6 text-center">Quantity <span className="text-red-500">*</span></div>
                                    </div>
                                    <ScrollArea className="max-h-[280px]">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedItemsCurrentTab.map(it => (
                                                <div key={it.id} className="px-4 py-4 grid grid-cols-12 gap-3 items-center bg-white dark:bg-[#0f2e30]">
                                                    <div className="col-span-6">
                                                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{it.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Current: {it.quantity}</div>
                                                    </div>
                                                    <div className="col-span-6 flex justify-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
                                                                onClick={() => setRestockQuantities(prev => ({ ...prev, [it.id]: Math.max(0, (prev[it.id] || 0) - 1) }))}
                                                            >
                                                                <Minus className="h-3 w-3" />
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
                                                                className="w-16 text-center font-semibold h-8 text-sm border-slate-200 dark:border-slate-700"
                                                            />
                                                            <Button 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
                                                                onClick={() => setRestockQuantities(prev => ({ ...prev, [it.id]: (prev[it.id] || 0) + 1 }))}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-center gap-3 pt-2">
                                    <Button 
                                        variant="outline"
                                        className="rounded-full px-6"
                                        onClick={() => { setIsRestockOpen(false); setTimeout(() => setShowRestockModal(false), 200) }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        className="rounded-full px-8 font-semibold bg-[#00b8b8] hover:bg-[#009e9e] text-white shadow-lg shadow-cyan-500/20"
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

            {/* Batch Details Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div 
                        className={cn(
                            "fixed inset-0 transition-opacity duration-200",
                            isBatchOpen ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
                        )} 
                        onClick={closeBatchModal} 
                    />
                    <div 
                        className={cn(
                            "relative z-10 transform-gpu transition-all duration-200",
                            isBatchOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                        )} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-white dark:bg-[#0f2e30] shadow-2xl border border-slate-200 dark:border-slate-700">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#00a8a8] to-[#008a8a] px-6 py-5 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">{batchItem?.name}</h3>
                                        <p className="text-sm text-white/70">Batch History & Expiry Management</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={closeBatchModal} 
                                    aria-label="Close" 
                                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Item Summary */}
                                {batchItem && (
                                    <div className="flex flex-wrap items-center gap-4 text-sm bg-slate-50 dark:bg-[#0b2527] rounded-xl p-4">
                                        <span className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                                            {batchItem.category || activeTab}
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Total: <span className="font-semibold text-slate-800 dark:text-slate-200">{batchItem.quantity}</span>
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Supplier: <span className="font-semibold text-slate-800 dark:text-slate-200">{batchItem.supplier || '--'}</span>
                                        </span>
                                        {renderStatusBadge(batchItem.status)}
                                    </div>
                                )}

                                {/* Batches List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-base">
                                            <Calendar className="w-5 h-5 text-cyan-600" />
                                            Stock-In Batches
                                        </span>
                                        <span className="text-sm text-slate-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''} found</span>
                                    </div>

                                    {batchesLoading ? (
                                        <div className="flex items-center justify-center py-14">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                        </div>
                                    ) : batches.length === 0 ? (
                                        <div className="text-center py-14 bg-slate-50 dark:bg-[#0b2527] rounded-xl">
                                            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="text-base text-slate-500">No batch records found</p>
                                            <p className="text-sm text-slate-400 mt-1">Records appear when items are restocked</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[380px] rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {batches.map((batch, index) => {
                                                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                                                    const isEditing = editingBatchId === batch.id;
                                                    return (
                                                        <div 
                                                            key={batch.id || index} 
                                                            className={cn(
                                                                "px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#0b2527] transition-colors",
                                                                expiryStatus === 'expired' && "bg-red-50/50 dark:bg-red-900/10",
                                                                expiryStatus === 'expiring-soon' && "bg-amber-50/50 dark:bg-amber-900/10"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                                                                        Batch #{batches.length - index}
                                                                    </span>
                                                                    <Badge 
                                                                        variant={batch.status === 'Received' ? 'default' : 'secondary'}
                                                                        className={cn(
                                                                            "text-xs",
                                                                            batch.status === 'Received' && "bg-emerald-500 hover:bg-emerald-500",
                                                                            batch.status === 'Pending' && "bg-amber-500 hover:bg-amber-500 text-white"
                                                                        )}
                                                                    >
                                                                        {batch.status}
                                                                    </Badge>
                                                                    {expiryStatus === 'expired' && (
                                                                        <Badge variant="destructive" className="text-xs gap-1">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Expired
                                                                        </Badge>
                                                                    )}
                                                                    {expiryStatus === 'expiring-soon' && (
                                                                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs gap-1">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Expiring Soon
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-slate-400">
                                                                    Added: {new Date(batch.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-6 text-sm text-slate-700 dark:text-slate-300">
                                                                    <span>Qty: <span className="font-semibold">{batch.quantity}</span></span>
                                                                    <span>Cost: <span className="font-semibold">{formatCurrency(batch.unit_cost || 0)}</span></span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Input 
                                                                                type="date"
                                                                                value={editingBatchExpiry}
                                                                                onChange={(e) => setEditingBatchExpiry(e.target.value)}
                                                                                className="h-8 w-40 text-sm"
                                                                            />
                                                                            <button
                                                                                onClick={() => saveBatchExpiry(batch.id)}
                                                                                disabled={savingBatchExpiry}
                                                                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                                                                                title="Save"
                                                                            >
                                                                                {savingBatchExpiry ? (
                                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                                                                ) : (
                                                                                    <Check className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelEditingBatchExpiry}
                                                                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                                                title="Cancel"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className={cn(
                                                                                "text-sm",
                                                                                expiryStatus === 'expired' && "text-red-600 dark:text-red-400",
                                                                                expiryStatus === 'expiring-soon' && "text-amber-600 dark:text-amber-400",
                                                                                expiryStatus === 'ok' && "text-slate-700 dark:text-slate-300",
                                                                                expiryStatus === 'none' && "text-slate-500 dark:text-slate-400"
                                                                            )}>
                                                                                Expiry: <span className="font-semibold">{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '--'}</span>
                                                                            </span>
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <button
                                                                                            onClick={() => startEditingBatchExpiry(batch.id, batch.expiry_date)}
                                                                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                                                                        >
                                                                                            <Pencil className="w-4 h-4" />
                                                                                        </button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <span className="text-sm">Edit expiry date</span>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end pt-3">
                                    <Button 
                                        variant="outline" 
                                        onClick={closeBatchModal}
                                        className="rounded-full px-8"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className={cn(
                            "fixed inset-0 bg-black/60 transition-opacity duration-200",
                            isDeleteOpen ? "opacity-100" : "opacity-0"
                        )}
                        onClick={closeDeleteModal}
                    />
                    <div className={cn(
                        "relative z-10 w-full max-w-md transition-all duration-200",
                        isDeleteOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}>
                        <div className="rounded-2xl bg-white dark:bg-[#0a2829] shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Delete Item</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={closeDeleteModal}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteItemName}"</span> from the {activeTab.toLowerCase()} inventory?
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This will permanently remove the item and all associated records from the database.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-700/50">
                                <Button 
                                    variant="outline" 
                                    onClick={closeDeleteModal}
                                    className="rounded-full px-5"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleDeleteItem}
                                    className="rounded-full px-5 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Deleting...
                                        </span>
                                    ) : (
                                        'Delete Item'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
