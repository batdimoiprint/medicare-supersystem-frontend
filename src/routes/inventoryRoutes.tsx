import InventoryLayout from '@/layout/InventoryLayout';
import InventoryDashboard from '@/pages/inventory/InventoryDashboard';
import InventoryTable from '@/pages/inventory/inventorytable/InventoryTable';
import { Route } from 'react-router-dom';

export const inventoryRouteData = [
    { index: true, path: undefined, element: <InventoryDashboard />, title: 'Inventory Dashboard' },
    { index: false, path: 'table', element: <InventoryTable />, title: 'Inventory Table' }
];

export const inventoryRoutes = (
    <Route path='/inventory' element={<InventoryLayout />}>
        {inventoryRouteData.map((route, idx) => (
            <Route
                key={idx}
                index={route.index}
                path={route.path}
                element={route.element}
            />
        ))}
    </Route>
);

export default inventoryRoutes;
