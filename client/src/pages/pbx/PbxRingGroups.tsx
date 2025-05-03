import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PbxRingGroups() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ring Groups</h2>
          <p className="text-gray-500 mt-1">Manage extension groups for simultaneous or sequential ringing</p>
        </div>
      </div>
      
      {/* Placeholder for Ring Groups */}
      <Card>
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-purple-200 mb-3" />
          <h3 className="text-lg font-medium">Ring Groups Management</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            This is a placeholder for the Ring Groups management interface.
            Ring groups allow multiple extensions to be called simultaneously or sequentially.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PbxRingGroups;