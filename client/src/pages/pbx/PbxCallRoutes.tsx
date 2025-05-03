import { Network } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PbxCallRoutes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Call Routes</h2>
          <p className="text-gray-500 mt-1">Manage call routing patterns and destinations</p>
        </div>
      </div>
      
      {/* Placeholder for Call Routes */}
      <Card>
        <CardContent className="pt-6 text-center">
          <Network className="mx-auto h-12 w-12 text-purple-200 mb-3" />
          <h3 className="text-lg font-medium">Call Routes Management</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            This is a placeholder for the Call Routes management interface.
            In a real implementation, you would see a list of call routing patterns and their destinations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PbxCallRoutes;