import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Ticket, TicketComment, Customer, User } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDistance } from 'date-fns';

// Schema for ticket form
const ticketSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"])
});

// Schema for comment form
const commentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty")
});

type TicketFormData = z.infer<typeof ticketSchema>;
type CommentFormData = z.infer<typeof commentSchema>;

interface TicketFormProps {
  id?: number;
}

export default function TicketForm({ id }: TicketFormProps = {}) {
  const isEditMode = !!id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch ticket data if in edit mode
  const { data: ticketData, isLoading: isLoadingTicket } = useQuery<Ticket & { comments: TicketComment[] }>({
    queryKey: [`/api/tickets/${id}`],
    enabled: isEditMode,
    retry: false
  });
  
  // Fetch list of customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    retry: false
  });
  
  // Form setup for ticket
  const ticketForm = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      customerId: '',
      subject: '',
      description: '',
      priority: 'medium',
      status: 'open'
    }
  });
  
  // Form setup for comments
  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: ''
    }
  });
  
  // Update form with ticket data when loaded
  useEffect(() => {
    if (ticketData) {
      ticketForm.reset({
        customerId: ticketData.customerId.toString(),
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority as any,
        status: ticketData.status as any
      });
    }
  }, [ticketData, ticketForm]);
  
  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await apiRequest('POST', '/api/tickets', {
        customerId: parseInt(data.customerId),
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: 'Ticket Created',
        description: 'The ticket has been created successfully.',
      });
      navigate('/tickets');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ticket.',
      });
    }
  });
  
  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await apiRequest('PUT', `/api/tickets/${id}`, {
        customerId: parseInt(data.customerId),
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        assignedToUserId: ticketData?.assignedToUserId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: 'Ticket Updated',
        description: 'The ticket has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ticket.',
      });
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const response = await apiRequest('POST', `/api/tickets/${id}/comments`, {
        comment: data.comment
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      commentForm.reset();
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment.',
      });
    }
  });
  
  const onSubmitTicket = (data: TicketFormData) => {
    if (isEditMode) {
      updateTicketMutation.mutate(data);
    } else {
      createTicketMutation.mutate(data);
    }
  };
  
  const onSubmitComment = (data: CommentFormData) => {
    addCommentMutation.mutate(data);
  };
  
  const isLoading = isLoadingTicket || isLoadingCustomers || 
                    createTicketMutation.isPending || 
                    updateTicketMutation.isPending;
  
  // Helper function to get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Priority badge component
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/tickets')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Ticket Details' : 'Create New Ticket'}
          </h1>
        </div>
        
        {isLoading && isEditMode ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Ticket Information Card */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle>{isEditMode ? 'Ticket #' + id : 'New Ticket'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...ticketForm}>
                  <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="space-y-6">
                    <FormField
                      control={ticketForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select
                            disabled={isEditMode}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.fullName} ({customer.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="Describe the issue in detail..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={ticketForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ticketForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/tickets')}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Update Ticket' : 'Create Ticket'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Comments Section (Only for Edit Mode) */}
            {isEditMode && (
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketData?.comments && ticketData.comments.length > 0 ? (
                    <div className="space-y-4">
                      {ticketData.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {comment.userId ? 'U' : 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium">
                                {comment.userId ? 'Support Agent' : 'Customer'}
                              </h4>
                              <time className="text-xs text-gray-500">
                                {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                              </time>
                            </div>
                            <p className="mt-1 text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">No comments yet.</p>
                  )}
                  
                  {/* Add comment form */}
                  <Form {...commentForm}>
                    <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="mt-6">
                      <FormField
                        control={commentForm.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Add a Comment</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3}
                                placeholder="Type your comment here..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Post Comment
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
