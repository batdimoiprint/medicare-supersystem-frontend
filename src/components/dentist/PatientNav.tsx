import { Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  FileText,
  ClipboardList,
  Pill,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/dentist/patient/charting', label: 'Dental Charting', icon: Stethoscope },
  { path: '/dentist/patient/records', label: 'EMR Records', icon: FileText },
  { path: '/dentist/patient/treatment/plan', label: 'Treatment Plan', icon: ClipboardList },
  { path: '/dentist/patient/prescriptions', label: 'Prescriptions', icon: Pill },
];

export const PatientNav = () => {
  const location = useLocation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                asChild
                className={cn(
                  'transition-all',
                  isActive && 'shadow-md'
                )}
              >
                <Link to={item.path}>
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

