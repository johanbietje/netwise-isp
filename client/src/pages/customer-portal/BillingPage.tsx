import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Redirect } from "wouter";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Download, 
  Receipt, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CalendarDays,
  ArrowRight,
  Loader2,
  Plus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Payment Method Card Component
const PaymentMethodCard = ({ 
  type = "visa", 
  last4 = "4242", 
  expiry = "12/25", 
  isDefault = false 
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="mr-3">
              {type === "visa" ? (
                <div className="bg-blue-500 text-white font-bold rounded px-2 py-1 text-sm">VISA</div>
              ) : type === "mastercard" ? (
                <div className="bg-red-500 text-white font-bold rounded px-2 py-1 text-sm">MC</div>
              ) : (
                <div className="bg-gray-500 text-white font-bold rounded px-2 py-1 text-sm">CARD</div>
              )}
            </div>
            <div>
              <p className="font-medium">•••• •••• •••• {last4}</p>
              <p className="text-sm text-gray-500">Expires {expiry}</p>
            </div>
          </div>
          {isDefault && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Default
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          {!isDefault && (
            <Button variant="outline" size="sm">Set Default</Button>
          )}
          {!isDefault && (
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">Remove</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function BillingPage() {
  const { customer, isLoading, logoutMutation } = useCustomerAuth();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  // Redirect if not logged in
  if (!isLoading && !customer) {
    return <Redirect to="/customer/login" />;
  }

  // Fetch billing data
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/customer/billing"],
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["/api/customer/payment-methods"],
  });

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-purple-800">Netwise</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-medium">{customer?.fullName || customer?.username}</p>
                <p className="text-xs text-gray-500">{customer?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{customer?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
          <p className="text-gray-500">Manage your payment methods and view invoices</p>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList className="mb-4">
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>View and download your invoice history</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : !invoices || invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No invoices found</h3>
                    <p className="text-gray-500 mt-1">Your invoice history will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                          <TableCell>{new Date(invoice.issuedAt).toLocaleDateString()}</TableCell>
                          <TableCell>R{invoice.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                PDF
                              </Button>
                              {invoice.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="bg-purple-700 hover:bg-purple-800 flex items-center gap-1"
                                >
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods</CardDescription>
                </div>
                <Button 
                  className="bg-purple-700 hover:bg-purple-800 flex items-center gap-1"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Payment Method
                </Button>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : !paymentMethods || paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No payment methods found</h3>
                    <p className="text-gray-500 mt-1">Add a payment method to pay your invoices easily</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* This would use real data from paymentMethods in a production app */}
                    <PaymentMethodCard type="visa" last4="4242" expiry="12/25" isDefault={true} />
                    <PaymentMethodCard type="mastercard" last4="8888" expiry="03/26" isDefault={false} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Payment Method Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Enter your card information to save a new payment method.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="p-6 border rounded-md bg-gray-50">
                    <p className="text-center text-gray-500 mb-2">Payment form would be here</p>
                    <p className="text-center text-gray-500 text-sm">
                      This would integrate with Stripe or another payment processor
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-purple-700 hover:bg-purple-800">
                    Save Payment Method
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your service subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="bg-purple-700 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">Premium Plan</h3>
                        <p className="opacity-90">High-speed fiber internet</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">R599.00</span>
                        <p className="opacity-90">per month</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">PLAN FEATURES</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>200 Mbps Download Speed</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>100 Mbps Upload Speed</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>Unlimited Data</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span>24/7 Customer Support</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">BILLING INFORMATION</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Next billing date</span>
                          <span className="font-medium">May 15, 2025</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment method</span>
                          <span className="font-medium">Visa •••• 4242</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Billing cycle</span>
                          <span className="font-medium">Monthly</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="flex-1">Update Payment Method</Button>
                      <Button className="flex-1 bg-purple-700 hover:bg-purple-800 flex items-center justify-center gap-1">
                        Upgrade Plan
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}