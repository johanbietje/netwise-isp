import { Menu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PbxIvrMenus() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">IVR Menus</h2>
          <p className="text-gray-500 mt-1">Manage interactive voice response menus</p>
        </div>
      </div>
      
      {/* Placeholder for IVR Menus */}
      <Card>
        <CardContent className="pt-6 text-center">
          <Menu className="mx-auto h-12 w-12 text-purple-200 mb-3" />
          <h3 className="text-lg font-medium">IVR Menus Management</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            This is a placeholder for the IVR Menus management interface.
            IVR menus allow callers to navigate through options with dial pad input.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PbxIvrMenus;