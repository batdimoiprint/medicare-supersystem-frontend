import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  PhilippinePeso, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  FileText, 
  Settings, 
  Shield,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
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
import { cn } from "@/lib/utils";

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

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const lowStockItems = [
  { name: "Lidocaine Injection", stock: 15, min: 50, unit: "vials" },
  { name: "Dental Floss", stock: 8, min: 30, unit: "boxes" },
  { name: "Latex Gloves (M)", stock: 120, min: 500, unit: "pairs" },
  { name: "Composite Resin", stock: 3, min: 10, unit: "tubes" },
];

const systemLogs = [
  { id: 1, user: "Dr. Smith", action: "Updated patient record #1234", time: "10 mins ago", type: "success" },
  { id: 2, user: "Admin", action: "Changed system settings", time: "1 hour ago", type: "warning" },
  { id: 3, user: "Reception", action: "Failed login attempt", time: "2 hours ago", type: "error" },
  { id: 4, user: "Inventory", action: "Stock adjustment approved", time: "3 hours ago", type: "success" },
];

const quickActions = [
  { title: "Manage Users", icon: Users, path: "/admin/users" },
  { title: "Inventory", icon: Package, path: "/inventory" },
  { title: "View Reports", icon: FileText, path: "/inventory/report" },
  { title: "System Settings", icon: Settings, path: "/admin/settings" },
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

const QuickActionCard = ({ action, onClick }: { action: typeof quickActions[0], onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-xl border hover:bg-muted/50 transition-all gap-3 group w-full"
  >
    <div className={cn("p-3 rounded-full transition-all group-hover:scale-110 bg-primary/10")}>
      <action.icon className="w-6 h-6 text-primary" />
    </div>
    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
      {action.title}
    </span>
  </motion.button>
);

const ActivityItem = ({ log }: { log: typeof systemLogs[0] }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className={cn("mt-1", 
      log.type === 'success' ? "text-emerald-500" : 
      log.type === 'warning' ? "text-amber-500" : "text-destructive"
    )}>
      {log.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
       log.type === 'warning' ? <Clock className="w-5 h-5" /> :
       <XCircle className="w-5 h-5" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{log.action}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{log.user}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">{log.time}</span>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#06b6d4" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & System Health */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <QuickActionCard 
                  key={index} 
                  action={action} 
                  onClick={() => navigate(action.path)} 
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Min: {item.min} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{item.stock}</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {systemLogs.map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
