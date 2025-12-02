import { useState } from 'react';
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
  ClipboardCheck
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

// Inventory Items
const inventoryItems = [
  { id: 'INV-001', name: 'Dental Gloves (Box)', category: 'Consumables', stock: 45, minStock: 20, unit: 'boxes', price: 350, expiryDate: '2026-03-15', status: 'normal', lastUpdated: '2025-12-01' },
  { id: 'INV-002', name: 'Face Masks (Box)', category: 'Consumables', stock: 12, minStock: 15, unit: 'boxes', price: 280, expiryDate: '2026-06-20', status: 'low', lastUpdated: '2025-12-02' },
  { id: 'INV-003', name: 'Composite Resin A2', category: 'Restorative', stock: 8, minStock: 5, unit: 'syringes', price: 1200, expiryDate: '2025-12-30', status: 'expiring', lastUpdated: '2025-11-28' },
  { id: 'INV-004', name: 'Dental Needles 27G', category: 'Consumables', stock: 150, minStock: 50, unit: 'pcs', price: 15, expiryDate: '2027-01-10', status: 'normal', lastUpdated: '2025-12-01' },
  { id: 'INV-005', name: 'Lidocaine 2%', category: 'Anesthetics', stock: 3, minStock: 10, unit: 'vials', price: 450, expiryDate: '2026-02-28', status: 'low', lastUpdated: '2025-12-03' },
  { id: 'INV-006', name: 'Alginate Impression', category: 'Impressions', stock: 25, minStock: 10, unit: 'bags', price: 850, expiryDate: '2025-12-15', status: 'expiring', lastUpdated: '2025-11-30' },
  { id: 'INV-007', name: 'Dental Burs (Set)', category: 'Instruments', stock: 18, minStock: 5, unit: 'sets', price: 2500, expiryDate: null, status: 'normal', lastUpdated: '2025-12-01' },
  { id: 'INV-008', name: 'Sterilization Pouches', category: 'Consumables', stock: 200, minStock: 100, unit: 'pcs', price: 8, expiryDate: '2027-06-01', status: 'normal', lastUpdated: '2025-12-02' },
  { id: 'INV-009', name: 'Fluoride Varnish', category: 'Preventive', stock: 6, minStock: 8, unit: 'tubes', price: 650, expiryDate: '2026-01-20', status: 'low', lastUpdated: '2025-12-01' },
  { id: 'INV-010', name: 'Bonding Agent', category: 'Restorative', stock: 4, minStock: 3, unit: 'bottles', price: 1800, expiryDate: '2025-12-10', status: 'expiring', lastUpdated: '2025-11-29' },
];

// Stock Deductions (from Dentist Subsystem)
const stockDeductions = [
  { id: 'DED-001', itemId: 'INV-001', itemName: 'Dental Gloves (Box)', quantity: 2, dentist: 'Dr. Smith', patient: 'Maria Santos', treatment: 'Dental Cleaning', date: '2025-12-03', time: '09:30 AM', status: 'logged' },
  { id: 'DED-002', itemId: 'INV-004', itemName: 'Dental Needles 27G', quantity: 3, dentist: 'Dr. Johnson', patient: 'Juan Dela Cruz', treatment: 'Tooth Extraction', date: '2025-12-03', time: '10:15 AM', status: 'logged' },
  { id: 'DED-003', itemId: 'INV-005', itemName: 'Lidocaine 2%', quantity: 1, dentist: 'Dr. Johnson', patient: 'Juan Dela Cruz', treatment: 'Tooth Extraction', date: '2025-12-03', time: '10:15 AM', status: 'logged' },
  { id: 'DED-004', itemId: 'INV-003', itemName: 'Composite Resin A2', quantity: 1, dentist: 'Dr. Lee', patient: 'Ana Reyes', treatment: 'Dental Filling', date: '2025-12-02', time: '02:30 PM', status: 'logged' },
  { id: 'DED-005', itemId: 'INV-002', itemName: 'Face Masks (Box)', quantity: 1, dentist: 'Dr. Smith', patient: 'Pedro Garcia', treatment: 'Root Canal', date: '2025-12-02', time: '03:00 PM', status: 'logged' },
  { id: 'DED-006', itemId: 'INV-009', itemName: 'Fluoride Varnish', quantity: 1, dentist: 'Dr. Smith', patient: 'Sofia Martinez', treatment: 'Preventive Care', date: '2025-12-01', time: '11:00 AM', status: 'logged' },
];

// Restock Entries (from Inventory Manager)
const restockEntries = [
  { id: 'RST-001', itemId: 'INV-002', itemName: 'Face Masks (Box)', quantity: 20, supplier: 'MedSupply Co.', cost: 5600, enteredBy: 'John Doe', date: '2025-12-03', status: 'pending', notes: 'Regular monthly restock' },
  { id: 'RST-002', itemId: 'INV-005', itemName: 'Lidocaine 2%', quantity: 15, supplier: 'PharmaDent Inc.', cost: 6750, enteredBy: 'John Doe', date: '2025-12-03', status: 'pending', notes: 'Urgent restock - low stock alert' },
  { id: 'RST-003', itemId: 'INV-009', itemName: 'Fluoride Varnish', quantity: 10, supplier: 'DentalCare Ltd.', cost: 6500, enteredBy: 'Jane Smith', date: '2025-12-02', status: 'approved', notes: 'Approved by Admin', approvedBy: 'Admin', approvedDate: '2025-12-02' },
  { id: 'RST-004', itemId: 'INV-003', itemName: 'Composite Resin A2', quantity: 12, supplier: 'DentalCare Ltd.', cost: 14400, enteredBy: 'Jane Smith', date: '2025-12-01', status: 'approved', notes: 'New batch with later expiry', approvedBy: 'Admin', approvedDate: '2025-12-01' },
  { id: 'RST-005', itemId: 'INV-006', itemName: 'Alginate Impression', quantity: 8, supplier: 'MedSupply Co.', cost: 6800, enteredBy: 'John Doe', date: '2025-11-30', status: 'rejected', notes: 'Rejected - incorrect supplier quote', rejectedBy: 'Admin', rejectedDate: '2025-12-01' },
];

// Low Stock Items
const lowStockItems = inventoryItems.filter(item => item.status === 'low');

// Expiring Items (within 30 days)
const expiringItems = inventoryItems.filter(item => item.status === 'expiring');

// Stats
const inventoryStats = [
  { title: 'Total Items', value: inventoryItems.length.toString(), icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Low Stock', value: lowStockItems.length.toString(), icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { title: 'Expiring Soon', value: expiringItems.length.toString(), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  { title: 'Pending Restocks', value: restockEntries.filter(r => r.status === 'pending').length.toString(), icon: ClipboardCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

type TabType = 'items' | 'deductions' | 'restocks' | 'alerts';

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restockFilter, setRestockFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof inventoryItems[0] | null>(null);

  const openDetailModal = (item: typeof inventoryItems[0]) => {
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

  const categories = [...new Set(inventoryItems.map(item => item.category))];

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
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approved':
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

  const getItemDeductions = (itemId: string) => stockDeductions.filter(d => d.itemId === itemId);
  const getItemRestocks = (itemId: string) => restockEntries.filter(r => r.itemId === itemId);

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
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
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
                          item.status === 'low' ? 'bg-amber-500/10' : 'bg-destructive/10'
                        )}>
                          <Box className={cn("w-5 h-5",
                            item.status === 'normal' ? 'text-primary' :
                            item.status === 'low' ? 'text-amber-500' : 'text-destructive'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold group-hover:text-primary transition-colors">{item.name}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(item.status))}>
                              {getStatusIcon(item.status)}
                              {item.status === 'normal' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Expiring Soon'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.id} • {item.category}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Min: {item.minStock} {item.unit}</span>
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
                            item.status === 'low' ? 'text-amber-500' : 'text-destructive'
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
                          entry.status === 'approved' ? 'bg-emerald-500/10' : 'bg-destructive/10'
                        )}>
                          <Plus className={cn("w-5 h-5",
                            entry.status === 'pending' ? 'text-amber-500' :
                            entry.status === 'approved' ? 'text-emerald-500' : 'text-destructive'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{entry.itemName}</p>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(entry.status))}>
                              {getStatusIcon(entry.status)}
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Supplier: {entry.supplier} • Cost: ₱{entry.cost.toLocaleString()}
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
                            entry.status === 'approved' ? 'text-emerald-500' : 'text-destructive'
                          )}>+{entry.quantity}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                        </div>
                        {entry.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive">
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
                      selectedItem.status === 'low' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-destructive/10 border-destructive/20'
                    )}>
                      <p className="text-xs text-muted-foreground">Current Stock</p>
                      <p className={cn("text-3xl font-bold",
                        selectedItem.status === 'normal' ? 'text-primary' :
                        selectedItem.status === 'low' ? 'text-amber-500' : 'text-destructive'
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
                      <p className="text-2xl font-bold">₱{selectedItem.price}</p>
                      <p className="text-xs text-muted-foreground">per {selectedItem.unit.slice(0, -1)}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className={cn("mt-1", getStatusColor(selectedItem.status))}>
                        {getStatusIcon(selectedItem.status)}
                        {selectedItem.status === 'normal' ? 'In Stock' : selectedItem.status === 'low' ? 'Low Stock' : 'Expiring Soon'}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="text-sm font-medium mt-1">{selectedItem.category}</p>
                    </div>
                    {selectedItem.expiryDate && (
                      <div className={cn("p-3 rounded-lg", selectedItem.status === 'expiring' ? 'bg-destructive/10' : 'bg-muted/50')}>
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        <p className={cn("text-sm font-medium mt-1", selectedItem.status === 'expiring' ? 'text-destructive' : '')}>
                          {new Date(selectedItem.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(selectedItem.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Recent Deductions */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Recent Deductions
                    </h4>
                    {getItemDeductions(selectedItem.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">No recent deductions</p>
                    ) : (
                      <div className="space-y-2">
                        {getItemDeductions(selectedItem.id).slice(0, 3).map((ded, idx) => (
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
                    {getItemRestocks(selectedItem.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">No recent restocks</p>
                    ) : (
                      <div className="space-y-2">
                        {getItemRestocks(selectedItem.id).slice(0, 3).map((entry, idx) => (
                          <div key={idx} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{entry.supplier}</p>
                                <Badge variant="outline" className={cn("text-xs", getStatusColor(entry.status))}>
                                  {entry.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{entry.enteredBy}</p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-sm font-bold",
                                entry.status === 'approved' ? 'text-emerald-500' :
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
