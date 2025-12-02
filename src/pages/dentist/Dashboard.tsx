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
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingApprovals: 0,
    totalPatients: 0,
    activeTreatmentPlans: 0,
    pendingPrescriptions: 0,
    materialsUsedThisMonth: 0,
  });
  const [chartData, setChartData] = useState({
    appointments: [0, 0, 0, 0, 0, 0],
    treatmentPlans: [0, 0, 0, 0, 0, 0],
    prescriptions: [0, 0, 0, 0, 0, 0],
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
        const today = new Date().toISOString().split('T')[0];

        // Get today's appointments from frontdesk.appointment_tbl
        let todayAppointments = 0;
        try {
          const { count } = await frontdeskClient
            .from('appointment_tbl')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', today);
          todayAppointments = count || 0;
        } catch (err) {
          console.error('Failed to load today appointments:', err);
        }

        // Get pending appointments (status = 'Pending')
        let pendingApprovals = 0;
        try {
          const { count } = await frontdeskClient
            .from('appointment_tbl')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_status', 'Pending');
          pendingApprovals = count || 0;
        } catch (err) {
          console.error('Failed to load pending approvals:', err);
        }

        // Get total patients from patient_record.patient_tbl
        let totalPatients = 0;
        try {
          const { count } = await patientRecordClient
            .from('patient_tbl')
            .select('*', { count: 'exact', head: true });
          totalPatients = count || 0;
        } catch (err) {
          console.error('Failed to load total patients:', err);
        }

        // Get active treatment plans from dentist.treatment_plan_tbl
        let activeTreatmentPlans = 0;
        try {
          const { count } = await dentistClient
            .from('treatment_plan_tbl')
            .select('*', { count: 'exact', head: true })
            .in('treatment_status', ['Planned', 'In Progress']);
          activeTreatmentPlans = count || 0;
        } catch (err) {
          console.error('Failed to load active treatment plans:', err);
        }

        // Get pending prescriptions from dentist.prescription_tbl
        // Note: prescription_tbl doesn't have a status column, so we'll get total prescriptions
        let pendingPrescriptions = 0;
        try {
          const { count } = await dentistClient
            .from('prescription_tbl')
            .select('*', { count: 'exact', head: true });
          pendingPrescriptions = count || 0;
        } catch (err) {
          console.error('Failed to load prescriptions:', err);
        }

        // Get materials used this month from inventory.stock_out
        let materialsUsedThisMonth = 0;
        try {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          const startOfMonthISO = startOfMonth.toISOString();
          
          console.log('Querying materials from:', startOfMonthISO);
          
          const { count, error } = await inventoryClient
            .from('stock_out')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonthISO);
          
          if (error) {
            console.error('Error loading materials used:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
          } else {
            materialsUsedThisMonth = count || 0;
            console.log('Materials used this month:', materialsUsedThisMonth);
          }
        } catch (err) {
          console.error('Failed to load materials used:', err);
          console.error('Error details:', err);
        }

        console.log('Dashboard stats loaded:', {
          todayAppointments,
          pendingApprovals,
          totalPatients,
          activeTreatmentPlans,
          pendingPrescriptions,
          materialsUsedThisMonth,
        });

        setStats({
          todayAppointments: todayAppointments || 0,
          pendingApprovals: pendingApprovals || 0,
          totalPatients: totalPatients || 0,
          activeTreatmentPlans: activeTreatmentPlans || 0,
          pendingPrescriptions: pendingPrescriptions || 0,
          materialsUsedThisMonth: materialsUsedThisMonth || 0,
        });

        // Load chart data for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // Get appointments for last 6 months grouped by month
        let appointmentsData: any[] = [];
        try {
          const { data } = await frontdeskClient
            .from('appointment_tbl')
            .select('appointment_date')
            .gte('appointment_date', sixMonthsAgo.toISOString().split('T')[0]);
          appointmentsData = data || [];
        } catch (err) {
          console.error('Failed to load appointments for chart:', err);
        }
        
        // Get treatment plans for last 6 months
        let treatmentPlansData: any[] = [];
        try {
          const { data } = await dentistClient
            .from('treatment_plan_tbl')
            .select('created_at')
            .gte('created_at', sixMonthsAgo.toISOString());
          treatmentPlansData = data || [];
        } catch (err) {
          console.error('Failed to load treatment plans for chart:', err);
        }
        
        // Get prescriptions for last 6 months
        let prescriptionsData: any[] = [];
        try {
          const { data } = await dentistClient
            .from('prescription_tbl')
            .select('created_at')
            .gte('created_at', sixMonthsAgo.toISOString());
          prescriptionsData = data || [];
        } catch (err) {
          console.error('Failed to load prescriptions for chart:', err);
        }

        // Group by month (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          months.push(date);
        }

        const appointmentsByMonth = months.map(month => {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          return (appointmentsData || []).filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate >= monthStart && aptDate <= monthEnd;
          }).length;
        });

        const treatmentPlansByMonth = months.map(month => {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          return (treatmentPlansData || []).filter(tp => {
            const tpDate = new Date(tp.created_at);
            return tpDate >= monthStart && tpDate <= monthEnd;
          }).length;
        });

        const prescriptionsByMonth = months.map(month => {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          return (prescriptionsData || []).filter(pr => {
            const prDate = new Date(pr.created_at);
            return prDate >= monthStart && prDate <= monthEnd;
          }).length;
        });

        setChartData({
          appointments: appointmentsByMonth,
          treatmentPlans: treatmentPlansByMonth,
          prescriptions: prescriptionsByMonth,
        });

        // Load recent activity
        const loadRecentActivity = async () => {
          try {
            const activities: any[] = [];

            // Get recent appointments
            let recentAppointments: any[] = [];
            try {
              const { data } = await frontdeskClient
                .from('appointment_tbl')
                .select('appointment_id, appointment_date, appointment_status, patient_id')
                .order('appointment_date', { ascending: false })
                .limit(5);
              recentAppointments = data || [];
            } catch (err) {
              console.error('Failed to load recent appointments:', err);
            }

            // Get recent EMR records
            let recentRecords: any[] = [];
            try {
              const { data } = await patientRecordClient
                .from('emr_records')
                .select('id, date, patient_id, treatment')
                .order('date', { ascending: false })
                .limit(5);
              recentRecords = data || [];
            } catch (err) {
              console.error('Failed to load recent records:', err);
            }

            // Get recent treatment plans
            let recentPlans: any[] = [];
            try {
              const { data } = await dentistClient
                .from('treatment_plan_tbl')
                .select('treatment_id, created_at, treatment_name, patient_id')
                .order('created_at', { ascending: false })
                .limit(5);
              recentPlans = data || [];
            } catch (err) {
              console.error('Failed to load recent treatment plans:', err);
            }

            // Get recent prescriptions
            let recentPrescriptions: any[] = [];
            try {
              const { data } = await dentistClient
                .from('prescription_tbl')
                .select('prescription_id, created_at, medicine_id')
                .order('created_at', { ascending: false })
                .limit(5);
              recentPrescriptions = data || [];
            } catch (err) {
              console.error('Failed to load recent prescriptions:', err);
            }

            // Combine and sort by date
            recentAppointments.forEach(apt => {
              activities.push({
                type: 'appointment',
                icon: CheckCircle,
                title: `Appointment ${apt.appointment_status === 'Confirmed' ? 'confirmed' : 'updated'}`,
                date: apt.appointment_date,
                id: apt.appointment_id,
              });
            });

            recentRecords.forEach(record => {
              activities.push({
                type: 'record',
                icon: FileText,
                title: 'New EMR record created',
                date: record.date,
                id: record.id,
              });
            });

            recentPlans.forEach(plan => {
              activities.push({
                type: 'treatment',
                icon: ClipboardList,
                title: 'Treatment plan updated',
                date: plan.created_at,
                id: plan.treatment_id,
              });
            });

            recentPrescriptions.forEach(prescription => {
              activities.push({
                type: 'prescription',
                icon: Pill,
                title: 'Prescription issued',
                date: prescription.created_at,
                id: prescription.prescription_id,
              });
            });

            // Sort by date (most recent first) and take top 4
            activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentActivity(activities.slice(0, 4));

          } catch (err) {
            console.error('Failed to load recent activity:', err);
          }
        };

        loadRecentActivity();

      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };

    loadStats();
  }, []);

  // Chart data - Monthly appointments over the last 6 months (from database)
  const chartSeries = [
    {
      name: 'Appointments',
      data: chartData.appointments,
    },
    {
      name: 'Treatment Plans',
      data: chartData.treatmentPlans,
    },
    {
      name: 'Prescriptions',
      data: chartData.prescriptions,
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
      categories: (() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        return months;
      })(),
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
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                const date = new Date(activity.date);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                
                let timeAgo = '';
                if (diffHours < 1) {
                  timeAgo = 'Just now';
                } else if (diffHours < 24) {
                  timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                } else {
                  timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                }

                return (
                  <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Icon className={`w-5 h-5 ${activity.type === 'prescription' ? 'text-destructive' : 'text-primary'} mt-0.5`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                );
              })
            )}
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

