import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Save,
  X,
  Calendar,
  Coins,
  CheckCircle,
  Printer,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PatientNav } from '@/components/dentist/PatientNav';
import { PatientSelector } from '@/components/dentist/PatientSelector';
import { patientRecordClient, dentistClient } from '@/utils/supabase';

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface Service {
  service_id: number;
  service_name: string;
  service_description?: string;
  service_fee?: number;
}

interface TreatmentPlan {
  treatment_id: number;
  patient_id: number;
  personnel_id?: number;
  treatment_name: string;
  description?: string;
  treatment_status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at?: string;
  // For UI - loaded separately
  services?: TreatmentPlanService[];
  total_cost?: number;
}

interface TreatmentPlanService {
  id: number;
  treatment_id: number;
  service_id: number;
  tooth_number?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  estimated_cost: number;
  // Joined from services_tbl
  service_name?: string;
}

// --- Main Component ---
const TreatmentPlanPage = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(searchParams.get('patient') || '');
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Load Patients ---
  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        const { data, error } = await patientRecordClient
          .from('patient_tbl')
          .select('patient_id, f_name, m_name, l_name')
          .order('l_name', { ascending: true });

        if (!mounted) return;
        if (error) return console.error('Failed to fetch patients:', error);

        setPatients(data ?? []);
        if (!selectedPatient && data && data.length > 0) {
          setSelectedPatient(String(data[0].patient_id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPatients();
    return () => { mounted = false; };
  }, [selectedPatient]);

  // --- Load Services from dentist schema ---
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await dentistClient
          .from('services_tbl')
          .select('service_id, service_name, service_description, service_fee')
          .not('service_id', 'is', null)
          .not('service_name', 'is', null)
          .order('service_name', { ascending: true });

        if (error) {
          console.error('Failed to fetch services:', error);
          return;
        }
        
        console.log('Loaded services:', data);
        setServices(data ?? []);
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };
    loadServices();
  }, []);

  // --- Load Treatment Plans from dentist schema ---
  const loadPlans = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      // Load plans from dentist.treatment_plan_tbl
      const { data: plansData, error: plansError } = await dentistClient
        .from('treatment_plan_tbl')
        .select('*')
        .eq('patient_id', selectedPatient)
        .order('created_at', { ascending: false });

      if (plansError) {
        console.error('Failed to fetch plans:', plansError);
        return;
      }

      // Load services for each plan from treatment_plan_services_tbl
      const plansWithServices: TreatmentPlan[] = [];
      for (const plan of plansData ?? []) {
        const { data: servicesData, error: servicesError } = await dentistClient
          .from('treatment_services_tbl')
          .select(`
            *,
            services_tbl (service_name, service_fee)
          `)
          .eq('treatment_id', plan.treatment_id);

        if (servicesError) {
          console.error('Failed to fetch services:', servicesError);
          plansWithServices.push({ ...plan, services: [], total_cost: 0 });
          continue;
        }

        const mappedServices = (servicesData ?? []).map((s: any) => ({
          ...s,
          service_name: s.services_tbl?.service_name,
          estimated_cost: s.estimated_cost || s.services_tbl?.service_fee || 0,
        }));

        const totalCost = mappedServices.reduce((sum: number, s: any) => sum + (s.estimated_cost || 0), 0);

        plansWithServices.push({
          ...plan,
          services: mappedServices,
          total_cost: totalCost,
        });
      }

      setPlans(plansWithServices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [selectedPatient]);

  // Helper to get patient name by ID
  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.patient_id === patientId);
    if (!patient) return 'Unknown';
    return `${patient.f_name ?? ''} ${patient.m_name ?? ''} ${patient.l_name ?? ''}`.trim();
  };

  // Helper to get service by ID
  const getServiceById = (serviceId: number): Service | undefined => {
    return services.find(s => s.service_id === serviceId);
  };

  useEffect(() => {
    const patient = searchParams.get('patient');
    const fromChart = searchParams.get('fromChart');
    if (patient) setSelectedPatient(patient);

    // Auto-populate from charting if coming from chart
    if (fromChart === 'true' && patient && !isAdding && !selectedPlan) {
      setIsAdding(true);
      setFormData({
        patient_id: Number(patient),
        treatment_name: '',
        description: 'Treatment plan created from dental charting data.',
        treatment_status: 'Planned',
        services: [],
        total_cost: 0,
      });
    }
  }, [searchParams]);

  const [formData, setFormData] = useState<Partial<TreatmentPlan>>({
    patient_id: undefined,
    treatment_name: '',
    description: '',
    treatment_status: 'Planned',
    services: [],
    total_cost: 0,
  });
  const [itemForm, setItemForm] = useState<Partial<TreatmentPlanService>>({
    service_id: undefined,
    tooth_number: '',
    estimated_cost: 0,
    priority: 'Medium',
    status: 'Planned',
  });

  const handleAddPlan = () => {
    setIsAdding(true);
    setSelectedPlan(null);
    setFormData({
      patient_id: selectedPatient ? Number(selectedPatient) : undefined,
      treatment_name: '',
      description: '',
      treatment_status: 'Planned',
      services: [],
      total_cost: 0,
    });
  };

  const handleSavePlan = async () => {
    try {
      if (isAdding) {
        if (!formData.treatment_name) {
          alert('Please enter a treatment name');
          return;
        }

        // Insert new plan into dentist.treatment_plan_tbl
        const { data: planData, error: planError } = await dentistClient
          .from('treatment_plan_tbl')
          .insert({
            patient_id: Number(selectedPatient),
            treatment_name: formData.treatment_name,
            description: formData.description,
            treatment_status: formData.treatment_status || 'Planned',
          })
          .select()
          .single();

        if (planError) throw planError;

        // Insert services for this plan
        if (formData.services && formData.services.length > 0) {
          const servicesToInsert = formData.services.map(service => ({
            treatment_id: planData.treatment_id,
            service_id: service.service_id,
            tooth_number: service.tooth_number,
            estimated_cost: service.estimated_cost,
            priority: service.priority,
            status: service.status,
          }));

          const { error: servicesError } = await dentistClient
            .from('treatment_services_tbl')
            .insert(servicesToInsert);

          if (servicesError) throw servicesError;
        }

        setIsAdding(false);
        alert('Treatment plan saved successfully!');
      }

      // Reload plans
      await loadPlans();

      // Reset form
      setFormData({
        patient_id: undefined,
        treatment_name: '',
        description: '',
        treatment_status: 'Planned',
        services: [],
        total_cost: 0,
      });
    } catch (err) {
      console.error('Failed to save plan:', err);
      alert('Failed to save treatment plan');
    }
  };

  const handleAddService = async () => {
    if (!selectedPlan && !isAdding) return;
    if (!itemForm.service_id) {
      alert('Please select a service');
      return;
    }

    const service = getServiceById(itemForm.service_id);
    const newService: TreatmentPlanService = {
      id: Date.now(),
      treatment_id: selectedPlan || 0,
      service_id: itemForm.service_id,
      service_name: service?.service_name,
      tooth_number: itemForm.tooth_number,
      estimated_cost: itemForm.estimated_cost || service?.service_fee || 0,
      priority: itemForm.priority || 'Medium',
      status: itemForm.status || 'Planned',
    };

    if (isAdding) {
      // Adding services to a new plan (not yet saved)
      setFormData({
        ...formData,
        services: [...(formData.services || []), newService],
        total_cost: (formData.services || []).reduce((sum, s) => sum + (s.estimated_cost || 0), 0) + newService.estimated_cost,
      });
    } else if (selectedPlan) {
      // Adding service to existing plan - save to database
      try {
        const { error } = await dentistClient
          .from('treatment_services_tbl')
          .insert({
            treatment_id: selectedPlan,
            service_id: newService.service_id,
            tooth_number: newService.tooth_number,
            estimated_cost: newService.estimated_cost,
            priority: newService.priority,
            status: newService.status,
          });

        if (error) throw error;
        await loadPlans();
      } catch (err) {
        console.error('Failed to add service:', err);
        alert('Failed to add treatment service');
      }
    }

    setItemForm({
      service_id: undefined,
      tooth_number: '',
      estimated_cost: 0,
      priority: 'Medium',
      status: 'Planned',
    });
  };

  const handleUpdateServiceStatus = async (planId: number, serviceId: number, status: TreatmentPlanService['status']) => {
    try {
      const { error } = await dentistClient
        .from('treatment_services_tbl')
        .update({ status })
        .eq('id', serviceId);

      if (error) throw error;

      // Update local state
      setPlans(plans.map(plan => {
        if (plan.treatment_id === planId) {
          return {
            ...plan,
            services: plan.services?.map(s => s.id === serviceId ? { ...s, status } : s),
          };
        }
        return plan;
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update service status');
    }
  };

  const handleUpdatePlanStatus = async (planId: number, status: TreatmentPlan['treatment_status']) => {
    try {
      const { error } = await supabase
        .schema('dentist')
        .from('treatment_plan_tbl')
        .update({ treatment_status: status })
        .eq('treatment_id', planId);

      if (error) throw error;

      setPlans(plans.map(plan => 
        plan.treatment_id === planId ? { ...plan, treatment_status: status } : plan
      ));
    } catch (err) {
      console.error('Failed to update plan status:', err);
      alert('Failed to update plan status');
    }
  };

  const currentPlan = selectedPlan ? plans.find(p => p.treatment_id === selectedPlan) : null;
  const displayPlan = isAdding ? formData : currentPlan;

  const totalPlannedCost = plans.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const completedServices = plans.flatMap(p => p.services || []).filter(s => s.status === 'Completed').length;

  return (
    <>
      {/* Workspace Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <Briefcase className="w-8 h-8" />
                Workspace
              </CardTitle>
              <p className="text-muted-foreground">
                Patient management workspace for dental charting, records, and treatment planning.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <PatientNav />

      {/* Patient Selector */}
      <PatientSelector
        selectedPatient={selectedPatient}
        onPatientChange={setSelectedPatient}
        patients={patients}
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <ClipboardList className="w-8 h-8" />
                Treatment Plan - {selectedPatient ? getPatientName(Number(selectedPatient)) : 'Select Patient'}
              </CardTitle>
              <p className="text-muted-foreground">
                Create and manage patient treatment plans
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleAddPlan}>
                <Plus className="w-4 h-4 mr-2" />
                New Treatment Plan
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {selectedPatient && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{plans.length}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPlannedCost)}</p>
                </div>
                <Coins className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Services</p>
                  <p className="text-2xl font-bold">{completedServices}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Selection */}
      {!isAdding && plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Treatment Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading plans...</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.treatment_id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.treatment_id ? 'ring-2 ring-primary' : ''
                      }`}
                    onClick={() => setSelectedPlan(plan.treatment_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{plan.treatment_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                            plan.treatment_status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            plan.treatment_status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            plan.treatment_status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {plan.treatment_status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(plan.total_cost || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(plan.services || []).length} service{(plan.services || []).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isAdding && !loading && plans.length === 0 && selectedPatient && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No treatment plans found for {getPatientName(Number(selectedPatient))}</p>
              <p className="text-sm mt-2 mb-4">Create a new treatment plan to get started</p>
              <Button onClick={handleAddPlan}>
                <Plus className="w-4 h-4 mr-2" />
                Create Treatment Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plan Form/View */}
      {displayPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isAdding ? 'New Treatment Plan' : `Treatment Plan - ${displayPlan.treatment_name || ''}`}
              </CardTitle>
              {isAdding ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Plan
                  </Button>
                </div>
              ) : (
                <Select
                  value={displayPlan.treatment_status}
                  onValueChange={(value) => selectedPlan && handleUpdatePlanStatus(selectedPlan, value as TreatmentPlan['treatment_status'])}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field orientation="vertical">
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Input
                    value={selectedPatient ? getPatientName(Number(selectedPatient)) : ''}
                    disabled
                    placeholder="Select a patient first"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Treatment Name</FieldLabel>
                <FieldContent>
                  {isAdding ? (
                    <Input
                      value={formData.treatment_name}
                      onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                      placeholder="Enter treatment plan name"
                    />
                  ) : (
                    <Input value={displayPlan.treatment_name} readOnly className="bg-muted" />
                  )}
                </FieldContent>
              </Field>
            </div>
            
            {/* Description */}
            <Field orientation="vertical">
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                {isAdding ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[80px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Treatment plan description..."
                  />
                ) : (
                  <textarea
                    value={displayPlan.description || ''}
                    readOnly
                    className="w-full min-h-[80px] p-2 border rounded-lg resize-none bg-muted"
                  />
                )}
              </FieldContent>
            </Field>

            {/* Add Service */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field orientation="vertical">
                    <FieldLabel>Service/Procedure</FieldLabel>
                    <FieldContent>
                      <Select
                        value={itemForm.service_id?.toString()}
                        onValueChange={(value) => {
                          const serviceId = Number(value);
                          const service = getServiceById(serviceId);
                          setItemForm({ 
                            ...itemForm, 
                            service_id: serviceId,
                            estimated_cost: service?.service_fee || 0,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={services.length === 0 ? "No services available" : "Select service"} />
                        </SelectTrigger>
                        <SelectContent>
                          {services.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No services found - add services first
                            </SelectItem>
                          ) : (
                            services.map((service) => (
                              <SelectItem key={service.service_id} value={service.service_id.toString()}>
                                {service.service_name} - {formatCurrency(service.service_fee || 0)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Tooth Number (Optional)</FieldLabel>
                    <FieldContent>
                      <Input
                        value={itemForm.tooth_number}
                        onChange={(e) => setItemForm({ ...itemForm, tooth_number: e.target.value })}
                        placeholder="e.g., 3, 14-16, All"
                      />
                    </FieldContent>
                  </Field>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Field orientation="vertical">
                    <FieldLabel>Estimated Cost (₱)</FieldLabel>
                    <FieldContent>
                      <Input
                        type="number"
                        value={itemForm.estimated_cost}
                        onChange={(e) => setItemForm({ ...itemForm, estimated_cost: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="vertical">
                    <FieldLabel>Priority</FieldLabel>
                    <FieldContent>
                      <Select
                        value={itemForm.priority}
                        onValueChange={(value) => setItemForm({ ...itemForm, priority: value as TreatmentPlanService['priority'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <div className="flex items-end">
                    <Button onClick={handleAddService} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services/Procedures</h3>
              {displayPlan.services && displayPlan.services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No services added yet. Add services using the form above.
                </p>
              ) : (
                displayPlan.services?.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{service.service_name || `Service #${service.service_id}`}</h4>
                            {service.tooth_number && (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                Tooth {service.tooth_number}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${service.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                service.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                              {service.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(service.estimated_cost)}
                            </span>
                            {!isAdding && (
                              <Select
                                value={service.status}
                                onValueChange={(value) => selectedPlan && handleUpdateServiceStatus(selectedPlan, service.id, value as TreatmentPlanService['status'])}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Planned">Planned</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Total Cost */}
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">Total Estimated Cost</span>
                  </div>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(displayPlan.total_cost || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TreatmentPlanPage;

