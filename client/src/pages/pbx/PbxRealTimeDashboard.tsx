import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertCircle, 
  BarChart, 
  Clock, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  VolumeX, 
  Volume2, 
  Mic, 
  MicOff, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// For real implementation, this would be from your WebSocket
type CallStatus = 'ringing' | 'in-progress' | 'on-hold' | 'completed';

interface ActiveCall {
  id: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  tenant: string;
  startTime: Date;
  status: CallStatus;
  duration: number; // in seconds
}

export function PbxRealTimeDashboard() {
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [isMonitoringDialogOpen, setIsMonitoringDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Example stats for demonstration
  const stats = {
    activeCalls: 2,
    maxLines: 50,
    inboundCalls: 1,
    outboundCalls: 1,
    avgDuration: 145, // in seconds
    waitingCalls: 0
  };
  
  // Example active calls for demonstration
  const activeCalls: ActiveCall[] = [
    {
      id: '1234-5678',
      from: '(555) 123-4567',
      to: 'Ext. 101',
      direction: 'inbound',
      tenant: 'ABC Corp',
      startTime: new Date(Date.now() - 60000 * 2), // 2 minutes ago
      status: 'in-progress',
      duration: 120 // 2 minutes
    },
    {
      id: '8765-4321',
      from: 'Ext. 102',
      to: '(555) 987-6543',
      direction: 'outbound',
      tenant: 'XYZ Inc',
      startTime: new Date(Date.now() - 60000 * 5), // 5 minutes ago
      status: 'in-progress',
      duration: 300 // 5 minutes
    }
  ];

  // Simulate periodic updates with useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      // In a real implementation, this would be replaced by WebSocket messages
      // This is just a simulation to show how durations would increase
      console.log('Updating call data...');
    }, refreshInterval);
    
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const handleStartMonitoring = (call: ActiveCall) => {
    setSelectedCall(call);
    setIsMonitoringDialogOpen(true);
    setIsListening(true);
  };

  const handleStopMonitoring = () => {
    setIsMonitoringDialogOpen(false);
    setIsListening(false);
    setIsMuted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Call Dashboard</h2>
          <p className="text-gray-500 mt-1">Monitor active calls across your PBX system</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
          >
            <option value="3000">3 seconds</option>
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
            <option value="30000">30 seconds</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PhoneCall className="mr-2 h-4 w-4 text-purple-600" />
              Active Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCalls}</div>
            <Progress 
              value={(stats.activeCalls / stats.maxLines) * 100} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCalls} of {stats.maxLines} lines in use
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PhoneIncoming className="mr-2 h-4 w-4 text-green-600" />
              Inbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inboundCalls}</div>
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Active</span>
              <span>{stats.waitingCalls} waiting</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PhoneOutgoing className="mr-2 h-4 w-4 text-blue-600" />
              Outbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outboundCalls}</div>
            <div className="h-5 mt-3"></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-amber-600" />
              Avg. Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <div className="h-5 mt-3"></div>
          </CardContent>
        </Card>
      </div>

      {/* Active Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCalls.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/60" />
              <p className="mt-2 text-muted-foreground">No active calls at the moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border px-2 py-0.5 text-xs font-semibold",
                          call.status === 'ringing' ? "border-yellow-200 bg-yellow-50 text-yellow-700" :
                          call.status === 'in-progress' ? "border-green-200 bg-green-50 text-green-700" :
                          call.status === 'on-hold' ? "border-blue-200 bg-blue-50 text-blue-700" :
                          "border-gray-200 bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className="flex items-center space-x-1">
                          {call.status === 'ringing' ? (
                            <><AlertCircle className="h-3 w-3" /><span>Ringing</span></>
                          ) : call.status === 'in-progress' ? (
                            <><PhoneCall className="h-3 w-3" /><span>In Call</span></>
                          ) : call.status === 'on-hold' ? (
                            <><VolumeX className="h-3 w-3" /><span>On Hold</span></>
                          ) : (
                            <><Activity className="h-3 w-3" /><span>Completed</span></>
                          )}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="h-3 w-3 mr-2 text-green-600" />
                        ) : (
                          <PhoneOutgoing className="h-3 w-3 mr-2 text-blue-600" />
                        )}
                        {call.from}
                      </div>
                    </TableCell>
                    <TableCell>{call.to}</TableCell>
                    <TableCell>{call.tenant}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                        {formatDuration(call.duration)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartMonitoring(call)}
                      >
                        Monitor
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Live Monitoring Dialog */}
      <Dialog open={isMonitoringDialogOpen} onOpenChange={setIsMonitoringDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Monitoring</DialogTitle>
            <DialogDescription>
              {selectedCall ? (
                <span>
                  Monitoring call between {selectedCall.from} and {selectedCall.to}
                </span>
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {isListening ? (
              <Alert className="bg-green-50 border-green-200">
                <Volume2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  You are actively listening to this call. The parties cannot hear you.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <VolumeX className="h-4 w-4" />
                <AlertDescription>
                  Call audio is muted.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center space-x-4">
              <Button
                variant={isListening ? "default" : "outline"}
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => setIsListening(!isListening)}
              >
                {isListening ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
              
              <Button
                variant={!isMuted ? "destructive" : "outline"}
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => setIsMuted(!isMuted)}
                disabled={!isListening}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {!isMuted && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Barge mode active! Call participants can hear you.
                </AlertDescription>
              </Alert>
            )}
            
            {selectedCall && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Call duration: {formatDuration(selectedCall.duration)}</p>
                <p>Started at: {selectedCall.startTime.toLocaleTimeString()}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleStopMonitoring}
            >
              Stop Monitoring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxRealTimeDashboard;