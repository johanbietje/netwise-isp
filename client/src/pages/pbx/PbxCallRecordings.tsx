import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowDownToLine, 
  Calendar, 
  Clock, 
  Download, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Play, 
  RefreshCw, 
  Search,
  Share2,
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CallRecording {
  id: string;
  callId: string;
  tenantId: number;
  callDirection: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  startTime: string;
  duration: number; // in seconds
  fileSize: number; // in kb
  fileName: string;
  downloadUrl: string;
}

export function PbxCallRecordings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  // Get tenants for filter
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/pbx/tenants'],
  });
  
  // Example call recordings for demonstration
  const callRecordings: CallRecording[] = [
    {
      id: '1001',
      callId: 'c12345',
      tenantId: 1,
      callDirection: 'inbound',
      fromNumber: '+1 (555) 123-4567',
      toNumber: 'Ext. 101',
      startTime: '2023-10-15T14:30:00Z',
      duration: 182, // 3:02
      fileSize: 542, // KB
      fileName: 'call_20231015_143000.wav',
      downloadUrl: '/api/recordings/call_20231015_143000.wav'
    },
    {
      id: '1002',
      callId: 'c12346',
      tenantId: 2,
      callDirection: 'outbound',
      fromNumber: 'Ext. 102',
      toNumber: '+1 (555) 987-6543',
      startTime: '2023-10-16T09:15:00Z',
      duration: 431, // 7:11
      fileSize: 1283, // KB
      fileName: 'call_20231016_091500.wav',
      downloadUrl: '/api/recordings/call_20231016_091500.wav'
    },
    {
      id: '1003',
      callId: 'c12347',
      tenantId: 1,
      callDirection: 'inbound',
      fromNumber: '+1 (555) 333-2222',
      toNumber: 'Ext. 105',
      startTime: '2023-10-16T11:45:00Z',
      duration: 67, // 1:07
      fileSize: 196, // KB
      fileName: 'call_20231016_114500.wav',
      downloadUrl: '/api/recordings/call_20231016_114500.wav'
    }
  ];
  
  const filteredRecordings = callRecordings.filter(recording => {
    // Filter by search
    const searchMatches = searchQuery === '' || 
      recording.fromNumber.includes(searchQuery) ||
      recording.toNumber.includes(searchQuery) ||
      recording.fileName.includes(searchQuery);
    
    // Filter by tenant
    const tenantMatches = selectedTenantId === null || recording.tenantId === selectedTenantId;
    
    // Filter by date range
    const recordingDate = new Date(recording.startTime);
    const dateMatches = 
      (!startDate || recordingDate >= startDate) && 
      (!endDate || recordingDate <= endDate);
    
    return searchMatches && tenantMatches && dateMatches;
  });
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  const formatFileSize = (sizeInKB: number) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
  };
  
  const handlePlayRecording = (recording: CallRecording) => {
    setSelectedRecording(recording);
    setIsPlayerOpen(true);
    setCurrentTime(0);
    setIsPlaying(true);
  };
  
  const handleDownloadRecording = (recording: CallRecording) => {
    // In a real implementation, this would trigger an actual download
    toast({
      title: 'Download Started',
      description: `Downloading ${recording.fileName}`
    });
  };
  
  const handleDeleteRecording = (recording: CallRecording) => {
    toast({
      title: 'Recording Deleted',
      description: `${recording.fileName} has been deleted.`
    });
  };
  
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Call Recordings</h2>
          <p className="text-gray-500 mt-1">Manage and listen to recorded calls</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, extension or filename..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px]">
              <Filter className="mr-2 h-4 w-4" />
              {selectedTenantId ? (
                <span>
                  Tenant: {tenants?.find(t => t.id === selectedTenantId)?.name}
                </span>
              ) : (
                <span>All Tenants</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="end">
            <div className="p-2 border-b">
              <div className="font-medium">Filter by Tenant</div>
            </div>
            <div className="p-2 pt-0">
              <div 
                className="cursor-pointer py-1.5 px-2 rounded hover:bg-gray-100"
                onClick={() => setSelectedTenantId(null)}
              >
                All Tenants
              </div>
              {tenants?.map(tenant => (
                <div 
                  key={tenant.id}
                  className={cn(
                    "cursor-pointer py-1.5 px-2 rounded hover:bg-gray-100",
                    selectedTenantId === tenant.id && "bg-gray-100 font-medium"
                  )}
                  onClick={() => setSelectedTenantId(tenant.id)}
                >
                  {tenant.name}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[130px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PP') : <span>Start Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[130px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PP') : <span>End Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Recordings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recorded Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecordings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No recordings found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(new Date(recording.startTime), 'PPP')}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(recording.startTime), 'p')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {recording.callDirection === 'inbound' ? (
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
                            In
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                            Out
                          </Badge>
                        )}
                        {recording.fromNumber}
                      </div>
                    </TableCell>
                    <TableCell>{recording.toNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                        {formatDuration(recording.duration)}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(recording.fileSize)}</TableCell>
                    <TableCell>
                      {tenants?.find(t => t.id === recording.tenantId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePlayRecording(recording)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadRecording(recording)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePlayRecording(recording)}>
                              <Play className="h-4 w-4 mr-2" />
                              Play Recording
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadRecording(recording)}>
                              <ArrowDownToLine className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteRecording(recording)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Audio Player Dialog */}
      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Call Recording Player</DialogTitle>
            <DialogDescription>
              {selectedRecording && (
                <>
                  Call from {selectedRecording.fromNumber} to {selectedRecording.toNumber} on{' '}
                  {format(new Date(selectedRecording.startTime), 'PPP')} at{' '}
                  {format(new Date(selectedRecording.startTime), 'p')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-6 bg-gray-50 rounded-md border flex justify-center items-center">
              <div className={cn(
                "h-32 w-32 rounded-full flex items-center justify-center border-8",
                isPlaying ? "animate-pulse border-purple-200" : "border-gray-200",
              )}>
                <Volume2 className={cn(
                  "h-12 w-12",
                  isPlaying ? "text-purple-500" : "text-gray-400"
                )} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{formatDuration(currentTime)}</span>
                <span>{selectedRecording ? formatDuration(selectedRecording.duration) : '--:--'}</span>
              </div>
              
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ 
                      width: `${selectedRecording ? 
                        (currentTime / selectedRecording.duration * 100) : 0}%` 
                    }}
                  />
                </div>
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border border-purple-500 shadow"
                  style={{ 
                    left: `${selectedRecording ? 
                      (currentTime / selectedRecording.duration * 100) : 0}%`,
                    marginLeft: '-8px'
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10",
                    isMuted && "text-red-500 border-red-200"
                  )}
                  onClick={handleToggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                
                <div className="flex-1 px-4">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => {
                      setVolume(values[0]);
                      if (values[0] > 0 && isMuted) {
                        setIsMuted(false);
                      }
                    }}
                  />
                </div>
                
                <Button
                  className="h-12 w-12 rounded-full"
                  onClick={handleTogglePlay}
                >
                  {isPlaying ? <VolumeX className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    if (selectedRecording) {
                      handleDownloadRecording(selectedRecording);
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxCallRecordings;