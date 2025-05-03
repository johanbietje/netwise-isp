import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Plan } from '@shared/schema';

export function PackagesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<Plan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    downloadSpeed: 0,
    uploadSpeed: 0,
    dataLimit: 0,
    price: 0,
    isUnlimited: false
  });

  // Fetch all packages
  const { data: packages = [], isLoading, isError } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add package mutation
  const addPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/plans', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Package Added",
        description: "The internet package has been added successfully.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to add package",
        description: error.message || "There was an error adding the package."
      });
    }
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/plans/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Package Updated",
        description: "The internet package has been updated successfully.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update package",
        description: error.message || "There was an error updating the package."
      });
    }
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/plans/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Package Deleted",
        description: "The internet package has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete package",
        description: error.message || "There was an error deleting the package."
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isUnlimited: checked,
      dataLimit: checked ? 0 : formData.dataLimit
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packageData = {
      name: formData.name,
      downloadSpeed: formData.downloadSpeed,
      uploadSpeed: formData.uploadSpeed,
      dataLimit: formData.isUnlimited ? null : formData.dataLimit,
      price: formData.price
    };
    addPackageMutation.mutate(packageData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPackage) return;
    
    const packageData = {
      id: currentPackage.id,
      name: formData.name,
      downloadSpeed: formData.downloadSpeed,
      uploadSpeed: formData.uploadSpeed,
      dataLimit: formData.isUnlimited ? null : formData.dataLimit,
      price: formData.price
    };
    updatePackageMutation.mutate(packageData);
  };

  const handleDeleteConfirm = () => {
    if (currentPackage) {
      deletePackageMutation.mutate(currentPackage.id);
    }
  };

  const openEditDialog = (pkg: Plan) => {
    setCurrentPackage(pkg);
    setFormData({
      name: pkg.name,
      downloadSpeed: pkg.downloadSpeed,
      uploadSpeed: pkg.uploadSpeed,
      dataLimit: pkg.dataLimit || 0,
      price: pkg.price,
      isUnlimited: pkg.dataLimit === null
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (pkg: Plan) => {
    setCurrentPackage(pkg);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      downloadSpeed: 0,
      uploadSpeed: 0,
      dataLimit: 0,
      price: 0,
      isUnlimited: false
    });
    setCurrentPackage(null);
  };

  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-red-300">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-4">
              <h3 className="text-lg font-semibold text-red-600">Failed to load packages</h3>
              <p className="text-gray-500 mt-2">There was an error fetching the internet packages. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Internet Packages</h1>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Package
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <h3 className="text-lg font-semibold">No packages available</h3>
              <p className="text-gray-500 mt-2">Add your first internet package to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Download Speed</TableHead>
                  <TableHead>Upload Speed</TableHead>
                  <TableHead>Data Limit</TableHead>
                  <TableHead>Price</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg: Plan) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.downloadSpeed} Mbps</TableCell>
                    <TableCell>{pkg.uploadSpeed} Mbps</TableCell>
                    <TableCell>{pkg.dataLimit === null ? 'Unlimited' : `${pkg.dataLimit} GB`}</TableCell>
                    <TableCell>R {pkg.price.toFixed(2)}/month</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(pkg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(pkg)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Internet Package</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="downloadSpeed" className="text-right">Download Speed (Mbps)</Label>
                <Input
                  id="downloadSpeed"
                  name="downloadSpeed"
                  type="number"
                  value={formData.downloadSpeed}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uploadSpeed" className="text-right">Upload Speed (Mbps)</Label>
                <Input
                  id="uploadSpeed"
                  name="uploadSpeed"
                  type="number"
                  value={formData.uploadSpeed}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Data Limit</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="unlimited" 
                    checked={formData.isUnlimited}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label htmlFor="unlimited" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Unlimited
                  </label>
                </div>
              </div>
              {!formData.isUnlimited && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataLimit" className="text-right">Data Limit (GB)</Label>
                  <Input
                    id="dataLimit"
                    name="dataLimit"
                    type="number"
                    value={formData.dataLimit}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required={!formData.isUnlimited}
                    min="1"
                    disabled={formData.isUnlimited}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Monthly Price (R)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addPackageMutation.isPending}>
                {addPackageMutation.isPending ? 'Adding...' : 'Add Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Internet Package</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-downloadSpeed" className="text-right">Download Speed (Mbps)</Label>
                <Input
                  id="edit-downloadSpeed"
                  name="downloadSpeed"
                  type="number"
                  value={formData.downloadSpeed}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-uploadSpeed" className="text-right">Upload Speed (Mbps)</Label>
                <Input
                  id="edit-uploadSpeed"
                  name="uploadSpeed"
                  type="number"
                  value={formData.uploadSpeed}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Data Limit</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="edit-unlimited" 
                    checked={formData.isUnlimited}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label htmlFor="edit-unlimited" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Unlimited
                  </label>
                </div>
              </div>
              {!formData.isUnlimited && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-dataLimit" className="text-right">Data Limit (GB)</Label>
                  <Input
                    id="edit-dataLimit"
                    name="dataLimit"
                    type="number"
                    value={formData.dataLimit}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required={!formData.isUnlimited}
                    min="1"
                    disabled={formData.isUnlimited}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">Monthly Price (R)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePackageMutation.isPending}>
                {updatePackageMutation.isPending ? 'Updating...' : 'Update Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Package Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the <strong>{currentPackage?.name}</strong> package?</p>
            <p className="text-gray-500 text-sm mt-2">This action cannot be undone and may affect customers currently subscribed to this package.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deletePackageMutation.isPending}>
              {deletePackageMutation.isPending ? 'Deleting...' : 'Delete Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PackagesPage;