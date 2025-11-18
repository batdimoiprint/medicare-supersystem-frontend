import CashierLayout from '@/layout/CashierLayout';
import CashierPage from '@/pages/cashier/CashierPage';
import { Route } from 'react-router-dom';

export const cashierRoutes = (
    <Route path='/cashier' element={<CashierLayout />}>
        <Route index element={<CashierPage />} />
    </Route>
);

export default cashierRoutes;
