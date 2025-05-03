import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Circle, 
  File, 
  Flower2, 
  Hash, 
  KeyRound, 
  Mic, 
  Phone, 
  Plus, 
  Save, 
  Undo2, 
  Redo2, 
  Settings, 
  Trash2, 
  VolumeX,
  Volume2,
  ArrowRight,
  Play,
  FilePlus,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type NodeType = 
  | 'welcome'
  | 'menu'
  | 'playback'
  | 'record'
  | 'transfer'
  | 'digit_collect'
  | 'hangup';

type NodeData = {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  options?: {
    prompt?: string;
    actions?: {
      digit: string;
      targetId: string | null;
      description: string;
    }[];
    transferTo?: string;
    maxDigits?: number;
    audioFile?: string;
    timeout?: number;
  };
};

type Connection = {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  label?: string;
};

export function PbxIvrBuilder() {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: 'start',
      type: 'welcome',
      title: 'Welcome Message',
      x: 100,
      y: 100,
      options: {
        prompt: 'Thank you for calling. Please listen to the following options.'
      }
    }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isNewMenuDialogOpen, setIsNewMenuDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [flowName, setFlowName] = useState('New IVR Flow');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  const openNodeProperties = (node: NodeData) => {
    setSelectedNode(node);
    setIsPropertiesOpen(true);
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only if we're clicking the canvas itself, not a node
    if ((e.target as HTMLElement).classList.contains('canvas')) {
      setSelectedNode(null);
    }
  };
  
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  const handleAddNode = (type: NodeType) => {
    const id = `node-${Date.now()}`;
    let title = '';
    let options = {};
    
    switch (type) {
      case 'welcome':
        title = 'Welcome Message';
        options = { prompt: 'Welcome to our service.' };
        break;
      case 'menu':
        title = 'Menu Options';
        options = { 
          prompt: 'Please select from the following options.',
          actions: [
            { digit: '1', targetId: null, description: 'Option 1' },
            { digit: '2', targetId: null, description: 'Option 2' }
          ]
        };
        break;
      case 'playback':
        title = 'Play Audio';
        options = { audioFile: 'welcome.wav' };
        break;
      case 'record':
        title = 'Record Message';
        options = { prompt: 'Please leave a message after the tone.', timeout: 60 };
        break;
      case 'transfer':
        title = 'Transfer Call';
        options = { transferTo: 'extension101' };
        break;
      case 'digit_collect':
        title = 'Collect Digits';
        options = { prompt: 'Please enter your account number.', maxDigits: 5 };
        break;
      case 'hangup':
        title = 'End Call';
        options = { prompt: 'Thank you for calling. Goodbye.' };
        break;
    }
    
    // Calculate position relative to current view
    let x = 300;
    let y = 200;
    
    if (contextMenuPosition.x && contextMenuPosition.y && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = (contextMenuPosition.x - rect.left - canvasOffset.x) / zoom;
      y = (contextMenuPosition.y - rect.top - canvasOffset.y) / zoom;
    }
    
    const newNode: NodeData = {
      id,
      type,
      title,
      x,
      y,
      options
    };
    
    setNodes([...nodes, newNode]);
    setShowContextMenu(false);
    openNodeProperties(newNode);
  };
  
  const handleUpdateNode = (updatedNode: NodeData) => {
    setNodes(nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
    setIsPropertiesOpen(false);
  };
  
  const handleDeleteNode = (nodeId: string) => {
    // Delete the node and any connections to/from it
    setNodes(nodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => 
      conn.sourceId !== nodeId && conn.targetId !== nodeId
    ));
    setIsPropertiesOpen(false);
  };
  
  const handleConnectNodes = (sourceId: string, targetId: string, sourceHandle?: string) => {
    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      conn.sourceId === sourceId && 
      conn.targetId === targetId &&
      conn.sourceHandle === sourceHandle
    );
    
    if (existingConnection) return;
    
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
      sourceHandle,
      label: sourceHandle ? `Option ${sourceHandle}` : undefined
    };
    
    setConnections([...connections, newConnection]);
  };
  
  const handleDeleteConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };
  
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    // Find the node being dragged
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };
  
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (isDragging && selectedNode) {
      const dx = (e.clientX - dragStartPos.x) / zoom;
      const dy = (e.clientY - dragStartPos.y) / zoom;
      
      setNodes(nodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, x: node.x + dx, y: node.y + dy } 
          : node
      ));
      
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleNodeDragEnd = () => {
    setIsDragging(false);
  };
  
  const handleCanvasDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('canvas')) {
      setIsDragging(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleCanvasDrag = (e: React.MouseEvent) => {
    if (isDragging && (e.target as HTMLElement).classList.contains('canvas')) {
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;
      
      setCanvasOffset({
        x: canvasOffset.x + dx,
        y: canvasOffset.y + dy
      });
      
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleCanvasDragEnd = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };
  
  const handleSaveFlow = () => {
    toast({
      title: 'IVR Flow Saved',
      description: `"${flowName}" has been saved successfully.`
    });
  };
  
  const handleExportFlow = () => {
    const data = {
      name: flowName,
      nodes,
      connections
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Flow Exported',
      description: 'The IVR flow has been exported as JSON.'
    });
  };
  
  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      openNodeProperties(node);
    }
  };
  
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'welcome': return <Volume2 className="h-6 w-6 text-blue-500" />;
      case 'menu': return <Hash className="h-6 w-6 text-purple-500" />;
      case 'playback': return <Volume2 className="h-6 w-6 text-green-500" />;
      case 'record': return <Mic className="h-6 w-6 text-red-500" />;
      case 'transfer': return <Phone className="h-6 w-6 text-amber-500" />;
      case 'digit_collect': return <KeyRound className="h-6 w-6 text-indigo-500" />;
      case 'hangup': return <VolumeX className="h-6 w-6 text-gray-500" />;
      default: return <Circle className="h-6 w-6" />;
    }
  };
  
  const renderConnections = () => {
    return connections.map(conn => {
      const sourceNode = nodes.find(n => n.id === conn.sourceId);
      const targetNode = nodes.find(n => n.id === conn.targetId);
      
      if (!sourceNode || !targetNode) return null;
      
      // Calculate source and target positions
      const sourceX = sourceNode.x + 150; // Right side of source node
      const sourceY = sourceNode.y + 40;  // Middle of source node
      
      const targetX = targetNode.x;       // Left side of target node
      const targetY = targetNode.y + 40;  // Middle of target node
      
      // For bezier curve control points
      const dx = Math.abs(targetX - sourceX);
      const controlPointX = dx / 2;
      
      const path = `M ${sourceX} ${sourceY} C ${sourceX + controlPointX} ${sourceY}, ${targetX - controlPointX} ${targetY}, ${targetX} ${targetY}`;
      
      // Calculate midpoint for label
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      
      return (
        <g key={conn.id} className="connection">
          <path
            d={path}
            fill="none"
            stroke="#9ca3af"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
          {conn.label && (
            <g transform={`translate(${midX}, ${midY})`}>
              <rect
                x="-20"
                y="-10"
                width="40"
                height="20"
                rx="5"
                fill="white"
                stroke="#9ca3af"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#374151"
              >
                {conn.label}
              </text>
            </g>
          )}
        </g>
      );
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">IVR Flow Builder</h2>
            <p className="text-gray-500 mt-1">Visual IVR menu designer</p>
          </div>
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="max-w-[300px] border-dashed hover:border-solid focus:border-solid"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>-</Button>
          <Button variant="outline" size="sm" onClick={handleZoomReset}>
            {Math.round(zoom * 100)}%
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>+</Button>
          
          <Button variant="outline" size="sm" onClick={handleExportFlow}>
            <Share2 className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => {}}>
            <FilePlus className="h-4 w-4 mr-2" />
            New
          </Button>
          
          <Button onClick={handleSaveFlow}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="design" className="mt-0 border rounded-md">
          <div className="p-0 h-[600px] relative overflow-hidden">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 z-10 bg-white p-2 border-b border-r rounded-br-md shadow-sm">
              <div className="flex space-x-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {}}>
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {}}>
                  <Redo2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Node
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAddNode('welcome')}>
                      <Volume2 className="h-4 w-4 mr-2 text-blue-500" />
                      Welcome Message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('menu')}>
                      <Hash className="h-4 w-4 mr-2 text-purple-500" />
                      Menu Options
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('playback')}>
                      <Volume2 className="h-4 w-4 mr-2 text-green-500" />
                      Play Audio
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('record')}>
                      <Mic className="h-4 w-4 mr-2 text-red-500" />
                      Record Message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('transfer')}>
                      <Phone className="h-4 w-4 mr-2 text-amber-500" />
                      Transfer Call
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('digit_collect')}>
                      <KeyRound className="h-4 w-4 mr-2 text-indigo-500" />
                      Collect Digits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNode('hangup')}>
                      <VolumeX className="h-4 w-4 mr-2 text-gray-500" />
                      End Call
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="canvas w-full h-full bg-neutral-50"
              style={{ 
                backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)', 
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
              }}
              onClick={handleCanvasClick}
              onContextMenu={handleCanvasContextMenu}
              onMouseDown={handleCanvasDragStart}
              onMouseMove={handleCanvasDrag}
              onMouseUp={handleCanvasDragEnd}
              onMouseLeave={handleCanvasDragEnd}
            >
              <div
                className="canvas-content"
                style={{
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                <svg
                  className="connections"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="4"
                      refX="6"
                      refY="2"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 2, 0 4" fill="#9ca3af" />
                    </marker>
                  </defs>
                  {renderConnections()}
                </svg>
                
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute bg-white rounded-md shadow-md border border-gray-200 w-[300px]",
                      selectedNode?.id === node.id && "ring-2 ring-purple-500"
                    )}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                    }}
                    onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                    onDoubleClick={() => handleNodeDoubleClick(node.id)}
                  >
                    <div className="p-3 border-b flex justify-between items-center">
                      <div className="flex items-center">
                        {getNodeIcon(node.type)}
                        <span className="ml-2 font-medium">{node.title}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => openNodeProperties(node)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => setNodeToDelete(node.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 text-sm">
                      {node.type === 'welcome' && (
                        <div>
                          <p className="text-gray-500 mb-1">Welcome Prompt:</p>
                          <p className="truncate">{node.options?.prompt}</p>
                        </div>
                      )}
                      
                      {node.type === 'menu' && (
                        <div>
                          <p className="text-gray-500 mb-1">Menu Prompt:</p>
                          <p className="truncate">{node.options?.prompt}</p>
                          <div className="mt-2">
                            {node.options?.actions?.map((action) => (
                              <div key={action.digit} className="flex items-center mt-1">
                                <Badge variant="outline" className="mr-2">
                                  {action.digit}
                                </Badge>
                                <span className="truncate">{action.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {node.type === 'playback' && (
                        <div>
                          <p className="text-gray-500 mb-1">Audio File:</p>
                          <p className="flex items-center">
                            <File className="h-4 w-4 mr-1 text-gray-400" />
                            {node.options?.audioFile}
                          </p>
                        </div>
                      )}
                      
                      {node.type === 'transfer' && (
                        <div>
                          <p className="text-gray-500 mb-1">Transfer To:</p>
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {node.options?.transferTo}
                          </p>
                        </div>
                      )}
                      
                      {node.type === 'digit_collect' && (
                        <div>
                          <p className="text-gray-500 mb-1">Digit Collection:</p>
                          <p className="truncate">{node.options?.prompt}</p>
                          <p className="mt-1 text-gray-500">
                            Max Digits: {node.options?.maxDigits}
                          </p>
                        </div>
                      )}
                      
                      {node.type === 'record' && (
                        <div>
                          <p className="text-gray-500 mb-1">Recording:</p>
                          <p className="truncate">{node.options?.prompt}</p>
                          <p className="mt-1 text-gray-500">
                            Max Duration: {node.options?.timeout}s
                          </p>
                        </div>
                      )}
                      
                      {node.type === 'hangup' && (
                        <div>
                          <p className="text-gray-500 mb-1">End Message:</p>
                          <p className="truncate">{node.options?.prompt}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
                      <div 
                        className="h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer"
                        draggable
                      >
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Context Menu */}
            {showContextMenu && (
              <div 
                className="absolute bg-white shadow-md border rounded-md py-1 z-50"
                style={{
                  left: contextMenuPosition.x,
                  top: contextMenuPosition.y
                }}
              >
                <div className="px-2 py-1 text-xs font-semibold text-gray-500">Add Node</div>
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-100 text-left"
                  onClick={() => handleAddNode('welcome')}
                >
                  <Volume2 className="h-4 w-4 mr-2 text-blue-500" />
                  Welcome Message
                </button>
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-100 text-left"
                  onClick={() => handleAddNode('menu')}
                >
                  <Hash className="h-4 w-4 mr-2 text-purple-500" />
                  Menu Options
                </button>
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-100 text-left"
                  onClick={() => handleAddNode('playback')}
                >
                  <Volume2 className="h-4 w-4 mr-2 text-green-500" />
                  Play Audio
                </button>
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-100 text-left"
                  onClick={() => handleAddNode('transfer')}
                >
                  <Phone className="h-4 w-4 mr-2 text-amber-500" />
                  Transfer Call
                </button>
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-100 text-left"
                  onClick={() => handleAddNode('hangup')}
                >
                  <VolumeX className="h-4 w-4 mr-2 text-gray-500" />
                  End Call
                </button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>IVR Flow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">IVR Flow Name</Label>
                  <Input 
                    id="name" 
                    value={flowName} 
                    onChange={(e) => setFlowName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Tenant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant1">ABC Corporation</SelectItem>
                      <SelectItem value="tenant2">XYZ Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Entry Point Number/Extension</Label>
                  <Input placeholder="e.g. 500" />
                </div>
                
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the purpose of this IVR flow" />
                </div>
                
                <div className="grid gap-2">
                  <Label>Exit Handling</Label>
                  <Select defaultValue="hangup">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hangup">Hangup call</SelectItem>
                      <SelectItem value="transfer">Transfer to extension</SelectItem>
                      <SelectItem value="voicemail">Send to voicemail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test IVR Flow</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-8">
              <div className="bg-gray-100 p-6 rounded-full mb-6">
                <Phone className="h-12 w-12 text-purple-500" />
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2">Test your IVR flow</h3>
                <p className="text-gray-500 mb-4">
                  Simulate how your IVR will behave with real input
                </p>
                
                <Button size="lg" className="mr-2">
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg border p-4 w-full max-w-md">
                <p className="font-medium mb-3">Phone Simulator</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(digit => (
                    <Button
                      key={digit}
                      variant="outline"
                      className="h-12 w-full"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
                
                <div className="bg-white border rounded p-3 mb-3">
                  <p className="text-sm font-medium mb-1">Current Prompt:</p>
                  <p className="text-gray-600 text-sm">
                    "Thank you for calling. Please select from the following options..."
                  </p>
                </div>
                
                <div className="flex">
                  <Button variant="outline" className="mr-2">
                    <Mic className="h-4 w-4 mr-2" />
                    Record
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Hang Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Node Properties Dialog */}
      <Dialog open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
        {selectedNode && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit {selectedNode.title}</DialogTitle>
              <DialogDescription>
                Configure the properties for this node.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="node-title">Title</Label>
                <Input
                  id="node-title"
                  value={selectedNode.title}
                  onChange={(e) => setSelectedNode({ ...selectedNode, title: e.target.value })}
                />
              </div>
              
              {(selectedNode.type === 'welcome' || selectedNode.type === 'menu' || 
                selectedNode.type === 'digit_collect' || selectedNode.type === 'record' ||
                selectedNode.type === 'hangup') && (
                <div className="grid gap-2">
                  <Label htmlFor="node-prompt">Prompt Message</Label>
                  <Textarea
                    id="node-prompt"
                    value={selectedNode.options?.prompt || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      options: { ...selectedNode.options, prompt: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
              )}
              
              {selectedNode.type === 'menu' && (
                <>
                  <div className="grid gap-2">
                    <Label>Menu Options</Label>
                    <div className="border rounded-md p-3 space-y-3">
                      {selectedNode.options?.actions?.map((action, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge>{action.digit}</Badge>
                          <Input
                            value={action.description}
                            onChange={(e) => {
                              const newActions = [...(selectedNode.options?.actions || [])];
                              newActions[index] = { ...action, description: e.target.value };
                              setSelectedNode({
                                ...selectedNode,
                                options: { ...selectedNode.options, actions: newActions }
                              });
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              const newActions = [...(selectedNode.options?.actions || [])];
                              newActions.splice(index, 1);
                              setSelectedNode({
                                ...selectedNode,
                                options: { ...selectedNode.options, actions: newActions }
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const digit = String(
                            (selectedNode.options?.actions?.length || 0) + 1
                          );
                          const newActions = [
                            ...(selectedNode.options?.actions || []),
                            { digit, targetId: null, description: `Option ${digit}` }
                          ];
                          setSelectedNode({
                            ...selectedNode,
                            options: { ...selectedNode.options, actions: newActions }
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {selectedNode.type === 'playback' && (
                <div className="grid gap-2">
                  <Label htmlFor="node-audio">Audio File</Label>
                  <Input
                    id="node-audio"
                    value={selectedNode.options?.audioFile || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      options: { ...selectedNode.options, audioFile: e.target.value }
                    })}
                  />
                </div>
              )}
              
              {selectedNode.type === 'transfer' && (
                <div className="grid gap-2">
                  <Label htmlFor="node-transfer">Transfer To</Label>
                  <Input
                    id="node-transfer"
                    value={selectedNode.options?.transferTo || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      options: { ...selectedNode.options, transferTo: e.target.value }
                    })}
                    placeholder="Extension, external number, or queue"
                  />
                </div>
              )}
              
              {selectedNode.type === 'digit_collect' && (
                <div className="grid gap-2">
                  <Label htmlFor="node-max-digits">Max Digits</Label>
                  <Input
                    id="node-max-digits"
                    type="number"
                    min={1}
                    max={20}
                    value={selectedNode.options?.maxDigits || 5}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      options: { ...selectedNode.options, maxDigits: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}
              
              {selectedNode.type === 'record' && (
                <div className="grid gap-2">
                  <Label htmlFor="node-timeout">Max Recording Duration (seconds)</Label>
                  <Input
                    id="node-timeout"
                    type="number"
                    min={5}
                    max={300}
                    value={selectedNode.options?.timeout || 60}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      options: { ...selectedNode.options, timeout: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPropertiesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateNode(selectedNode)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!nodeToDelete} onOpenChange={() => setNodeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this node? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (nodeToDelete) {
                  handleDeleteNode(nodeToDelete);
                }
                setNodeToDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxIvrBuilder;