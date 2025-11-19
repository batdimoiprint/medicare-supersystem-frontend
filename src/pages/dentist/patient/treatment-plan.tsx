import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Save,
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  Printer,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PatientNav } from '@/components/dentist/PatientNav';
import { PatientSelector } from '@/components/dentist/PatientSelector';

// --- Type Definitions ---
interface TreatmentPlanItem {
  id: number;
  procedure: string;
  toothNumber?: string;
  description: string;
  estimatedCost: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface TreatmentPlan {
  id: number;
  patientName: string;
  date: string;
  items: TreatmentPlanItem[];
  totalCost: number;
  notes: string;
}

// --- Mock Data ---
const INITIAL_PLANS: TreatmentPlan[] = [
  {
    id: 1,
    patientName: 'John Doe',
    date: '2024-01-15',
    items: [
      {
        id: 1,
        procedure: 'Composite Filling',
        toothNumber: '3',
        description: 'Fill dental caries in upper right first molar',
        estimatedCost: 1500,
        priority: 'High',
        status: 'Planned',
      },
      {
        id: 2,
        procedure: 'Dental Cleaning',
        toothNumber: 'All',
        description: 'Professional cleaning and scaling',
        estimatedCost: 500,
        priority: 'Medium',
        status: 'Planned',
      },
    ],
    totalCost: 2000,
    notes: 'Patient needs immediate attention for tooth #3. Cleaning can be scheduled after filling.',
  },
];

// --- Main Component ---
const TreatmentPlanPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || 'John Doe');
  const [plans, setPlans] = useState<TreatmentPlan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const patient = searchParams.get('patient');
    const fromChart = searchParams.get('fromChart');
    if (patient) setSelectedPatient(patient);

    // Auto-populate from charting if coming from chart
    if (fromChart === 'true' && patient && !isAdding && !selectedPlan) {
      setIsAdding(true);
      setFormData({
        patientName: patient,
        date: new Date().toISOString().split('T')[0],
        items: [],
        totalCost: 0,
        notes: 'Treatment plan created from dental charting data.',
      });
    }
  }, [searchParams]);
  const [formData, setFormData] = useState<Partial<TreatmentPlan>>({
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    totalCost: 0,
    notes: '',
  });
  const [itemForm, setItemForm] = useState<Partial<TreatmentPlanItem>>({
    procedure: '',
    toothNumber: '',
    description: '',
    estimatedCost: 0,
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
      patientName: selectedPatient !== 'All Patients' ? selectedPatient : '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      totalCost: 0,
      notes: '',
    });
  };

  const handleSavePlan = () => {
    if (isAdding) {
      const newPlan: TreatmentPlan = {
        id: Date.now(),
        patientName: formData.patientName || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        items: formData.items || [],
        totalCost: (formData.items || []).reduce((sum, item) => sum + item.estimatedCost, 0),
        notes: formData.notes || '',
      };
      setPlans([...plans, newPlan]);
      setIsAdding(false);
    }
    setFormData({
      patientName: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      totalCost: 0,
      notes: '',
    });
  };

  const handleAddItem = () => {
    if (!selectedPlan && !isAdding) return;
    const newItem: TreatmentPlanItem = {
      id: Date.now(),
      procedure: itemForm.procedure || '',
      toothNumber: itemForm.toothNumber,
      description: itemForm.description || '',
      estimatedCost: itemForm.estimatedCost || 0,
      priority: itemForm.priority || 'Medium',
      status: itemForm.status || 'Planned',
    };

    if (isAdding) {
      setFormData({
        ...formData,
        items: [...(formData.items || []), newItem],
        totalCost: (formData.items || []).reduce((sum, item) => sum + item.estimatedCost, 0) + newItem.estimatedCost,
      });
    } else if (selectedPlan) {
      const plan = plans.find(p => p.id === selectedPlan);
      if (plan) {
        const updatedPlan = {
          ...plan,
          items: [...plan.items, newItem],
          totalCost: plan.items.reduce((sum, item) => sum + item.estimatedCost, 0) + newItem.estimatedCost,
        };
        setPlans(plans.map(p => p.id === selectedPlan ? updatedPlan : p));
      }
    }
    setItemForm({
      procedure: '',
      toothNumber: '',
      description: '',
      estimatedCost: 0,
      priority: 'Medium',
      status: 'Planned',
    });
  };

  const handleUpdateItemStatus = (planId: number, itemId: number, status: TreatmentPlanItem['status']) => {
    setPlans(plans.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          items: plan.items.map(item => item.id === itemId ? { ...item, status } : item),
        };
      }
      return plan;
    }));
  };

  const currentPlan = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const displayPlan = isAdding ? formData : currentPlan;

  const patientPlans = plans.filter(p => p.patientName === selectedPatient || selectedPatient === 'All Patients');
  const totalPlannedCost = patientPlans.reduce((sum, p) => sum + p.totalCost, 0);
  const completedItems = patientPlans.flatMap(p => p.items).filter(i => i.status === 'Completed').length;

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
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                <ClipboardList className="w-8 h-8" />
                Treatment Plan - {selectedPatient}
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
      {selectedPatient !== 'All Patients' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{patientPlans.length}</p>
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
                  <p className="text-2xl font-bold">₱{totalPlannedCost.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground" />
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
      {!isAdding && patientPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Treatment Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {patientPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                    }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.patientName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {plan.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          ₱{plan.totalCost.toLocaleString()}
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
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isAdding && patientPlans.length === 0 && selectedPatient !== 'All Patients' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No treatment plans found for {selectedPatient}</p>
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
                {isAdding ? 'New Treatment Plan' : `Treatment Plan - ${displayPlan.patientName}`}
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
                <FieldLabel>Patient Name</FieldLabel>
                <FieldContent>
                  {isAdding ? (
                    <Input
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      placeholder="Enter patient name"
                    />
                  ) : (
                    <Input value={displayPlan.patientName} readOnly className="bg-muted" />
                  )}
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
                        value={itemForm.toothNumber}
                        onChange={(e) => setItemForm({ ...itemForm, toothNumber: e.target.value })}
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
                        value={itemForm.estimatedCost}
                        onChange={(e) => setItemForm({ ...itemForm, estimatedCost: Number(e.target.value) })}
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
                            {item.toothNumber && (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                Tooth {item.toothNumber}
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
                              ₱{item.estimatedCost.toLocaleString()}
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
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">Total Estimated Cost</span>
                  </div>
                  <span className="text-3xl font-bold text-primary">
                    ₱{displayPlan.totalCost?.toLocaleString() || 0}
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

