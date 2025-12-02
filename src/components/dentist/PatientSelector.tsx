import { User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';

interface PatientRow {
  patient_id: number;
  f_name?: string;
  l_name?: string;
  m_name?: string;
}

interface PatientSelectorProps {
  selectedPatient: string;
  onPatientChange: (patientId: string) => void; // we return the patient ID
  patients: PatientRow[];                       // dynamic patients
  onNewPatient?: () => void;
}


export const PatientSelector = ({ selectedPatient, onPatientChange, patients, onNewPatient }: PatientSelectorProps) => {

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <User className="w-5 h-5 text-muted-foreground" />
            <Field orientation="vertical" className="flex-1">
              <FieldLabel>Current Patient</FieldLabel>
              <FieldContent>
                <Select value={selectedPatient} onValueChange={onPatientChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.patient_id} value={String(p.patient_id)}>
                        {`${p.f_name ?? ''} ${p.m_name ?? ''} ${p.l_name ?? ''}`.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
          {onNewPatient && (
            <Button variant="outline" onClick={onNewPatient} className="mt-6">
              <Plus className="w-4 h-4 mr-2" />
              New Patient
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

