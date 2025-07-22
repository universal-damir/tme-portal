import React from 'react';
import { TabButton } from './TabButton';
import { TabId } from '@/types/portal';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'cost-overview' as TabId,
      label: 'Cost Overview',
      description: 'Business setup cost overview generator',
    },
    {
      id: 'golden-visa' as TabId,
      label: 'Golden Visa',
      description: 'UAE Golden Visa services overview generator',
    },
    {
      id: 'company-services' as TabId,
      label: 'Company Services',
      description: 'TME Services - All Services Overview Generator',
    },
    {
      id: 'corporate-changes' as TabId,
      label: 'Corporate Changes',
      description: 'Client Changes Contracts',
    },
    {
      id: 'taxation' as TabId,
      label: 'Taxation',
      description: 'Tax planning and compliance contracts',
    },
  ];

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
      {/* Desktop Navigation */}
      <div className="hidden sm:block">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              description={tab.description}
              isActive={activeTab === tab.id}
              onClick={onTabChange}
            />
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="px-4 py-2">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as TabId)}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}; 