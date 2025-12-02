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
import supabase, { patientRecordClient } from '@/utils/supabase';

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

  // --- Load Treatment Plans ---
  const loadPlans = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      // Load plans
      const { data: plansData, error: plansError } = await patientRecordClient
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', selectedPatient)
        .order('date', { ascending: false });

      if (plansError) {
        console.error('Failed to fetch plans:', plansError);
        return;
      }

      // Load items for each plan
      const plansWithItems: TreatmentPlan[] = [];
      for (const plan of plansData ?? []) {
        const { data: itemsData, error: itemsError } = await patientRecordClient
          .from('treatment_plan_items')
          .select('*')
          .eq('plan_id', plan.id);

        if (itemsError) {
          console.error('Failed to fetch items:', itemsError);
          continue;
        }

        plansWithItems.push({
          ...plan,
          items: itemsData ?? [],
        });
      }

      setPlans(plansWithItems);
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

  useEffect(() => {
    const patient = searchParams.get('patient');
    const fromChart = searchParams.get('fromChart');
    if (patient) setSelectedPatient(patient);

    // Auto-populate from charting if coming from chart
    if (fromChart === 'true' && patient && !isAdding && !selectedPlan) {
      setIsAdding(true);
      setFormData({
        patient_id: Number(patient),
        date: new Date().toISOString().split('T')[0],
        items: [],
        total_cost: 0,
        notes: 'Treatment plan created from dental charting data.',
      });
    }
  }, [searchParams]);

  const [formData, setFormData] = useState<Partial<TreatmentPlan>>({
    patient_id: undefined,
    date: new Date().toISOString().split('T')[0],
    items: [],
    total_cost: 0,
    notes: '',
  });
  const [itemForm, setItemForm] = useState<Partial<TreatmentPlanItem>>({
    procedure: '',
    tooth_number: '',
    description: '',
    estimated_cost: 0,
    priority: 'Medium',
    status: 'Planned',
  });

  const PROCEDURES = [
    'Composite Filling',
    'Amalgam Filling',
    'Root Canal Treatment',
    'Crown',
    'Dental Implant',
    'Dental Cleaning',
    'Tooth Extraction',
    'Bonding',
    'Veneers',
    'Teeth Whitening',
  ];

  const handleAddPlan = () => {
    setIsAdding(true);
    setSelectedPlan(null);
    setFormData({
      patient_id: selectedPatient ? Number(selectedPatient) : undefined,
      date: new Date().toISOString().split('T')[0],
      items: [],
      total_cost: 0,
      notes: '',
    });
  };

  const handleSavePlan = async () => {
    try {
      if (isAdding) {
        // Insert new plan
        const { data: planData, error: planError } = await patientRecordClient
          .from('treatment_plans')
          .insert({
            patient_id: Number(selectedPatient),
            date: formData.date,
            total_cost: (formData.items || []).reduce((sum, item) => sum + item.estimated_cost, 0),
            notes: formData.notes,
          })
          .select()
          .single();

        if (planError) throw planError;

        // Insert items for this plan
        if (formData.items && formData.items.length > 0) {
          const itemsToInsert = formData.items.map(item => ({
            plan_id: planData.id,
            procedure: item.procedure,
            tooth_number: item.tooth_number,
            description: item.description,
            estimated_cost: item.estimated_cost,
            priority: item.priority,
            status: item.status,
          }));

          const { error: itemsError } = await patientRecordClient
            .from('treatment_plan_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        setIsAdding(false);
        alert('Treatment plan saved successfully!');
      }

      // Reload plans
      await loadPlans();

      // Reset form
      setFormData({
        patient_id: undefined,
        date: new Date().toISOString().split('T')[0],
        items: [],
        total_cost: 0,
        notes: '',
      });
    } catch (err) {
      console.error('Failed to save plan:', err);
      alert('Failed to save treatment plan');
    }
  };

  const handleAddItem = async () => {
    if (!selectedPlan && !isAdding) return;
    const newItem: TreatmentPlanItem = {
      id: Date.now(),
      plan_id: selectedPlan || 0,
      procedure: itemForm.procedure || '',
      tooth_number: itemForm.tooth_number,
      description: itemForm.description || '',
      estimated_cost: itemForm.estimated_cost || 0,
      priority: itemForm.priority || 'Medium',
      status: itemForm.status || 'Planned',
    };

    if (isAdding) {
      // Adding items to a new plan (not yet saved)
      setFormData({
        ...formData,
        items: [...(formData.items || []), newItem],
        total_cost: (formData.items || []).reduce((sum, item) => sum + item.estimated_cost, 0) + newItem.estimated_cost,
      });
    } else if (selectedPlan) {
      // Adding item to existing plan - save to database
      try {
        const { error } = await patientRecordClient
          .from('treatment_plan_items')
          .insert({
            plan_id: selectedPlan,
            procedure: newItem.procedure,
            tooth_number: newItem.tooth_number,
            description: newItem.description,
            estimated_cost: newItem.estimated_cost,
            priority: newItem.priority,
            status: newItem.status,
          });

        if (error) throw error;

        // Update total cost in the plan
        const plan = plans.find(p => p.id === selectedPlan);
        if (plan) {
          const newTotalCost = plan.items.reduce((sum, item) => sum + item.estimated_cost, 0) + newItem.estimated_cost;
          await patientRecordClient
            .from('treatment_plans')
            .update({ total_cost: newTotalCost })
            .eq('id', selectedPlan);
        }

        await loadPlans();
      } catch (err) {
        console.error('Failed to add item:', err);
        alert('Failed to add treatment item');
      }
    }

    setItemForm({
      procedure: '',
      tooth_number: '',
      description: '',
      estimated_cost: 0,
      priority: 'Medium',
      status: 'Planned',
    });
  };

  const handleUpdateItemStatus = async (planId: number, itemId: number, status: TreatmentPlanItem['status']) => {
    try {
      const { error } = await patientRecordClient
        .from('treatment_plan_items')
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setPlans(plans.map(plan => {
        if (plan.id === planId) {
          return {
            ...plan,
            items: plan.items.map(item => item.id === itemId ? { ...item, status } : item),
          };
        }
        return plan;
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update item status');
    }
  };

  const currentPlan = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const displayPlan = isAdding ? formData : currentPlan;

  const totalPlannedCost = plans.reduce((sum, p) => sum + p.total_cost, 0);
  const completedItems = plans.flatMap(p => p.items).filter(i => i.status === 'Completed').length;

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
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedItems}</p>
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
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                      }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{getPatientName(plan.patient_id)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {plan.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(plan.total_cost)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.items.length} procedure{plan.items.length !== 1 ? 's' : ''}
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
                {isAdding ? 'New Treatment Plan' : `Treatment Plan - ${displayPlan.patient_id ? getPatientName(displayPlan.patient_id) : ''}`}
              </CardTitle>
              {isAdding && (
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
                <FieldLabel>Date</FieldLabel>
                <FieldContent>
                  {isAdding ? (
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  ) : (
                    <Input value={displayPlan.date} readOnly className="bg-muted" />
                  )}
                </FieldContent>
              </Field>
            </div>

            {/* Add Treatment Item */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Treatment Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field orientation="vertical">
                    <FieldLabel>Procedure</FieldLabel>
                    <FieldContent>
                      <Select
                        value={itemForm.procedure}
                        onValueChange={(value) => setItemForm({ ...itemForm, procedure: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select procedure" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROCEDURES.map((proc) => (
                            <SelectItem key={proc} value={proc}>
                              {proc}
                            </SelectItem>
                          ))}
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
                <Field orientation="vertical">
                  <FieldLabel>Description</FieldLabel>
                  <FieldContent>
                    <Input
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Describe the procedure"
                    />
                  </FieldContent>
                </Field>
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
                        onValueChange={(value) => setItemForm({ ...itemForm, priority: value as TreatmentPlanItem['priority'] })}
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
                    <Button onClick={handleAddItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Items List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Treatment Items</h3>
              {displayPlan.items && displayPlan.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No treatment items added yet. Add items using the form above.
                </p>
              ) : (
                displayPlan.items?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{item.procedure}</h4>
                            {item.tooth_number && (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                Tooth {item.tooth_number}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                              {item.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(item.estimated_cost)}
                            </span>
                            {!isAdding && (
                              <Select
                                value={item.status}
                                onValueChange={(value) => selectedPlan && handleUpdateItemStatus(selectedPlan, item.id, value as TreatmentPlanItem['status'])}
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

            {/* Notes */}
            <Field orientation="vertical">
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                {isAdding ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Additional notes about the treatment plan..."
                  />
                ) : (
                  <textarea
                    value={displayPlan.notes}
                    readOnly
                    className="w-full min-h-[100px] p-2 border rounded-lg resize-none bg-muted"
                  />
                )}
              </FieldContent>
            </Field>

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

