import DentistLayout from '@/layout/DentistLayout';
import Dashboard from '@/pages/dentist/Dashboard';
import AppointmentWorkflow from '@/pages/dentist/appointments/appointment';
import FollowupApp from '@/pages/dentist/appointments/followup';
import PatientWorkflow from '@/pages/dentist/patient/workflow';
import DentalCharting from '@/pages/dentist/patient/charting';
import PatientRecords from '@/pages/dentist/patient/records';
import TreatmentPlanPage from '@/pages/dentist/patient/treatment-plan';
import PrescriptionsPage from '@/pages/dentist/patient/prescriptions';
import MaterialsLogging from '@/pages/dentist/logging';
import MySchedule from '@/pages/dentist/my-schedule';
import { Route } from 'react-router-dom';

export const dentistRouteData = [
    { index: true, element: <Dashboard />, title: 'Dashboard' },
    { path: 'appointments', element: <AppointmentWorkflow />, title: 'Appointments' },
    { path: 'appointments/followup', element: <FollowupApp />, title: 'Followup' },
    { path: 'patient/workflow', element: <PatientWorkflow />, title: 'Patient Workflow' },
    { path: 'patient/charting', element: <DentalCharting />, title: 'Dental Charting' },
    { path: 'patient/records', element: <PatientRecords />, title: 'Patient Records' },
    { path: 'patient/treatment/plan', element: <TreatmentPlanPage />, title: 'Treatment Plan' },
    { path: 'patient/prescriptions', element: <PrescriptionsPage />, title: 'Prescriptions' },
    { path: 'logging', element: <MaterialsLogging />, title: 'Materials Logging' },
    { path: 'my-schedule', element: <MySchedule />, title: 'My Schedule' },
];

export const dentistRoutes = (
    <Route path='/dentist' element={<DentistLayout />}>
        {dentistRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default dentistRoutes;
