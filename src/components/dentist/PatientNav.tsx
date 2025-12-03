import { Link, useLocation } from 'react-router-dom';
import { Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const PatientNav = () => {
  const location = useLocation();
  const isActive = location.pathname === '/dentist/patient/workflow';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            asChild
            className={cn(
              'transition-all',
              isActive && 'shadow-md'
            )}
          >
            <Link to="/dentist/patient/workflow">
              <Workflow className="w-4 h-4 mr-2" />
              Patient Workflow
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

