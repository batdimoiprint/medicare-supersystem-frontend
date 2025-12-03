import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  PhilippinePeso, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Shield,
  CreditCard,
  Banknote,
  X,
  Package,
  Search
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

// --- Dummy Data ---
const dashboardStats = [
  { 
    title: "Total Revenue", 
    value: "₱2,543,000", 
    change: "+12.5%", 
    trend: "up",
    icon: PhilippinePeso,
    color: "text-primary",
  },
  { 
    title: "Total Patients", 
    value: "1,234", 
    change: "+5.2%", 
    trend: "up",
    icon: Users,
    color: "text-primary",
  },
  { 
    title: "Appointments", 
    value: "456", 
    change: "-2.1%", 
    trend: "down",
    icon: Activity,
    color: "text-primary",
  },
  { 
    title: "Low Stock Items", 
    value: "12", 
    change: "+3", 
    trend: "down",
    icon: AlertTriangle,
    color: "text-destructive",
  }
];

// Revenue data for different time periods
const dailyRevenueData = [
  { name: 'Mon', paymongo: 12500, cash: 8200, total: 20700 },
  { name: 'Tue', paymongo: 15300, cash: 9100, total: 24400 },
  { name: 'Wed', paymongo: 11200, cash: 7800, total: 19000 },
  { name: 'Thu', paymongo: 18400, cash: 11500, total: 29900 },
  { name: 'Fri', paymongo: 22100, cash: 14200, total: 36300 },
  { name: 'Sat', paymongo: 25600, cash: 16800, total: 42400 },
  { name: 'Sun', paymongo: 8900, cash: 5400, total: 14300 },
];

const weeklyRevenueData = [
  { name: 'Week 1', paymongo: 85000, cash: 52000, total: 137000 },
  { name: 'Week 2', paymongo: 92000, cash: 61000, total: 153000 },
  { name: 'Week 3', paymongo: 78000, cash: 48000, total: 126000 },
  { name: 'Week 4', paymongo: 105000, cash: 72000, total: 177000 },
];

const monthlyRevenueData = [
  { name: 'Jan', paymongo: 320000, cash: 180000, total: 500000 },
  { name: 'Feb', paymongo: 280000, cash: 160000, total: 440000 },
  { name: 'Mar', paymongo: 350000, cash: 200000, total: 550000 },
  { name: 'Apr', paymongo: 310000, cash: 175000, total: 485000 },
  { name: 'May', paymongo: 295000, cash: 165000, total: 460000 },
  { name: 'Jun', paymongo: 380000, cash: 220000, total: 600000 },
  { name: 'Jul', paymongo: 420000, cash: 250000, total: 670000 },
];

const lowStockItems = [
  { name: "Lidocaine Injection", stock: 15, min: 50, unit: "vials", category: "Medicine" },
  { name: "Dental Floss", stock: 8, min: 30, unit: "boxes", category: "Consumable" },
  { name: "Latex Gloves (M)", stock: 120, min: 500, unit: "pairs", category: "Consumable" },
  { name: "Composite Resin", stock: 3, min: 10, unit: "tubes", category: "Medicine" },
  { name: "Disposable Syringes", stock: 45, min: 200, unit: "pcs", category: "Consumable" },
  { name: "Dental Mirrors", stock: 5, min: 20, unit: "pcs", category: "Equipment" },
  { name: "Cotton Rolls", stock: 80, min: 300, unit: "pcs", category: "Consumable" },
  { name: "Anesthetic Cartridges", stock: 12, min: 50, unit: "pcs", category: "Medicine" },
  { name: "Sterilization Pouches", stock: 25, min: 100, unit: "pcs", category: "Consumable" },
  { name: "Dental Burs", stock: 8, min: 30, unit: "pcs", category: "Equipment" },
  { name: "Impression Material", stock: 2, min: 10, unit: "kits", category: "Consumable" },
  { name: "Fluoride Gel", stock: 4, min: 15, unit: "tubes", category: "Medicine" },
];

// --- Components ---

const StatCard = ({ stat, index }: { stat: typeof dashboardStats[0], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", 
              stat.trend === 'up' ? "text-emerald-500" : "text-rose-500"
            )}>
              {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.change}
            </div>
          </div>
          <stat.icon className={cn("w-8 h-8", stat.color)} />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AdminDashboard() {
  const [revenueFilter, setRevenueFilter] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [isLowStockOpen, setIsLowStockOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLowStockItems = lowStockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openLowStockModal = () => {
    setShowLowStockModal(true);
    setTimeout(() => setIsLowStockOpen(true), 10);
  };

  const closeLowStockModal = () => {
    setIsLowStockOpen(false);
    setTimeout(() => setShowLowStockModal(false), 200);
  };

  // Get data based on filter
  const getRevenueData = () => {
    switch (revenueFilter) {
      case 'daily': return dailyRevenueData;
      case 'weekly': return weeklyRevenueData;
      case 'monthly': return monthlyRevenueData;
    }
  };

  // Calculate current month totals
  const currentMonthPaymongo = 420000; // July Paymongo
  const currentMonthCash = 250000; // July Cash
  const currentMonthTotal = currentMonthPaymongo + currentMonthCash;
  const previousMonthTotal = 600000; // June total
  const revenueChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </CardTitle>
              <p className="text-muted-foreground">
                System Overview & Controls
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Operational
              </div>
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Security Log
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  {revenueFilter === 'daily' && 'Daily revenue for this week'}
                  {revenueFilter === 'weekly' && 'Weekly revenue for this month'}
                  {revenueFilter === 'monthly' && 'Monthly revenue performance'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={revenueFilter === 'daily' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRevenueFilter('daily')}
                  className="text-xs px-3"
                >
                  Daily
                </Button>
                <Button
                  variant={revenueFilter === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRevenueFilter('weekly')}
                  className="text-xs px-3"
                >
                  Weekly
                </Button>
                <Button
                  variant={revenueFilter === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRevenueFilter('monthly')}
                  className="text-xs px-3"
                >
                  Monthly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="h-[300px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getRevenueData()}>
                  <defs>
                    <linearGradient id="colorPaymongo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paymongo" 
                    name="Paymongo"
                    stroke="#06b6d4" 
                    fillOpacity={1} 
                    fill="url(#colorPaymongo)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cash" 
                    name="Cash"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorCash)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-sm text-muted-foreground">Paymongo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Cash</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Summary Card */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PhilippinePeso className="w-5 h-5 text-primary" />
              Revenue Summary
            </CardTitle>
            <CardDescription>Current month (December 2025)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Total Revenue */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(currentMonthTotal)}</p>
              <div className={cn("flex items-center gap-1 text-xs font-medium mt-2", 
                Number(revenueChange) >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {Number(revenueChange) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {revenueChange}% from last month
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <CreditCard className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Paymongo</p>
                    <p className="text-xs text-muted-foreground">Online payments</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-cyan-500">{formatCurrency(currentMonthPaymongo)}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cash</p>
                    <p className="text-xs text-muted-foreground">In-clinic payments</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-emerald-500">{formatCurrency(currentMonthCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts - Full Width Below */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
                <CardDescription>Items that need restocking</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={openLowStockModal}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockItems.slice(0, 4).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-4 rounded-xl border bg-card hover:bg-muted/50 hover:border-destructive/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-destructive transition-colors">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Min: {item.min} {item.unit}</p>
                  </div>
                  <div className="ml-2 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
                    {item.stock}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/70 transition-all"
                    style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{Math.round((item.stock / item.min) * 100)}% of minimum</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className={`fixed inset-0 transition-opacity duration-300 ease-out ${isLowStockOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`} 
            onClick={closeLowStockModal} 
          />
          <div 
            className={`relative z-10 transform-gpu transition-all duration-350 ease-[cubic-bezier(.2,.9,.2,1)] ${isLowStockOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-3xl rounded-lg overflow-hidden bg-card shadow-2xl m-4 border">
              {/* Modal Header */}
              <div className="bg-[#00a8a8] px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Low Stock Items</h3>
                    <p className="text-xs text-white/70">{lowStockItems.length} items need restocking</p>
                  </div>
                </div>
                <button 
                  onClick={closeLowStockModal} 
                  className="hover:bg-white/20 rounded p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Items List */}
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {filteredLowStockItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-4 rounded-xl border bg-card hover:bg-muted/30 hover:border-destructive/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold group-hover:text-destructive transition-colors">{item.name}</p>
                              <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{item.category}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Minimum required: {item.min} {item.unit}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-destructive">{item.stock}</p>
                          <p className="text-xs text-muted-foreground">in stock</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/70 transition-all"
                            style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-16 text-right">
                          {Math.round((item.stock / item.min) * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {filteredLowStockItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No items found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredLowStockItems.length} of {lowStockItems.length} items
                </p>
                <Button onClick={closeLowStockModal} variant="outline" size="sm">
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
