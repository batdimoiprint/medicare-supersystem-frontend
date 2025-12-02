import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Stethoscope,
  FileText,
  ClipboardList,
  Pill,
  Package,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Chart from 'react-apexcharts';
import { useTheme } from '@/components/theme-provider';
import type { ApexOptions } from 'apexcharts';
import { patientRecordClient, dentistClient, inventoryClient, frontdeskClient } from '@/utils/supabase';

const Dashboard = () => {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingApprovals: 0,
    totalPatients: 0,
    activeTreatmentPlans: 0,
    pendingPrescriptions: 0,
    materialsUsedThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'dark') {
        setIsDark(true);
      } else if (theme === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Load dashboard statistics from database
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        // Get today's appointments from frontdesk.appointment_tbl
        const { count: todayAppointments } = await frontdeskClient
          .from('appointment_tbl')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', today);

        // Get pending appointments (status = 'Pending')
        const { count: pendingApprovals } = await frontdeskClient
          .from('appointment_tbl')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_status', 'Pending');

        // Get total patients from patient_record.patient_tbl
        const { count: totalPatients } = await patientRecordClient
          .from('patient_tbl')
          .select('*', { count: 'exact', head: true });

        // Get active treatment plans from dentist.treatment_plan_tbl
        const { count: activeTreatmentPlans } = await dentistClient
          .from('treatment_plan_tbl')
          .select('*', { count: 'exact', head: true })
          .in('treatment_status', ['Planned', 'In Progress']);

        // Get pending prescriptions from patient_record.prescription_tbl
        const { count: pendingPrescriptions } = await patientRecordClient
          .from('prescription_tbl')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');

        // Get materials used this month from inventory.stock_out
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { count: materialsUsedThisMonth } = await inventoryClient
          .from('stock_out')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth);

        setStats({
          todayAppointments: todayAppointments || 0,
          pendingApprovals: pendingApprovals || 0,
          totalPatients: totalPatients || 0,
          activeTreatmentPlans: activeTreatmentPlans || 0,
          pendingPrescriptions: pendingPrescriptions || 0,
          materialsUsedThisMonth: materialsUsedThisMonth || 0,
        });

      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Chart data - Monthly appointments over the last 6 months
  const chartSeries = [
    {
      name: 'Appointments',
      data: [45, 52, 48, 61, 55, 68],
    },
    {
      name: 'Treatment Plans',
      data: [28, 32, 30, 38, 35, 42],
    },
    {
      name: 'Prescriptions',
      data: [15, 18, 16, 22, 20, 25],
    },
  ];

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 10,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: '13px',
              fontWeight: 900,
              color: isDark ? '#fff' : '#000',
            },
          },
        },
      },
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      labels: {
        style: {
          colors: isDark ? '#fff' : '#000',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#fff' : '#000',
        },
      },
    },
    legend: {
      position: 'top',
      offsetY: 0,
      labels: {
        colors: isDark ? '#fff' : '#000',
      },
    },
    fill: {
      opacity: 1,
    },
    colors: ['#3b82f6', '#60a5fa', '#ef4444'],
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val: number) {
          return val + ' records';
        },
      },
    },
    grid: {
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
  };

  const totalAppointments = chartSeries[0].data.reduce((a, b) => a + b, 0);
  const totalTreatments = chartSeries[1].data.reduce((a, b) => a + b, 0);
  const totalPrescriptions = chartSeries[2].data.reduce((a, b) => a + b, 0);

  return (<>


    {/* Header */}
    < Card >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl mb-2 flex items-center gap-2">
              <User className="w-8 h-8" />
              Dentist Dashboard
            </CardTitle>
            <p className="text-muted-foreground">
              Welcome back! Manage your appointments, patients, and practice operations.
            </p>
          </div>
        </div>
      </CardHeader>
    </Card >

    {/* Statistics Overview */}
    < div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" >
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Appointments</p>
              <p className="text-2xl font-bold">{stats.todayAppointments}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold text-destructive">{stats.pendingApprovals}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
            </div>
            <User className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Treatment Plans</p>
              <p className="text-2xl font-bold">{stats.activeTreatmentPlans}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prescriptions</p>
              <p className="text-2xl font-bold">{stats.pendingPrescriptions}</p>
            </div>
            <Pill className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Materials (Month)</p>
              <p className="text-2xl font-bold">{stats.materialsUsedThisMonth}</p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div >

    {/* Monthly Statistics Chart */}
    < Card >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Monthly Statistics
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* ApexCharts */}
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={350}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalAppointments}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary/80">{totalTreatments}</p>
              <p className="text-sm text-muted-foreground">Total Treatments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive/80">{totalPrescriptions}</p>
              <p className="text-sm text-muted-foreground">Total Prescriptions</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card >

    {/* Recent Activity & Quick Links */}
    < div className="grid md:grid-cols-2 gap-6" >
      {/* Recent Activity */}
      < Card >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Appointment #1001 confirmed</p>
                <p className="text-xs text-muted-foreground">John Doe - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">New EMR record created</p>
                <p className="text-xs text-muted-foreground">Jane Smith - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <ClipboardList className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Treatment plan updated</p>
                <p className="text-xs text-muted-foreground">Michael Johnson - 1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Pill className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Prescription issued</p>
                <p className="text-xs text-muted-foreground">Sarah Williams - 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card >

      {/* Priority Actions */}
      < Card >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Link to="/dentist/appointments">
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">{stats.pendingApprovals} Appointments Pending Approval</p>
                    <p className="text-xs text-muted-foreground">Review and approve now</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/dentist/patient/prescriptions">
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold">{stats.pendingPrescriptions} Prescriptions Pending</p>
                    <p className="text-xs text-muted-foreground">Review prescriptions</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/dentist/my-schedule">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Update Schedule</p>
                    <p className="text-xs text-muted-foreground">Manage your availability</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card >
    </div >

    {/* Patient Management Section */}
    < Card >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Patient Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/dentist/patient/charting">
            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Dental Charting</p>
                    <p className="text-sm text-muted-foreground">Interactive teeth chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dentist/patient/records">
            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">EMR Records</p>
                    <p className="text-sm text-muted-foreground">Patient medical records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dentist/patient/treatment/plan">
            <Card className="cursor-pointer hover:shadow-lg transition-all border-2 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Treatment Plans</p>
                    <p className="text-sm text-muted-foreground">Create treatment plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </CardContent>
    </Card >
  </>
  );
};

export default Dashboard;

