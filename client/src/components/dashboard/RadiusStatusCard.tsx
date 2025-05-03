import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Wifi, WifiOff, TicketCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CreateRadiusTicketButton } from "@/components/tickets/CreateRadiusTicketButton";

export function RadiusStatusCard() {
  // Get RADIUS status from the API
  const { data, isLoading } = useQuery({
    queryKey: ['/api/radius/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get open tickets related to RADIUS or connections
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets', { type: 'radius' }],
    refetchInterval: 60000 // Refresh every minute
  });

  const activeSessions = data?.activeSessions || 0;
  const totalClients = data?.totalClients || 0;
  const openTicketsCount = tickets?.length || 0;
  
  // Calculate connection percentage and status
  const connectionPercentage = totalClients > 0 ? (activeSessions / totalClients) * 100 : 0;
  const connectionStatus = connectionPercentage < 50 ? 'degraded' : 'healthy';
  
  // Prepare default ticket description based on status
  const defaultDescription = `
RADIUS Connection Status:
- Active connections: ${activeSessions}
- Total clients: ${totalClients}
- Connection percentage: ${connectionPercentage.toFixed(1)}%
- Status: ${connectionStatus.toUpperCase()}

Please investigate the RADIUS authentication service as customers are reporting connection issues.
  `.trim();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium">RADIUS Connections</CardTitle>
          {openTicketsCount > 0 && (
            <div className="flex items-center text-amber-500 text-xs">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>{openTicketsCount} open issue{openTicketsCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center">
              {activeSessions > 0 ? (
                <Wifi className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {activeSessions} active connection{activeSessions !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalClients} total client{totalClients !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
              <div 
                className={`h-full ${connectionStatus === 'degraded' ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}
                style={{ 
                  width: `${connectionPercentage}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          asChild
        >
          <Link to="/tickets?filter=radius">
            <TicketCheck className="h-3.5 w-3.5 mr-2" />
            View Tickets
          </Link>
        </Button>
        
        <CreateRadiusTicketButton 
          defaultDescription={defaultDescription}
          trigger={
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
            >
              Create Ticket
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}