import InventoryLayout from '@/layout/InventoryLayout';
import InventoryDashboard from '@/pages/inventory/InventoryDashboard';
import InventoryTable from '@/pages/inventory/inventorytable/InventoryTable';
import StockLogs from '@/pages/inventory/StockLogs';
import Supplier from '@/pages/inventory/Supplier';
import Report from '@/pages/inventory/Report';
import Alerts from '@/pages/inventory/Alerts';
import WasteDisposal from '@/pages/inventory/WasteDisposal';
import { Route } from 'react-router-dom';

export const inventoryRouteData = [
    { index: true, path: undefined, element: <InventoryDashboard />, title: 'Inventory Dashboard' },
    { index: false, path: 'table', element: <InventoryTable />, title: 'Inventory Table' }
    ,{ index: false, path: 'stock-logs', element: <StockLogs />, title: 'Stock Logs' }
    ,{ index: false, path: 'supplier', element: <Supplier />, title: 'Suppliers' },
    { index: false, path: 'report', element: <Report />, title: 'Reports' },
    { index: false, path: 'alerts', element: <Alerts />, title: 'Alerts' },
    { index: false, path: 'waste-disposal', element: <WasteDisposal />, title: 'Waste & Disposal' }
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
