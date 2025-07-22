import React from 'react';
import { TabId } from '@/types/portal';

interface TabButtonProps {
  id: TabId;
  label: string;
  description: string;
  isActive: boolean;
  onClick: (tabId: TabId) => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  id,
  label,
  description,
  isActive,
  onClick,
}) => {
  const handleClick = () => {
    onClick(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 transition-all duration-200
        ${
          isActive
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
      aria-label={`${label} - ${description}`}
    >
      <div className="flex flex-col items-center">
        <span className="font-semibold">{label}</span>
        <span
          className={`
            text-xs mt-1 transition-colors duration-200
            ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
          `}
        >
          {description}
        </span>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"
          aria-hidden="true"
        />
      )}
    </button>
  );
}; 