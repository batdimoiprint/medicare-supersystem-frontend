import InventoryLayout from '@/layout/InventoryLayout';
import InventoryPage from '@/pages/inventory/InventoryPage';
import { Route } from 'react-router-dom';

export const inventoryRoutes = (
    <Route path='/inventory' element={<InventoryLayout />}>
        <Route index element={<InventoryPage />} />
    </Route>
);

export default inventoryRoutes;
