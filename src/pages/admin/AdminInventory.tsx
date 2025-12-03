import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingDown,
  ChevronRight,
  Box,
  Minus,
  Plus,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import supabase from '@/utils/supabase';

// Types for inventory data
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  expiryDate: string | null;
  status: 'normal' | 'low' | 'expiring' | 'critical';
  lastUpdated: string;
  supplier?: string;
}

interface StockDeduction {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  dentist: string;
  patient: string;
  treatment: string;
  date: string;
  time: string;
  status: string;
  category: string;
}

interface RestockEntry {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  supplier: string;
  cost: number;
  enteredBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'received';
  notes: string;
  category: string;
}

type TabType = 'items' | 'deductions' | 'restocks' | 'alerts';

// Helper function to determine item status based on quantity and expiry
function calculateStatus(quantity: number, minStock: number, expiryDate: string | null): 'normal' | 'low' | 'expiring' | 'critical' {
  const isLowStock = quantity <= minStock;
  const isCritical = quantity === 0;
  
  // Check if expiring within 30 days
  let isExpiring = false;
  if (expiryDate) {
    const expDate = new Date(expiryDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpiring = diffDays <= 30 && diffDays > 0;
  }

  if (isCritical) return 'critical';
  if (isExpiring) return 'expiring';
  if (isLowStock) return 'low';
  return 'normal';
}

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restockFilter, setRestockFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Data state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockDeductions, setStockDeductions] = useState<StockDeduction[]>([]);
  const [restockEntries, setRestockEntries] = useState<RestockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInventoryItems(),
        fetchStockDeductions(),
        fetchRestockEntries()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      // Fetch from all three inventory tables
      const [consumables, medicines, equipment] = await Promise.all([
        supabase.schema('inventory').from('consumables_tbl').select('*'),
        supabase.schema('inventory').from('medicine_tbl').select('*'),
        supabase.schema('inventory').from('equipment_tbl').select('*')
      ]);

      const items: InventoryItem[] = [];
      const minStockThreshold = 10; // Default minimum stock threshold

      // Map Consumables
      (consumables.data || []).forEach((item: any) => {
        const status = calculateStatus(item.quantity || 0, minStockThreshold, item.expiry_date);
        items.push({
          id: `CON-${item.consumables_id}`,
          name: item.consumable_name,
          category: 'Consumables',
          stock: item.quantity || 0,
          minStock: minStockThreshold,
          unit: 'units',
          price: item.unit_cost || 0,
          expiryDate: item.expiry_date || null,
          status,
          lastUpdated: item.created_at || new Date().toISOString(),
          supplier: item.supplier_name || item.supplier || '--'
        });
      });

      // Map Medicines
      (medicines.data || []).forEach((item: any) => {
        const status = calculateStatus(item.quantity || 0, minStockThreshold, item.expiry_date);
        items.push({
          id: `MED-${item.medicine_id}`,
          name: item.medicine_name,
          category: 'Medicines',
          stock: item.quantity || 0,
          minStock: minStockThreshold,
          unit: 'units',
          price: item.unit_cost || 0,
          expiryDate: item.expiry_date || null,
          status,
          lastUpdated: new Date().toISOString(),
          supplier: item.supplier_name || '--'
        });
      });

      // Map Equipment
      (equipment.data || []).forEach((item: any) => {
        const status = calculateStatus(item.quantity || 0, 5, item.expiry_date); // Equipment has lower minStock
        items.push({
          id: `EQP-${item.equipment_id}`,
          name: item.equipment_name,
          category: 'Equipment',
          stock: item.quantity || 0,
          minStock: 5,
          unit: 'units',
          price: item.unit_cost || 0,
          expiryDate: item.expiry_date || null,
          status,
          lastUpdated: new Date().toISOString(),
          supplier: item.supplier_name || '--'
        });
      });

      setInventoryItems(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const fetchStockDeductions = async () => {
    try {
      const { data, error } = await supabase
        .schema('inventory')
        .from('stock_out')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const deductions: StockDeduction[] = (data || []).map((item: any) => {
        const dateObj = item.created_at ? new Date(item.created_at) : new Date();
        return {
          id: `DED-${item.id}`,
          itemId: item.reference || `SO-${item.id}`,
          itemName: item.item_name || 'Unknown Item',
          quantity: item.quantity || 0,
          dentist: item.user_name || 'Staff',
          patient: 'N/A', // Not stored in stock_out table
          treatment: item.notes || 'Stock Out',
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'logged',
          category: item.category || 'Consumables'
        };
      });

      setStockDeductions(deductions);
    } catch (error) {
      console.error('Error fetching stock deductions:', error);
    }
  };

  const fetchRestockEntries = async () => {
    try {
      const { data, error } = await supabase
        .schema('inventory')
        .from('stock_in')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: RestockEntry[] = (data || []).map((item: any) => {
        const dateObj = item.created_at ? new Date(item.created_at) : new Date();
        // Map status: Pending -> pending, Received -> approved, Cancelled -> rejected
        let mappedStatus: 'pending' | 'approved' | 'rejected' | 'received' = 'pending';
        if (item.status === 'Received') mappedStatus = 'approved';
        else if (item.status === 'Cancelled') mappedStatus = 'rejected';
        else if (item.status === 'Pending') mappedStatus = 'pending';

        return {
          id: `RST-${item.id.slice(0, 8)}`,
          itemId: item.id,
          itemName: item.item_name || 'Unknown Item',
          quantity: item.quantity || 0,
          supplier: item.supplier || 'Unknown Supplier',
          cost: (item.quantity || 0) * (item.unit_cost || 0),
          enteredBy: item.created_by || 'Inventory Manager',
          date: dateObj.toISOString().split('T')[0],
          status: mappedStatus,
          notes: item.lock_until ? 'Order placed' : 'Direct restock',
          category: item.category || 'Consumables'
        };
      });

      setRestockEntries(entries);
    } catch (error) {
      console.error('Error fetching restock entries:', error);
    }
  };

  // Approve/Reject restock entry
  const handleRestockAction = async (entryId: string, action: 'approve' | 'reject') => {
    try {
      // Find the entry to get the full ID (since we truncated it)
      const entry = restockEntries.find(e => e.id === entryId);
      if (!entry) return;

      const newStatus = action === 'approve' ? 'Received' : 'Cancelled';
      
      const { error } = await supabase
        .schema('inventory')
        .from('stock_in')
        .update({ status: newStatus })
        .eq('id', entry.itemId);

      if (error) throw error;

      // If approved and not already moved to inventory, move it
      if (action === 'approve') {
        const stockInEntry = restockEntries.find(e => e.id === entryId);
        if (stockInEntry) {
          // Determine target table
          let targetTable = 'consumables_tbl';
          let nameColumn = 'consumable_name';
          
          if (stockInEntry.category === 'Medicines' || stockInEntry.category === 'medicine') {
            targetTable = 'medicine_tbl';
            nameColumn = 'medicine_name';
          } else if (stockInEntry.category === 'Equipment' || stockInEntry.category === 'equipment') {
            targetTable = 'equipment_tbl';
            nameColumn = 'equipment_name';
          }

          // Check if item already exists in inventory (by name)
          const { data: existingItems } = await supabase
            .schema('inventory')
            .from(targetTable)
            .select('*')
            .eq(nameColumn, stockInEntry.itemName);

          if (existingItems && existingItems.length > 0) {
            // Update existing item quantity
            const idColumn = targetTable === 'consumables_tbl' ? 'consumables_id' : 
                            targetTable === 'medicine_tbl' ? 'medicine_id' : 'equipment_id';
            const existingItem = existingItems[0];
            const currentQty = existingItem.quantity || 0;
            
            await supabase
              .schema('inventory')
              .from(targetTable)
              .update({ quantity: currentQty + stockInEntry.quantity })
              .eq(idColumn, existingItem[idColumn]);
          } else {
            // Insert new item
            const payload: any = {
              [nameColumn]: stockInEntry.itemName,
              quantity: stockInEntry.quantity,
              supplier_name: stockInEntry.supplier
            };

            await supabase
              .schema('inventory')
              .from(targetTable)
              .insert(payload);
          }
        }
      }

      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error updating restock entry:', error);
      alert('Failed to update restock entry');
    }
  };

  // Computed values
  const lowStockItems = useMemo(() => 
    inventoryItems.filter(item => item.status === 'low' || item.status === 'critical'),
    [inventoryItems]
  );

  const expiringItems = useMemo(() => 
    inventoryItems.filter(item => item.status === 'expiring'),
    [inventoryItems]
  );

  const pendingRestocks = useMemo(() => 
    restockEntries.filter(r => r.status === 'pending'),
    [restockEntries]
  );

  const inventoryStats = useMemo(() => [
    { title: 'Total Items', value: inventoryItems.length.toString(), icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Low Stock', value: lowStockItems.length.toString(), icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Expiring Soon', value: expiringItems.length.toString(), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { title: 'Pending Restocks', value: pendingRestocks.length.toString(), icon: ClipboardCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ], [inventoryItems, lowStockItems, expiringItems, pendingRestocks]);

  const categories = useMemo(() => 
    [...new Set(inventoryItems.map(item => item.category))],
    [inventoryItems]
  );

  const openDetailModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setTimeout(() => setIsDetailOpen(true), 10);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setShowDetailModal(false);
      setSelectedItem(null);
    }, 200);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredDeductions = stockDeductions.filter(ded =>
    ded.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ded.dentist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ded.patient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRestocks = restockEntries.filter(entry => {
    const matchesSearch = entry.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = restockFilter === 'all' || entry.status === restockFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'low':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'expiring':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'critical':
        return 'bg-red-600/10 text-red-600 border-red-600/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approved':
      case 'received':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'logged':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'approved':
      case 'received':
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'low':
        return <TrendingDown className="w-3 h-3 mr-1" />;
      case 'expiring':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'rejected':
        return <X className="w-3 h-3 mr-1" />;
      case 'logged':
        return <Minus className="w-3 h-3 mr-1" />;
      case 'critical':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'items', label: 'All Items', icon: Package },
    { id: 'deductions', label: 'Stock Deductions', icon: Minus },
    { id: 'restocks', label: 'Restock Entries', icon: Plus },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  // Get deductions and restocks by item name (since IDs don't directly match)
  const getItemDeductions = (itemName: string) => 
    stockDeductions.filter(d => d.itemName.toLowerCase() === itemName.toLowerCase());
  const getItemRestocks = (itemName: string) => 
    restockEntries.filter(r => r.itemName.toLowerCase() === itemName.toLowerCase());

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Package className="w-8 h-8 text-primary" />
                Inventory Management
              </CardTitle>
              <p className="text-muted-foreground">
                Complete oversight of clinic supplies, stock activities, and restocking
              </p>
            </div>
            <Button onClick={fetchAllData} variant="outline" className="gap-2">
              <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventoryStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs & Content */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'alerts' && (lowStockItems.length + expiringItems.length > 0) && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {lowStockItems.length + expiringItems.length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === 'items' && (
                <>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-36">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="normal">In Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {activeTab === 'restocks' && (
                <Select value={restockFilter} onValueChange={setRestockFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* All Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No inventory items found</p>
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => openDetailModal(item)}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg",
                          item.status === 'normal' ? 'bg-primary/10' :
                          item.status === 'low' ? 'bg-amber-500/10' : 
                          item.status === 'critical' ? 'bg-red-600/10' : 'bg-destructive/10'
                        )}>
                          <Box className={cn("w-5 h-5",
                            item.status === 'normal' ? 'text-primary' :
                            item.status === 'low' ? 'text-amber-500' : 
                            item.status === 'critical' ? 'text-red-600' : 'text-destructive'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold group-hover:text-primary transition-colors">{item.name}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(item.status))}>
                              {getStatusIcon(item.status)}
                              {item.status === 'normal' ? 'In Stock' : 
                               item.status === 'low' ? 'Low Stock' : 
                               item.status === 'critical' ? 'Critical' : 'Expiring Soon'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.id} • {item.category}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span>Min: {item.minStock} {item.unit}</span>
                            {item.supplier && item.supplier !== '--' && (
                              <span>Supplier: {item.supplier}</span>
                            )}
                            {item.expiryDate && (
                              <span className={cn("flex items-center gap-1",
                                item.status === 'expiring' ? 'text-destructive' : ''
                              )}>
                                <Calendar className="w-3 h-3" />
                                Exp: {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold",
                            item.status === 'normal' ? 'text-primary' :
                            item.status === 'low' ? 'text-amber-500' : 
                            item.status === 'critical' ? 'text-red-600' : 'text-destructive'
                          )}>
                            {item.stock}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Stock Deductions Tab */}
          {activeTab === 'deductions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Automatic stock deductions logged from the Dentist Subsystem after treatments
                </p>
              </div>
              {filteredDeductions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Minus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No stock deductions found</p>
                </div>
              ) : (
                filteredDeductions.map((ded, index) => (
                  <motion.div
                    key={ded.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <Minus className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{ded.itemName}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(ded.status))}>
                              {getStatusIcon(ded.status)}
                              Logged
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Treatment: {ded.treatment} • Patient: {ded.patient}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By {ded.dentist} • {new Date(ded.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {ded.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-500">-{ded.quantity}</p>
                        <p className="text-xs text-muted-foreground">units deducted</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Restock Entries Tab */}
          {activeTab === 'restocks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Restock entries recorded by inventory manager for verification and approval
                </p>
              </div>
              {filteredRestocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No restock entries found</p>
                </div>
              ) : (
                filteredRestocks.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg",
                          entry.status === 'pending' ? 'bg-amber-500/10' :
                          entry.status === 'approved' || entry.status === 'received' ? 'bg-emerald-500/10' : 'bg-destructive/10'
                        )}>
                          <Plus className={cn("w-5 h-5",
                            entry.status === 'pending' ? 'text-amber-500' :
                            entry.status === 'approved' || entry.status === 'received' ? 'text-emerald-500' : 'text-destructive'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{entry.itemName}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(entry.status))}>
                              {getStatusIcon(entry.status)}
                              {entry.status === 'approved' ? 'Received' : entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-muted">
                              {entry.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Supplier: {entry.supplier} {entry.cost > 0 && `• Cost: ₱${entry.cost.toLocaleString()}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By {entry.enteredBy} • {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{entry.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn("text-xl font-bold",
                            entry.status === 'pending' ? 'text-amber-500' :
                            entry.status === 'approved' || entry.status === 'received' ? 'text-emerald-500' : 'text-destructive'
                          )}>+{entry.quantity}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                        </div>
                        {entry.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleRestockAction(entry.id, 'approve')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRestockAction(entry.id, 'reject')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Low Stock Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingDown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Low Stock Items</h3>
                    <p className="text-sm text-muted-foreground">Items below minimum stock level</p>
                  </div>
                </div>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p>All items are well stocked</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lowStockItems.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-amber-500">{item.stock}</p>
                            <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expiring Soon Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Expiring Soon</h3>
                    <p className="text-sm text-muted-foreground">Items expiring within 30 days</p>
                  </div>
                </div>
                {expiringItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p>No items expiring soon</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {expiringItems.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-destructive">
                              {item.expiryDate && new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.stock} {item.unit}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isDetailOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
            onClick={closeDetailModal}
          />
          <div
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isDetailOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg overflow-hidden bg-card shadow-2xl m-4 border flex flex-col">
              {/* Modal Header */}
              <div className="bg-[#00a8a8] px-5 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <Box className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                    <p className="text-sm text-white/70">{selectedItem.id} • {selectedItem.category}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="hover:bg-white/20 rounded p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                  {/* Stock Status */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={cn("p-4 rounded-lg border text-center",
                      selectedItem.status === 'normal' ? 'bg-primary/10 border-primary/20' :
                      selectedItem.status === 'low' ? 'bg-amber-500/10 border-amber-500/20' : 
                      selectedItem.status === 'critical' ? 'bg-red-600/10 border-red-600/20' : 'bg-destructive/10 border-destructive/20'
                    )}>
                      <p className="text-xs text-muted-foreground">Current Stock</p>
                      <p className={cn("text-3xl font-bold",
                        selectedItem.status === 'normal' ? 'text-primary' :
                        selectedItem.status === 'low' ? 'text-amber-500' : 
                        selectedItem.status === 'critical' ? 'text-red-600' : 'text-destructive'
                      )}>{selectedItem.stock}</p>
                      <p className="text-xs text-muted-foreground">{selectedItem.unit}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Min Stock</p>
                      <p className="text-3xl font-bold">{selectedItem.minStock}</p>
                      <p className="text-xs text-muted-foreground">{selectedItem.unit}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Unit Price</p>
                      <p className="text-2xl font-bold">₱{selectedItem.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per unit</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className={cn("mt-1", getStatusColor(selectedItem.status))}>
                        {getStatusIcon(selectedItem.status)}
                        {selectedItem.status === 'normal' ? 'In Stock' : 
                         selectedItem.status === 'low' ? 'Low Stock' : 
                         selectedItem.status === 'critical' ? 'Critical' : 'Expiring Soon'}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="text-sm font-medium mt-1">{selectedItem.category}</p>
                    </div>
                    {selectedItem.supplier && selectedItem.supplier !== '--' && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Supplier</p>
                        <p className="text-sm font-medium mt-1">{selectedItem.supplier}</p>
                      </div>
                    )}
                    {selectedItem.expiryDate && (
                      <div className={cn("p-3 rounded-lg", selectedItem.status === 'expiring' ? 'bg-destructive/10' : 'bg-muted/50')}>
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        <p className={cn("text-sm font-medium mt-1", selectedItem.status === 'expiring' ? 'text-destructive' : '')}>
                          {new Date(selectedItem.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recent Deductions */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Recent Deductions
                    </h4>
                    {getItemDeductions(selectedItem.name).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">No recent deductions</p>
                    ) : (
                      <div className="space-y-2">
                        {getItemDeductions(selectedItem.name).slice(0, 3).map((ded, idx) => (
                          <div key={idx} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{ded.treatment}</p>
                              <p className="text-xs text-muted-foreground">{ded.dentist} • {ded.patient}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-500">-{ded.quantity}</p>
                              <p className="text-xs text-muted-foreground">{ded.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Restocks */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Recent Restocks
                    </h4>
                    {getItemRestocks(selectedItem.name).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">No recent restocks</p>
                    ) : (
                      <div className="space-y-2">
                        {getItemRestocks(selectedItem.name).slice(0, 3).map((entry, idx) => (
                          <div key={idx} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{entry.supplier}</p>
                                <Badge variant="outline" className={cn("text-xs", getStatusColor(entry.status))}>
                                  {entry.status === 'approved' ? 'Received' : entry.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{entry.enteredBy}</p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-sm font-bold",
                                entry.status === 'approved' || entry.status === 'received' ? 'text-emerald-500' :
                                entry.status === 'pending' ? 'text-amber-500' : 'text-destructive'
                              )}>+{entry.quantity}</p>
                              <p className="text-xs text-muted-foreground">{entry.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-end shrink-0">
                <Button variant="outline" onClick={closeDetailModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
