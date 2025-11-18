import ReceptionistLayout from '@/layout/ReceptionistLayout';
import FrontDeskPage from '@/pages/receptionist/ReceptionistPage';
import { Route } from 'react-router-dom';

export const receptionistRoutes = (
    <Route path='/receptionist' element={<ReceptionistLayout />}>
        <Route index element={<FrontDeskPage />} />
    </Route>
);

export default receptionistRoutes;
