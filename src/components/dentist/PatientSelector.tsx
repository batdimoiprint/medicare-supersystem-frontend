import { useState } from 'react';
import { User, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';

const MOCK_PATIENTS = [
  'All Patients',
  'John Doe',
  'Jane Smith',
  'Michael Johnson',
  'Sarah Williams',
  'David Brown',
  'Emily Davis',
];

interface PatientSelectorProps {
  selectedPatient: string;
  onPatientChange: (patient: string) => void;
  onNewPatient?: () => void;
}

export const PatientSelector = ({ selectedPatient, onPatientChange, onNewPatient }: PatientSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = MOCK_PATIENTS.filter(patient =>
    searchTerm === '' || patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    {filteredPatients.map((patient) => (
                      <SelectItem key={patient} value={patient}>
                        {patient}
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

