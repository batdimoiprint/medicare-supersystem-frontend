import DentistLayout from '@/layout/DentistLayout';
import Dashboard from '@/pages/dentist/Dashboard';
import AppointmentWorkflow from '@/pages/dentist/appointments/appointment';
import FollowupApp from '@/pages/dentist/appointments/followup';
import DentalCharting from '@/pages/dentist/patient/charting';
import PatientRecords from '@/pages/dentist/patient/records';
import TreatmentPlanPage from '@/pages/dentist/patient/treatment-plan';
import PrescriptionsPage from '@/pages/dentist/patient/prescriptions';
import MaterialsLogging from '@/pages/dentist/logging';
import MySchedule from '@/pages/dentist/my-schedule';
import { Route } from 'react-router-dom';

export const dentistRoutes = (
    <Route path='/dentist' element={<DentistLayout />}>
        <Route index element={<Dashboard />} />
        <Route path='appointments' element={<AppointmentWorkflow />} />
        <Route path='appointments/followup' element={<FollowupApp />} />
        <Route path='patient/charting' element={<DentalCharting />} />
        <Route path='patient/records' element={<PatientRecords />} />
        <Route path='patient/treatment/plan' element={<TreatmentPlanPage />} />
        <Route path='patient/prescriptions' element={<PrescriptionsPage />} />
        <Route path='logging' element={<MaterialsLogging />} />
        <Route path='my-schedule' element={<MySchedule />} />
    </Route>
);

export default dentistRoutes;
