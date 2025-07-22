import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'completed' | 'pending' | 'processing' | 'error';
  label?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Shadcn Badge component with status-specific styling and icons
 * Useful for indicating status of different cost calculations or sections
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          defaultLabel: 'Completed',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="w-3 h-3" />,
          defaultLabel: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'processing':
        return {
          variant: 'outline' as const,
          icon: <AlertCircle className="w-3 h-3" />,
          defaultLabel: 'Processing',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          defaultLabel: 'Error',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: null,
          defaultLabel: 'Unknown',
          className: ''
        };
    }
  };

  const config = getStatusConfig();
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {showIcon && config.icon}
      {displayLabel}
    </Badge>
  );
}; 