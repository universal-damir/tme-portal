import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  tooltipContent?: string;
}

// Icon color to background color mapping
const getIconBackgroundColor = (iconColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'text-blue-600': 'bg-blue-100',
    'text-indigo-600': 'bg-indigo-100',
    'text-purple-600': 'bg-purple-100',
    'text-orange-600': 'bg-orange-100',
    'text-green-600': 'bg-green-100',
    'text-emerald-600': 'bg-emerald-100',
    'text-yellow-600': 'bg-yellow-100',
    'text-red-600': 'bg-red-100',
    'text-pink-600': 'bg-pink-100',
  };

  return colorMap[iconColor] || 'bg-blue-100';
};

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  className = '',
  tooltipContent,
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {Icon && (
            <div className={`w-8 h-8 ${iconColor} mr-3 flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {tooltipContent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}; 