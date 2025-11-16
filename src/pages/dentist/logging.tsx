import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  Search,
  TrendingUp,
  Download,
  Printer,
  BarChart3,
  ArrowLeft,
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

// --- Type Definitions ---
interface MaterialLog {
  id: number;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  date: string;
  procedure: string;
  patientName: string;
  cost: number;
  notes?: string;
}

// --- Mock Data ---
const INITIAL_LOGS: MaterialLog[] = [
  {
    id: 1,
    materialName: 'Composite Resin',
    category: 'Filling Materials',
    quantity: 2,
    unit: 'pack',
    date: '2024-01-15',
    procedure: 'Composite Filling',
    patientName: 'John Doe',
    cost: 500,
    notes: 'Used for tooth #3 and #14',
  },
  {
    id: 2,
    materialName: 'Local Anesthetic',
    category: 'Anesthetics',
    quantity: 1,
    unit: 'vial',
    date: '2024-01-15',
    procedure: 'Tooth Extraction',
    patientName: 'Jane Smith',
    cost: 150,
  },
];

const MATERIAL_CATEGORIES = [
  'Filling Materials',
  'Anesthetics',
  'Impression Materials',
  'Crown & Bridge Materials',
  'Orthodontic Materials',
  'Surgical Supplies',
  'Disinfectants',
  'Other',
];

const COMMON_MATERIALS = [
  'Composite Resin',
  'Amalgam',
  'Local Anesthetic',
  'Gauze',
  'Cotton Rolls',
  'Dental Floss',
  'Bonding Agent',
  'Etching Gel',
];

// --- Main Component ---
const MaterialsLogging = () => {
  const [logs, setLogs] = useState<MaterialLog[]>(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<MaterialLog>>({
    materialName: '',
    category: '',
    quantity: 0,
    unit: 'unit',
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    patientName: '',
    cost: 0,
    notes: '',
  });

  const filteredLogs = logs.filter((log) =>
    log.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = logs.reduce((sum, log) => sum + (log.cost * log.quantity), 0);
  const thisMonthCost = logs
    .filter(l => {
      const logDate = new Date(l.date);
      const now = new Date();
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, log) => sum + (log.cost * log.quantity), 0);
  
  const categoryBreakdown = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + (log.cost * log.quantity);
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      materialName: '',
      category: '',
      quantity: 0,
      unit: 'unit',
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      patientName: '',
      cost: 0,
      notes: '',
    });
  };

  const handleEdit = (log: MaterialLog) => {
    setIsEditing(log.id);
    setIsAdding(false);
    setFormData(log);
  };

  const handleSave = () => {
    if (isEditing) {
      setLogs(logs.map(l => l.id === isEditing ? { ...formData, id: isEditing } as MaterialLog : l));
      setIsEditing(null);
    } else if (isAdding) {
      const newLog: MaterialLog = {
        ...formData,
        id: Date.now(),
      } as MaterialLog;
      setLogs([...logs, newLog]);
      setIsAdding(false);
    }
    setFormData({
      materialName: '',
      category: '',
      quantity: 0,
      unit: 'unit',
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      patientName: '',
      cost: 0,
      notes: '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      materialName: '',
      category: '',
      quantity: 0,
      unit: 'unit',
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      patientName: '',
      cost: 0,
      notes: '',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2 flex items-center gap-2">
                  <Package className="w-8 h-8" />
                  Materials Used Logging
                </CardTitle>
                <p className="text-muted-foreground">
                  Track materials and supplies used during procedures
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => {/* Export functionality */}}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Material
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-primary">₱{totalCost.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {logs.filter(l => {
                      const logDate = new Date(l.date);
                      const now = new Date();
                      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₱{thisMonthCost.toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{Object.keys(categoryBreakdown).length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, cost]) => (
                    <div key={category} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-1">{category}</p>
                      <p className="text-lg font-bold text-primary">₱{cost.toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Field orientation="vertical">
              <FieldLabel>Search Logs</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by material, patient, or category..."
                    className="pl-10"
                  />
                </div>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {(isAdding || isEditing) && (
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Material Log' : 'New Material Log'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field orientation="vertical">
                  <FieldLabel>Material Name</FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.materialName}
                      onValueChange={(value) => setFormData({ ...formData, materialName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_MATERIALS.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Category</FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Quantity</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Unit</FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="vial">Vial</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="tube">Tube</SelectItem>
                        <SelectItem value="sheet">Sheet</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Date</FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Cost (₱)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Patient Name</FieldLabel>
                  <FieldContent>
                    <Input
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      placeholder="Enter patient name"
                    />
                  </FieldContent>
                </Field>
                <Field orientation="vertical">
                  <FieldLabel>Procedure</FieldLabel>
                  <FieldContent>
                    <Input
                      value={formData.procedure}
                      onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                      placeholder="e.g., Composite Filling"
                    />
                  </FieldContent>
                </Field>
              </div>
              <Field orientation="vertical">
                <FieldLabel>Notes (Optional)</FieldLabel>
                <FieldContent>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full min-h-[80px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Additional notes..."
                  />
                </FieldContent>
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Log
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No material logs found</p>
                  <p className="text-sm mt-2">Log a material usage to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{log.materialName}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {log.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {log.date}
                        </div>
                        <span className="font-medium">{log.patientName}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{log.quantity} {log.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Procedure</p>
                      <p className="font-semibold">{log.procedure}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="font-semibold text-primary">₱{log.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="font-semibold text-primary">₱{(log.quantity * log.cost).toLocaleString()}</p>
                    </div>
                    <div className="md:col-span-4 pt-2">
                      <Link to={`/dentist/patient/records?patient=${log.patientName}`}>
                        <Button variant="outline" size="sm">
                          View Patient Records
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {log.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {log.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsLogging;

