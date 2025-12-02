import { useState, useEffect } from 'react';
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
import { patientRecordClient, inventoryClient } from '@/utils/supabase';

// --- Type Definitions ---
interface MaterialLog {
  id: number;
  created_at: string;
  item_name: string;
  category: string;
  quantity: number;
  unit?: string | null;
  unit_cost?: number | null;
  supplier?: string | null;
  reference?: string | null;
  type?: string | null;
  notes?: string | null;
  created_by?: string | null;
  timestamp_local?: string | null;
  user_name?: string | null;
  // UI-only fields (not in database)
  procedure?: string;
  patient_name?: string;
}

interface PatientRow {
  patient_id: number;
  f_name?: string;
  m_name?: string;
  l_name?: string;
}

interface InventoryItem {
  name: string;
  category: string;
  unit_cost: number;
}

// --- Main Component ---
const MaterialsLogging = () => {
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<MaterialLog>>({
    item_name: '',
    category: '',
    quantity: 0,
    unit: null,
    unit_cost: null,
    supplier: 'N/A',
    notes: null,
    // UI-only fields
    procedure: '',
    patient_name: '',
  });

  // Load patients
  useEffect(() => {
    const loadPatients = async () => {
      const { data } = await patientRecordClient
        .from('patient_tbl')
        .select('patient_id, f_name, m_name, l_name')
        .order('l_name', { ascending: true });
      setPatients(data ?? []);
    };
    loadPatients();
  }, []);

  // Load inventory items (consumables, medicines, equipment)
  useEffect(() => {
    const loadInventoryItems = async () => {
      try {
        const [consumables, medicines, equipment] = await Promise.all([
          inventoryClient.from('consumables_tbl').select('consumable_name, unit_cost'),
          inventoryClient.from('medicine_tbl').select('medicine_name, unit_cost'),
          inventoryClient.from('equipment_tbl').select('equipment_name, unit_cost'),
        ]);

        const items: InventoryItem[] = [
          ...(consumables.data ?? []).map(c => ({ name: c.consumable_name, category: 'Consumables', unit_cost: c.unit_cost || 0 })),
          ...(medicines.data ?? []).map(m => ({ name: m.medicine_name, category: 'Medicines', unit_cost: m.unit_cost || 0 })),
          ...(equipment.data ?? []).map(e => ({ name: e.equipment_name, category: 'Equipment', unit_cost: e.unit_cost || 0 })),
        ];
        setInventoryItems(items);
      } catch (err) {
        console.error('Failed to load inventory items:', err);
      }
    };
    loadInventoryItems();
  }, []);

  // Load stock out logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await inventoryClient
        .from('stock_out')
        .select('id, created_at, item_name, category, quantity, unit, unit_cost, supplier, reference, type, notes, created_by, timestamp_local, user_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse procedure and patient_name from notes if they exist
      const parsedLogs = (data ?? []).map(log => {
        const parsed: MaterialLog = { ...log };
        if (log.notes) {
          const notes = log.notes;
          const procedureMatch = notes.match(/Procedure:\s*(.+?)(?:\n|$)/i);
          const patientMatch = notes.match(/Patient:\s*(.+?)(?:\n|$)/i);
          if (procedureMatch) {
            parsed.procedure = procedureMatch[1].trim();
          }
          if (patientMatch) {
            parsed.patient_name = patientMatch[1].trim();
          }
        }
        return parsed;
      });
      
      setLogs(parsedLogs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);


  const filteredLogs = logs.filter((log) =>
    log.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = logs.reduce((sum, log) => sum + ((log.unit_cost || 0) * log.quantity), 0);
  const thisMonthCost = logs
    .filter(l => {
      const logDate = new Date(l.created_at);
      const now = new Date();
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, log) => sum + ((log.unit_cost || 0) * log.quantity), 0);

  const categoryBreakdown = logs.reduce((acc, log) => {
    const cat = log.category || 'Other';
    acc[cat] = (acc[cat] || 0) + ((log.unit_cost || 0) * log.quantity);
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      item_name: '',
      category: '',
      quantity: 0,
      unit: null,
      unit_cost: null,
      supplier: 'N/A',
      notes: null,
      procedure: '',
      patient_name: '',
    });
  };

  const handleEdit = (log: MaterialLog) => {
    setIsEditing(log.id);
    setIsAdding(false);
    setFormData(log);
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        // Combine procedure and patient_name into notes if provided
        let combinedNotes = formData.notes || '';
        if (formData.procedure) {
          combinedNotes = `Procedure: ${formData.procedure}${combinedNotes ? `\n${combinedNotes}` : ''}`;
        }
        if (formData.patient_name) {
          combinedNotes = `Patient: ${formData.patient_name}${combinedNotes ? `\n${combinedNotes}` : ''}`;
        }
        
        const { error } = await inventoryClient
          .from('stock_out')
          .update({
            item_name: formData.item_name,
            category: formData.category,
            quantity: formData.quantity,
            unit: formData.unit || null,
            unit_cost: formData.unit_cost || null,
            supplier: formData.supplier || null,
            notes: combinedNotes || null,
          })
          .eq('id', isEditing);

        if (error) throw error;
        setIsEditing(null);
      } else if (isAdding) {
        // Generate reference number (SO-XXXXXXXX format)
        const reference = `SO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        
        // Combine procedure and patient_name into notes if provided
        let combinedNotes = formData.notes || '';
        if (formData.procedure) {
          combinedNotes = `Procedure: ${formData.procedure}${combinedNotes ? `\n${combinedNotes}` : ''}`;
        }
        if (formData.patient_name) {
          combinedNotes = `Patient: ${formData.patient_name}${combinedNotes ? `\n${combinedNotes}` : ''}`;
        }
        
        const { error } = await inventoryClient
          .from('stock_out')
          .insert({
            item_name: formData.item_name,
            category: formData.category,
            quantity: formData.quantity,
            unit: formData.unit || null,
            unit_cost: formData.unit_cost || null,
            supplier: formData.supplier || 'N/A',
            reference: reference,
            notes: combinedNotes || null,
            user_name: 'Dentist', // You can get this from sessionStorage if needed
          });

        if (error) throw error;
        setIsAdding(false);
      }

      await loadLogs();
      alert('Material log saved successfully!');

      setFormData({
        item_name: '',
        category: '',
        quantity: 0,
        unit: 'unit',
        procedure: '',
        patient_name: '',
        unit_cost: 0,
        notes: '',
      });
    } catch (err) {
      console.error('Failed to save log:', err);
      alert('Failed to save material log');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      item_name: '',
      category: '',
      quantity: 0,
      unit: null,
      unit_cost: null,
      supplier: 'N/A',
      notes: null,
      procedure: '',
      patient_name: '',
    });
  };

  return (
    <>
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
              <Button variant="outline" onClick={() => {/* Export functionality */ }}>
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
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
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
                    const logDate = new Date(l.created_at);
                    const now = new Date();
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(thisMonthCost)}
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
                    <p className="text-lg font-bold text-primary">{formatCurrency(cost)}</p>
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
                    value={formData.item_name}
                    onValueChange={(value) => {
                      const item = inventoryItems.find(i => i.name === value);
                      setFormData({ 
                        ...formData, 
                        item_name: value,
                        category: item?.category || formData.category,
                        unit_cost: item?.unit_cost || formData.unit_cost,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          {item.name} ({item.category})
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
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Medicines">Medicines</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Quantity</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Unit</FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value || null })}
                    placeholder="e.g., pieces, boxes, vials"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Unit Cost (₱)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={formData.unit_cost || ''}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Supplier</FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.supplier || 'N/A'}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value || 'N/A' })}
                    placeholder="N/A"
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel>Patient</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.patient_name}
                    onValueChange={(value) => setFormData({ ...formData, patient_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem 
                          key={patient.patient_id} 
                          value={`${patient.f_name ?? ''} ${patient.m_name ?? ''} ${patient.l_name ?? ''}`.trim()}
                        >
                          {`${patient.f_name ?? ''} ${patient.m_name ?? ''} ${patient.l_name ?? ''}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                  className="w-full min-h-[80px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional notes... (You can include procedure and patient info here if needed)"
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
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Loading logs...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
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
                    <CardTitle className="text-xl mb-2">{log.item_name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                        {log.category || 'Uncategorized'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                      {log.patient_name && <span className="font-medium">{log.patient_name}</span>}
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
                    <p className="font-semibold">{log.quantity} {log.unit || 'units'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                    <p className="font-semibold text-primary">{formatCurrency(log.unit_cost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-semibold text-primary">{formatCurrency(log.quantity * (log.unit_cost || 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-semibold">{log.supplier || 'N/A'}</p>
                  </div>
                  {log.reference && (
                    <div className="md:col-span-4">
                      <p className="text-sm text-muted-foreground">Reference</p>
                      <p className="font-semibold text-xs">{log.reference}</p>
                    </div>
                  )}
                  {log.user_name && (
                    <div className="md:col-span-4">
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-semibold text-xs">{log.user_name}</p>
                    </div>
                  )}
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
    </>
  );
};

export default MaterialsLogging;

