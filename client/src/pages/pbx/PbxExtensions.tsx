import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function PbxExtensions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get all tenants
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/pbx/tenants'],
  });
  
  // Get extensions for the selected tenant
  const {
    data: extensions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/pbx/extensions', selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: async () => {
      if (!selectedTenantId) return [];
      return [];
      // In a real implementation, you would fetch from the API:
      // return apiRequest(`/api/pbx/extensions?tenantId=${selectedTenantId}`);
    },
  });
  
  // If no tenant is selected yet, show tenant selection
  if (!selectedTenantId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">PBX Extensions</h2>
            <p className="text-gray-500 mt-1">Select a tenant to manage extensions</p>
          </div>
        </div>
        
        {isLoadingTenants ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants?.map((tenant) => (
              <Card 
                key={tenant.id} 
                className="cursor-pointer hover:border-purple-300 transition-colors"
                onClick={() => setSelectedTenantId(tenant.id)}
              >
                <CardHeader>
                  <CardTitle>{tenant.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                  <Badge className="mt-3" variant={tenant.active ? "success" : "secondary"}>
                    {tenant.active ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            
            {tenants?.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium">No PBX Tenants Found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Please create a PBX tenant first before managing extensions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Get the selected tenant details
  const selectedTenant = tenants?.find(t => t.id === selectedTenantId);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Extensions</h2>
          <p className="text-gray-500 mt-1">
            Managing extensions for tenant: <span className="font-medium">{selectedTenant?.name}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedTenantId(null)}
          >
            Change Tenant
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {isAdmin && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Extension
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search extensions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Placeholder for Extensions List */}
      <Card>
        <CardContent className="pt-6 text-center">
          <Phone className="mx-auto h-12 w-12 text-purple-200 mb-3" />
          <h3 className="text-lg font-medium">Extensions Management</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            This is a placeholder for the Extensions management interface.
            In a real implementation, you would see a list of extensions for the selected tenant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PbxExtensions;