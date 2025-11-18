import PatientLayout from '@/layout/PatientLayout';
import PatientPage from '@/pages/patient/PatientPage';
import { Route } from 'react-router-dom';

export const patientRoutes = (
    <Route path='/patient' element={<PatientLayout />}>
        <Route index element={<PatientPage />} />
    </Route>
);

export default patientRoutes;
