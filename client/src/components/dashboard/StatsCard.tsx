import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  iconColor: string;
  changeColor?: string;
}

export function StatsCard({ title, value, change, icon: Icon, iconColor, changeColor }: StatsCardProps) {
  const isPositive = change >= 0;
  const ChevronIcon = isPositive ? ChevronUpIcon : ChevronDownIcon;
  const displayChange = Math.abs(change);
  
  // Default to green for positive change and red for negative, unless overridden
  const defaultChangeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const textColor = changeColor || defaultChangeColor;
  
  return (
    <Card className="bg-white overflow-hidden shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconColor)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== 0 && (
                  <div className={cn("ml-2 flex items-baseline text-sm font-semibold", textColor)}>
                    <ChevronIcon className="self-center flex-shrink-0 h-5 w-5" />
                    <span className="sr-only">{isPositive ? 'Increased' : 'Decreased'} by</span>
                    {displayChange}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Chevron icons
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 20 20" 
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 20 20" 
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}

export default StatsCard;
