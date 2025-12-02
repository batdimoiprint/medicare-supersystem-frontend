import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  FileText,
  Save,
  RefreshCw,
  ClipboardList,
  Printer,
  Briefcase,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import supabase, { patientRecordClient } from '@/utils/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { PatientNav } from '@/components/dentist/PatientNav';
import {PatientSelector} from '@/components/dentist/PatientSelector';

// --- Type Definitions ---
interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

type ToothCondition = 'Healthy' | 'Crown' | 'For Filling' | 'Implant' | 'Missing' | 'Root Canal';

interface ToothData {
  number: number;
  condition: ToothCondition;
 
  notes?: string;
}

interface ToothSummary {
  condition: ToothCondition;
  count: number;
  teeth: number[];
}

interface ProcedureOverview {
  type: 'Implant' | 'Filling';
  teeth: number[];
  recommendedProcedures: string[];
}

// --- Constants ---
const IMPLANT_TYPES = [
  'Single Tooth Implant',
  'Implant-Supported Bridge',
  'All-on-4 Implant',
  'Mini Implant',
  'Zygomatic Implant',
];

const FILLING_TYPES = [
  'Composite Filling',
  'Amalgam Filling',
  'Ceramic Inlay/Onlay',
  'Glass Ionomer Filling',
  'Temporary Filling',
];

const TEETH_LAYOUT = {
  upperRight: [1, 2, 3, 4, 5, 6, 7, 8],
  upperLeft: [9, 10, 11, 12, 13, 14, 15, 16],
  lowerLeft: [17, 18, 19, 20, 21, 22, 23, 24],
  lowerRight: [25, 26, 27, 28, 29, 30, 31, 32],
};

const conditionMap: Record<string, number> = {
  'Healthy': 1,
  'Missing': 2,
  'For Filling': 3,
  'Implant': 4,
  'Crown': 5,
  'Root Canal': 6,
};


const initializeTeeth = (): Record<number, ToothData> => {
  const teeth: Record<number, ToothData> = {};
  for (let i = 1; i <= 32; i++) {
    teeth[i] = { number: i, condition: 'Healthy' };
  }
  return teeth;
};

// --- Main Component ---
const DentalCharting = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(searchParams.get('patient') || '');
  const [conditions, setConditions] = useState<{ id: string; name: string }[]>([]);
  const [teeth, setTeeth] = useState<Record<number, ToothData>>(initializeTeeth());
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('Healthy');
  const [procedureType, setProcedureType] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

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

  // --- Load Tooth Conditions ---
  useEffect(() => {
    const loadConditions = async () => {
      const { data, error } = await patientRecordClient
        .from('tooth_conditions')
        .select('*')
        .order('id', { ascending: true });
      if (error) return console.error(error);
      setConditions(data ?? []);
    };
    loadConditions();
  }, []);

  // --- Load Teeth Data ---
  const loadTeeth = async () => {
    if (!selectedPatient) return;
    const { data, error } = await patientRecordClient
      .from('patient_teeth')
      .select(`tooth_number, notes,  condition:condition_id(name)`)
      .eq('patient_id', selectedPatient);

    if (error) return console.error(error);

    const map: Record<number, ToothData> = initializeTeeth();
    data?.forEach((t: any) => {
      map[t.tooth_number] = {
        number: t.tooth_number,
        condition: t.condition?.name || 'Healthy',
        notes: t.notes,
      };
    });
    setTeeth(map);
  };

  useEffect(() => {
    loadTeeth();
  }, [selectedPatient, conditions]);

  // --- Functions ---
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all teeth to Healthy?')) {
      setTeeth(initializeTeeth());
      setSelectedTeeth([]);
    }
  };

  const handleQuickSelect = (type: 'upperRight' | 'upperLeft' | 'lowerLeft' | 'lowerRight' | 'all') => {
    setSelectedTeeth(type === 'all' ? Array.from({ length: 32 }, (_, i) => i + 1) : TEETH_LAYOUT[type]);
    setIsMultiSelectMode(true);
  };

  const handleApplyConditionToSelected = () => {
    if (selectedTeeth.length === 0) return alert('Select at least one tooth first.');
    setSelectedTooth(null);
    setSelectedCondition('Healthy');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleToothClick = (toothNum: number) => {
    if (isMultiSelectMode) {
      setSelectedTeeth(prev =>
        prev.includes(toothNum) ? prev.filter(t => t !== toothNum) : [...prev, toothNum]
      );
    } else {
      setSelectedTooth(toothNum);
      setSelectedCondition(teeth[toothNum].condition);
      setProcedureType(teeth[toothNum].procedureType || '');
      setNotes(teeth[toothNum].notes || '');
      setIsDialogOpen(true);
    }
  };

  const handleSave = () => {
    if (selectedTooth === null) return;

    const updatedTeeth = { ...teeth };
    updatedTeeth[selectedTooth] = {
      number: selectedTooth,
      condition: selectedCondition,
      procedureType: (selectedCondition === 'Implant' || selectedCondition === 'For Filling') 
        ? procedureType 
        : undefined,
      notes: notes.trim() || undefined,
    };

    setTeeth(updatedTeeth);
    setIsDialogOpen(false);
    setSelectedTooth(null);
    setProcedureType('');
    setNotes('');
  };

  const getConditionColor = (condition: ToothCondition) => {
    const map: Record<ToothCondition, string> = {
      Healthy: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      Crown: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      'For Filling': 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      Implant: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      Missing: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700',
      'Root Canal': 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    };
    return map[condition] ?? 'bg-muted text-muted-foreground border-border';
  };

  const getConditionIcon = (condition: ToothCondition) => {
    switch (condition) {
      case 'Healthy': return CheckCircle;
      case 'Missing': return XCircle;
      case 'For Filling':
      case 'Implant': return AlertCircle;
      default: return Activity;
    }
  };

 const saveChartToServer = async () => {
  try {
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }

    // Use the selected patient ID
    const patientId = Number(selectedPatient); // convert to number if needed

    // Only save teeth that are not Healthy
    const unhealthyTeeth = Object.values(teeth).filter(tooth => tooth.condition !== 'Healthy');

    if (unhealthyTeeth.length === 0) {
      alert('All teeth are healthy, nothing to save.');
      return;
    }

    // Prepare rows for Supabase
    const rows = unhealthyTeeth.map(tooth => ({
      patient_id: patientId,
      tooth_number: tooth.number,
      condition_id: getConditionId(tooth.condition)
    }));

    const { data, error } = await patientRecordClient
      .from('patient_teeth')
      .upsert(rows, { onConflict: ['patient_id', 'tooth_number'] });

    if (error) throw error;

    console.log('Saved successfully', data);
    alert('Chart saved successfully!');
  } catch (err) {
    console.error('Failed to save chart', err);
    alert('Failed to save chart');
  }
};

// Map tooth condition to the condition_id in Supabase
function getConditionId(condition: string) {
  const conditionMap: Record<string, number> = {
    'Healthy': 1,
    'Missing': 2,
    'For Filling': 3,
    'Implant': 4,
    'Crown': 5,
    'Root Canal': 6
  };
  return conditionMap[condition];
}





useEffect(() => {
  const fetchTeeth = async () => {
    const patientId = 30;
    const { data, error } = await patientRecordClient
      .from('patient_teeth')
      .select('teeth')
      .eq('patient_id', patientId)
      .single();

    if (data?.teeth) setTeeth(
      data.teeth.reduce((acc, tooth) => {
        acc[tooth.number] = tooth;
        return acc;
      }, {} as Record<number, ToothData>)
    );
  };
  fetchTeeth();
}, []);



  const calculateSummary = (): ToothSummary[] => {
    const counts: Record<ToothCondition, ToothSummary> = {};
    Object.values(teeth).forEach(t => {
      if (!counts[t.condition]) counts[t.condition] = { condition: t.condition, count: 0, teeth: [] };
      counts[t.condition].count++;
      counts[t.condition].teeth.push(t.number);
    });
    return Object.values(counts);
  };

  const calculateProcedures = (): ProcedureOverview[] => {
    const implantTeeth = Object.values(teeth).filter(t => t.condition === 'Implant').map(t => t.number);
    const fillingTeeth = Object.values(teeth).filter(t => t.condition === 'For Filling').map(t => t.number);

    const procedures: ProcedureOverview[] = [];
    if (implantTeeth.length) procedures.push({ type: 'Implant', teeth: implantTeeth, recommendedProcedures: IMPLANT_TYPES });
    if (fillingTeeth.length) procedures.push({ type: 'Filling', teeth: fillingTeeth, recommendedProcedures: FILLING_TYPES });
    return procedures;
  };

  const summary = calculateSummary();
  const procedures = calculateProcedures();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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
          returnBy="id"
        />

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                  <Stethoscope className="w-8 h-8" />
                  Dental Charting - {selectedPatient}
                </CardTitle>
                <p className="text-muted-foreground">
                  Interactive dental chart for patient tooth condition tracking (Teeth 1-32)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
                <Button onClick={saveChartToServer}>
  <Save className="w-4 h-4 mr-2" />
  Save Chart
</Button>


              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Select */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Quick Select
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedTeeth.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedTeeth.length} tooth{selectedTeeth.length !== 1 ? 's' : ''} selected
                  </span>
                )}
                <Button
                  variant={isMultiSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    if (!isMultiSelectMode) {
                      setSelectedTeeth([]);
                    }
                  }}
                >
                  {isMultiSelectMode ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Multi-Select ON
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Multi-Select OFF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('upperRight')}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Upper Right (1-8)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('upperLeft')}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Upper Left (9-16)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('lowerLeft')}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Lower Left (17-24)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('lowerRight')}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Lower Right (25-32)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('all')}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Select All
                </Button>
              </div>
              {selectedTeeth.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    onClick={handleApplyConditionToSelected}
                    className="flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Apply Condition to Selected ({selectedTeeth.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearSelection}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teeth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Teeth Chart (Click on a tooth number to update condition)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Upper Jaw */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Upper Jaw</h3>
                <div className="grid grid-cols-2 gap-8">
                  {/* Upper Right (1-8) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 text-center">Upper Right</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TEETH_LAYOUT.upperRight.map((toothNum) => {
                        const tooth = teeth[toothNum];
                        const Icon = getConditionIcon(tooth.condition);
                        const isSelected = selectedTeeth.includes(toothNum);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => handleToothClick(toothNum)}
                            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md ${getConditionColor(tooth.condition)} ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="w-4 h-4" />
                              <span className="font-bold text-lg">{toothNum}</span>
                              <span className="text-xs">{tooth.condition}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upper Left (9-16) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 text-center">Upper Left</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TEETH_LAYOUT.upperLeft.map((toothNum) => {
                        const tooth = teeth[toothNum];
                        const Icon = getConditionIcon(tooth.condition);
                        const isSelected = selectedTeeth.includes(toothNum);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => handleToothClick(toothNum)}
                            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md ${getConditionColor(tooth.condition)} ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="w-4 h-4" />
                              <span className="font-bold text-lg">{toothNum}</span>
                              <span className="text-xs">{tooth.condition}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Jaw */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Lower Jaw</h3>
                <div className="grid grid-cols-2 gap-8">
                  {/* Lower Left (17-24) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 text-center">Lower Left</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TEETH_LAYOUT.lowerLeft.map((toothNum) => {
                        const tooth = teeth[toothNum];
                        const Icon = getConditionIcon(tooth.condition);
                        const isSelected = selectedTeeth.includes(toothNum);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => handleToothClick(toothNum)}
                            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md ${getConditionColor(tooth.condition)} ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="w-4 h-4" />
                              <span className="font-bold text-lg">{toothNum}</span>
                              <span className="text-xs">{tooth.condition}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lower Right (25-32) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 text-center">Lower Right</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TEETH_LAYOUT.lowerRight.map((toothNum) => {
                        const tooth = teeth[toothNum];
                        const Icon = getConditionIcon(tooth.condition);
                        const isSelected = selectedTeeth.includes(toothNum);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => handleToothClick(toothNum)}
                            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md ${getConditionColor(tooth.condition)} ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="w-4 h-4" />
                              <span className="font-bold text-lg">{toothNum}</span>
                              <span className="text-xs">{tooth.condition}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary and Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Condition Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Condition Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No teeth data available</p>
                ) : (
                  summary.map((item) => {
                    const Icon = getConditionIcon(item.condition);
                    return (
                      <div
                        key={item.condition}
                        className={`p-4 rounded-lg border ${getConditionColor(item.condition)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            <span className="font-semibold">{item.condition}</span>
                          </div>
                          <span className="text-2xl font-bold">{item.count}</span>
                        </div>
                        <p className="text-xs opacity-75">
                          Teeth: {item.teeth.join(', ')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Procedure Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Procedure Overview
                </CardTitle>
                {procedures.length > 0 && (
                  <Button size="sm" asChild>
                    <Link to={`/dentist/patient/treatment/plan?patient=${selectedPatient}&fromChart=true`}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Create Treatment Plan
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {procedures.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No procedures needed. All teeth are healthy or have been treated.
                  </p>
                ) : (
                  procedures.map((procedure, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        procedure.type === 'Implant'
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-destructive/10 border-destructive/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <h4 className="font-semibold text-lg">{procedure.type}s Needed</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Teeth:</span> {procedure.teeth.join(', ')} ({procedure.teeth.length} {procedure.type.toLowerCase()}{procedure.teeth.length !== 1 ? 's' : ''})
                      </p>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Recommended Procedures:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {procedure.recommendedProcedures.map((proc, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              {proc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Tooth Modal */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
            <Card className="w-full max-w-[500px] m-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>
                  {selectedTeeth.length > 0 
                    ? `Update ${selectedTeeth.length} Selected Tooth${selectedTeeth.length !== 1 ? 's' : ''}`
                    : `Update Tooth #${selectedTooth}`
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedTeeth.length > 0
                    ? `Update the condition and procedure details for ${selectedTeeth.length} selected tooth${selectedTeeth.length !== 1 ? 's' : ''}.`
                    : 'Update the condition and procedure details for this tooth.'
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field orientation="vertical">
                  <FieldLabel>Condition</FieldLabel>
                  <FieldContent>
                    <Select
                      value={selectedCondition}
                      onValueChange={(value) => {
                        setSelectedCondition(value as ToothCondition);
                        if (value !== 'Implant' && value !== 'For Filling') {
                          setProcedureType('');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((c) => (
  <SelectItem key={c.id} value={c.name}>
    {c.name}
  </SelectItem>
))}

                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                {(selectedCondition === 'Implant' || selectedCondition === 'For Filling') && (
                  <Field orientation="vertical">
                    <FieldLabel>
                      {selectedCondition === 'Implant' ? 'Implant Type' : 'Filling Type'}
                    </FieldLabel>
                    <FieldContent>
                      <Select value={procedureType} onValueChange={setProcedureType}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${selectedCondition === 'Implant' ? 'implant' : 'filling'} type`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedCondition === 'Implant' ? IMPLANT_TYPES : FILLING_TYPES).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                )}

                <Field orientation="vertical">
                  <FieldLabel>Notes (Optional)</FieldLabel>
                  <FieldContent>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Add any additional notes about this tooth..."
                    />
                  </FieldContent>
                </Field>
              </CardContent>
              <CardContent className="flex justify-end gap-2 pt-0">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  if (selectedTeeth.length > 0) {
                    setSelectedTeeth([]);
                    setIsMultiSelectMode(false);
                  }
                }}>
                  Cancel
                </Button>
                <Button onClick={selectedTeeth.length > 0 ? handleApplyCondition : handleSave}>
                  {selectedTeeth.length > 0 ? `Apply to ${selectedTeeth.length} Tooth${selectedTeeth.length !== 1 ? 's' : ''}` : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DentalCharting;
