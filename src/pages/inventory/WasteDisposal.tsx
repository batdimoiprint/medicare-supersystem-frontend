import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Trash2, AlertTriangle, Calendar, DollarSign, Plus, Search, MessageSquare } from 'lucide-react'
import supabase from '@/utils/supabase'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WasteItem {
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
    reason: 'Damaged' | 'Expired' | 'Contaminated' | 'Defective' | 'Other';
    disposal_date: string;
    value_lost: number;
    status: 'Pending' | 'Disposed';
    notes?: string;
    created_at: string;
}

type FilterType = 'all' | 'Pending' | 'Disposed';

export default function WasteDisposal() {
    const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterType>('all');

    // Form state
    const [formData, setFormData] = useState({
        item_name: '',
        quantity: 0,
        unit: 'boxes',
        reason: '' as WasteItem['reason'] | '',
        disposal_date: '',
        value_lost: 0,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Notes modal state
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedItemNotes, setSelectedItemNotes] = useState<{ id: string; notes: string; itemName: string } | null>(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<WasteItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchWasteItems();
    }, []);

    const fetchWasteItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .schema('inventory')
                .from('waste_disposal')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWasteItems(data || []);
        } catch (error) {
            console.error('Error fetching waste items:', error);
            // If table doesn't exist, use empty array
            setWasteItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.item_name || !formData.reason || !formData.disposal_date) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const newItem = {
                id: crypto.randomUUID(),
                item_name: formData.item_name,
                quantity: formData.quantity,
                unit: formData.unit,
                reason: formData.reason,
                disposal_date: formData.disposal_date,
                value_lost: formData.value_lost,
                status: 'Pending',
                notes: formData.notes || null,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .schema('inventory')
                .from('waste_disposal')
                .insert(newItem);

            if (error) throw error;

            // Add to local state
            setWasteItems(prev => [newItem as WasteItem, ...prev]);

            // Reset form
            setFormData({
                item_name: '',
                quantity: 0,
                unit: 'boxes',
                reason: '',
                disposal_date: '',
                value_lost: 0,
                notes: ''
            });
        } catch (error: any) {
            console.error('Error adding waste item:', error);
            alert('Failed to add waste item: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, newStatus: 'Pending' | 'Disposed') => {
        try {
            const { error } = await supabase
                .schema('inventory')
                .from('waste_disposal')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setWasteItems(prev => prev.map(item =>
                item.id === id ? { ...item, status: newStatus } : item
            ));
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert('Failed to update status: ' + error.message);
        }
    };

    const openNotesModal = (item: WasteItem) => {
        setSelectedItemNotes({ id: item.id, notes: item.notes || '', itemName: item.item_name });
        setShowNotesModal(true);
    };

    const openDeleteModal = (item: WasteItem) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .schema('inventory')
                .from('waste_disposal')
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;

            // Remove from local state
            setWasteItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter and search
    const filteredItems = wasteItems.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const totalWasteItems = wasteItems.length;
    const pendingDisposal = wasteItems.filter(item => item.status === 'Pending').length;
    const thisMonth = wasteItems.filter(item => {
        const itemDate = new Date(item.disposal_date);
        const now = new Date();
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }).length;
    const totalValueLost = wasteItems.reduce((sum, item) => sum + (item.value_lost || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(value);
    };

    const getReasonBadge = (reason: string) => {
        const styles: Record<string, string> = {
            'Damaged': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
            'Expired': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
            'Contaminated': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
            'Defective': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
            'Other': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        };
        return (
            <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                styles[reason] || styles['Other']
            )}>
                {reason}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Disposed': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
        };
        return (
            <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                styles[status]
            )}>
                {status}
            </span>
        );
    };

    return (
        <div className="px-6 md:px-12">
            <div className="w-full max-w-screen-2xl mx-auto space-y-6">
                {/* Header Card */}
                <Card className="w-full py-3 -mt-2">
                    <CardHeader className="px-6 py-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-3xl mb-0 flex items-center gap-3">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                    Waste & Disposal
                                </CardTitle>
                                <p className="text-muted-foreground">Track and manage disposed inventory items</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Waste Items</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalWasteItems}</p>
                            </div>
                            <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Pending Disposal</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingDisposal}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{thisMonth}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-cyan-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Value Lost</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalValueLost)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Waste Item Form */}
                <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Plus className="w-5 h-5" />
                            Add Waste Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="item_name">
                                    Item Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="item_name"
                                    placeholder="Enter Item Name"
                                    value={formData.item_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    Quantity <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.quantity || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">
                                    Disposal Reason <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.reason}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value as WasteItem['reason'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Damaged">Damaged</SelectItem>
                                        <SelectItem value="Expired">Expired</SelectItem>
                                        <SelectItem value="Contaminated">Contaminated</SelectItem>
                                        <SelectItem value="Defective">Defective</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="disposal_date">
                                    Disposal Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="disposal_date"
                                    type="date"
                                    value={formData.disposal_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, disposal_date: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value_lost">Value Lost (₱)</Label>
                                <Input
                                    id="value_lost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.value_lost || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, value_lost: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Additional notes..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Waste Item'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Waste & Disposal Log */}
                <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Trash2 className="w-5 h-5" />
                                Waste & Disposal Log ({filteredItems.length} items)
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search waste items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-[200px]"
                                    />
                                </div>
                                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterType)}>
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Disposed">Disposed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                                <Trash2 className="w-12 h-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">No waste items found</p>
                                <p className="text-sm">Add a waste item using the form on the left</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Item</th>
                                            <th className="px-4 py-3 font-medium">Quantity</th>
                                            <th className="px-4 py-3 font-medium">Reason</th>
                                            <th className="px-4 py-3 font-medium">Disposal Date</th>
                                            <th className="px-4 py-3 font-medium">Value Lost</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {filteredItems.map((item) => (
                                            <tr key={item.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                                                    {item.item_name}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {getReasonBadge(item.reason)}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                                    {new Date(item.disposal_date).toLocaleDateString('en-US', {
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-4 py-4 text-red-600 dark:text-red-400 font-medium">
                                                    {formatCurrency(item.value_lost)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={item.status}
                                                            onValueChange={(v) => updateStatus(item.id, v as 'Pending' | 'Disposed')}
                                                        >
                                                            <SelectTrigger className="h-8 w-[100px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Pending">Pending</SelectItem>
                                                                <SelectItem value="Disposed">Disposed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => openNotesModal(item)}
                                                                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {item.notes || 'No notes'}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => openDeleteModal(item)}
                                                                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Delete item
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
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={() => setShowDeleteModal(false)} 
                    />
                    <div className="relative z-10 bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Delete Waste Item</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Are you sure you want to delete <strong>{itemToDelete.item_name}</strong>? 
                            This will permanently remove it from the database.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && selectedItemNotes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={() => setShowNotesModal(false)} 
                    />
                    <div className="relative z-10 bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-lg font-semibold mb-2">Notes for {selectedItemNotes.itemName}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                            {selectedItemNotes.notes || 'No notes available for this item.'}
                        </p>
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
