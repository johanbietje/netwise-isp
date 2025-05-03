import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Calendar, 
  Lock, 
  Unlock,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const conferenceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  tenantId: z.number().min(1, 'Tenant is required'),
  maxParticipants: z.number().min(2, 'Must allow at least 2 participants').max(100),
  pinProtected: z.boolean().default(false),
  moderatorPin: z.string().optional(),
  participantPin: z.string().optional(),
  recordingEnabled: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ConferenceFormValues = z.infer<typeof conferenceSchema>;

interface Conference {
  id: number;
  name: string;
  description: string | null;
  tenantId: number;
  maxParticipants: number;
  pinProtected: boolean;
  moderatorPin: string | null;
  participantPin: string | null;
  recordingEnabled: boolean;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdAt: string;
}

export function PbxConferences() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  
  // Get all tenants
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/pbx/tenants'],
  });
  
  // Form for creating a new conference
  const form = useForm<ConferenceFormValues>({
    resolver: zodResolver(conferenceSchema),
    defaultValues: {
      name: '',
      description: '',
      tenantId: 0,
      maxParticipants: 10,
      pinProtected: false,
      moderatorPin: '',
      participantPin: '',
      recordingEnabled: false,
    },
  });

  // Watch form values to conditionally show fields
  const isPinProtected = form.watch('pinProtected');

  // Example conference data for demonstration
  const conferences: Conference[] = [
    {
      id: 1,
      name: 'Weekly Team Meeting',
      description: 'Regular team sync for the development team',
      tenantId: 1,
      maxParticipants: 20,
      pinProtected: true,
      moderatorPin: '1234',
      participantPin: '5678',
      recordingEnabled: true,
      startDate: null,
      endDate: null,
      active: true,
      createdAt: '2023-09-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Client Presentation',
      description: 'Product demo for potential clients',
      tenantId: 1,
      maxParticipants: 15,
      pinProtected: false,
      moderatorPin: null,
      participantPin: null,
      recordingEnabled: true,
      startDate: '2023-10-15T14:00:00Z',
      endDate: '2023-10-15T15:30:00Z',
      active: true,
      createdAt: '2023-09-05T08:30:00Z'
    }
  ];

  const onSubmit = (values: ConferenceFormValues) => {
    // In a real implementation, this would make an API call
    toast({
      title: 'Conference Created',
      description: `Created conference "${values.name}" successfully`,
    });
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleAddParticipant = (conference: Conference) => {
    setSelectedConference(conference);
    setIsParticipantDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Conference Bridges</h2>
          <p className="text-gray-500 mt-1">Manage multi-party conference calls</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Conference
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Conference Bridge</DialogTitle>
                <DialogDescription>
                  Set up a new conference bridge for multi-party calls.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants?.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conference Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Weekly Team Meeting" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={2} 
                              max={100} 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the conference"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date/Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank for permanent conference
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date/Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="pinProtected"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>PIN Protection</FormLabel>
                          <FormDescription>
                            Require PINs for access to the conference
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {isPinProtected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="moderatorPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moderator PIN</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 1234" {...field} />
                            </FormControl>
                            <FormDescription>
                              For conference hosts/moderators
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="participantPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Participant PIN</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="recordingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Conference Recording</FormLabel>
                          <FormDescription>
                            Enable automatic recording of the conference
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Create Conference</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conference Bridges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {conferences.map((conference) => (
          <Card key={conference.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{conference.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Conference Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleAddParticipant(conference)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Participant
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      View Participants
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Edit Conference
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete Conference
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">{conference.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Max Participants</p>
                  <p className="font-medium">{conference.maxParticipants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">PIN Protection</p>
                  <div className="font-medium flex items-center">
                    {conference.pinProtected ? (
                      <><Lock className="h-3 w-3 mr-1" /> Enabled</>
                    ) : (
                      <><Unlock className="h-3 w-3 mr-1" /> Disabled</>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Recording</p>
                  <p className="font-medium">
                    {conference.recordingEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenant</p>
                  <p className="font-medium">
                    {tenants?.find((t) => t.id === conference.tenantId)?.name || 'Unknown'}
                  </p>
                </div>
                {conference.startDate && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> Schedule
                    </p>
                    <p className="font-medium">
                      {new Date(conference.startDate).toLocaleString()} - 
                      {conference.endDate ? new Date(conference.endDate).toLocaleString() : 'Ongoing'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Join Conference
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add Participant Dialog */}
      <Dialog open={isParticipantDialogOpen} onOpenChange={setIsParticipantDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a new participant to the "{selectedConference?.name}" conference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Extension</FormLabel>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an extension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="101">Ext 101 - John Doe</SelectItem>
                    <SelectItem value="102">Ext 102 - Jane Smith</SelectItem>
                    <SelectItem value="103">Ext 103 - Bob Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">External Number</FormLabel>
              <Input className="col-span-3" placeholder="+1 (555) 123-4567" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Role</FormLabel>
              <div className="col-span-3">
                <Select defaultValue="participant">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="listener">Listener (Muted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <div className="flex items-center space-x-2">
                  <Switch id="mute-participant" />
                  <FormLabel htmlFor="mute-participant">Join muted</FormLabel>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                toast({
                  title: 'Participant Added',
                  description: 'The participant has been added to the conference',
                });
                setIsParticipantDialogOpen(false);
              }}
            >
              Add Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxConferences;