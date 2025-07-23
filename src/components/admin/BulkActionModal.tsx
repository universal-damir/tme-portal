'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onAction: (action: string, data?: any) => void;
}

const BULK_ACTIONS = [
  {
    id: 'activate',
    name: 'Activate Accounts',
    description: 'Enable login for selected users',
    icon: LockOpenIcon,
    color: 'green',
    destructive: false,
  },
  {
    id: 'deactivate',
    name: 'Deactivate Accounts',
    description: 'Disable login for selected users',
    icon: LockClosedIcon,
    color: 'yellow',
    destructive: true,
  },
  {
    id: 'reset_password',
    name: 'Reset Passwords',
    description: 'Generate new temporary passwords',
    icon: KeyIcon,
    color: 'blue',
    destructive: false,
  },
  {
    id: 'unlock',
    name: 'Unlock Accounts',
    description: 'Remove account lockouts',
    icon: LockOpenIcon,
    color: 'green',
    destructive: false,
  },
  {
    id: 'change_role',
    name: 'Change Role',
    description: 'Update role for selected users',
    icon: KeyIcon,
    color: 'blue',
    destructive: false,
  },
  {
    id: 'delete',
    name: 'Delete Accounts',
    description: 'Permanently remove user accounts',
    icon: TrashIcon,
    color: 'red',
    destructive: true,
  },
];

export default function BulkActionModal({ isOpen, onClose, selectedCount, onAction }: BulkActionModalProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const action = BULK_ACTIONS.find(a => a.id === selectedAction);
    if (!action) return;

    // Require confirmation for destructive actions
    if (action.destructive && confirmText !== 'CONFIRM') {
      return;
    }

    setLoading(true);
    try {
      const actionData = selectedAction === 'change_role' ? { role: newRole } : {};
      await onAction(selectedAction, actionData);
      
      // Reset form
      setSelectedAction('');
      setNewRole('employee');
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedActionData = BULK_ACTIONS.find(a => a.id === selectedAction);

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'text-green-700 bg-green-100 hover:bg-green-200',
      blue: 'text-blue-700 bg-blue-100 hover:bg-blue-200',
      yellow: 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200',
      red: 'text-red-700 bg-red-100 hover:bg-red-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Bulk Actions
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      Perform actions on {selectedCount} selected user{selectedCount !== 1 ? 's' : ''}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Action
                        </label>
                        <div className="space-y-2">
                          {BULK_ACTIONS.map((action) => (
                            <label
                              key={action.id}
                              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                                selectedAction === action.id
                                  ? `border-${action.color}-600 ring-2 ring-${action.color}-600`
                                  : 'border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="action"
                                value={action.id}
                                checked={selectedAction === action.id}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="sr-only"
                              />
                              <span className="flex flex-1">
                                <span className="flex flex-col">
                                  <span className="flex items-center">
                                    <action.icon className={`h-5 w-5 mr-3 ${
                                      selectedAction === action.id 
                                        ? `text-${action.color}-600` 
                                        : 'text-gray-500'
                                    }`} />
                                    <span className="block text-sm font-medium text-gray-900">
                                      {action.name}
                                    </span>
                                    {action.destructive && (
                                      <ExclamationTriangleIcon className="h-4 w-4 ml-2 text-red-500" />
                                    )}
                                  </span>
                                  <span className="block text-sm text-gray-500 ml-8">
                                    {action.description}
                                  </span>
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {selectedAction === 'change_role' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            New Role
                          </label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      )}

                      {selectedActionData?.destructive && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-red-800">
                                Destructive Action Warning
                              </h4>
                              <p className="mt-1 text-sm text-red-700">
                                This action cannot be undone. Type <strong>CONFIRM</strong> to proceed.
                              </p>
                              <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type CONFIRM"
                                className="mt-2 block w-full rounded-md border border-red-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={
                            loading || 
                            !selectedAction || 
                            (selectedActionData?.destructive && confirmText !== 'CONFIRM')
                          }
                          className={`w-full inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto ${
                            selectedActionData?.destructive
                              ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
                              : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
                          }`}
                        >
                          {loading ? 'Processing...' : 'Execute Action'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}