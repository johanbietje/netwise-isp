import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import HelpButton from '@/components/onboarding/HelpButton';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search for:', searchTerm);
    // Implement search functionality
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center md:hidden">
          <button 
            onClick={onOpenSidebar}
            className="text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">Netwise</h1>
        </div>
        
        <div className="flex-1 flex justify-center px-2 md:ml-6 md:justify-end">
          <form onSubmit={handleSearch} className="max-w-lg w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-purple-400" />
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers, tickets..."
                className="block w-full bg-white border border-purple-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-purple-400 focus:outline-none focus:text-gray-900 focus:placeholder-purple-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
          </form>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <div className="mr-2">
            <HelpButton />
          </div>
          
          <button className="p-1 rounded-full relative text-purple-500 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500"></span>
          </button>

          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <span className="sr-only">Open user menu</span>
                  <Avatar className="h-8 w-8 bg-gradient-to-r from-purple-700 to-purple-500 text-white">
                    <AvatarFallback>{user ? getInitials(user.fullName) : 'U'}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="ml-1 h-4 w-4 text-purple-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
