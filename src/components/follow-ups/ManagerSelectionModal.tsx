/**
 * ManagerSelectionModal Component
 * Modal for selecting a team member to escalate follow-up to
 * Shows all users with photos, emails, and departments
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, ChevronRight, Users, Mail } from 'lucide-react';
import Image from 'next/image';

interface Manager {
  id: number;
  full_name: string;
  email: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  role?: string;
  is_manager?: boolean;
  photoUrl?: string;
}

interface ManagerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (managerId: number, managerName: string) => void;
  clientName: string;
  followUpId: string;
}

// Function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Function to generate color based on name
const getColorFromName = (name: string): string => {
  const colors = [
    '#243F7B', '#D2BC99', '#4B5563', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Photo Avatar Component
interface PhotoAvatarProps {
  photoUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const PhotoAvatar: React.FC<PhotoAvatarProps> = ({ photoUrl, name, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  if (photoUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
        <Image
          src={photoUrl}
          alt={name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  
  // Fallback to initials
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: getColorFromName(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

const ManagerSelectionModal: React.FC<ManagerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  clientName,
  followUpId
}) => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch all team members on modal open
  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all users without search term to show everyone
      const response = await fetch('/api/user/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers || []);
        setFilteredManagers(data.managers || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setManagers([]);
      setFilteredManagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
      setSearchTerm('');
      setSelectedManager(null);
    }
  }, [isOpen, fetchTeamMembers]);

  // Filter managers based on search (client-side for instant results)
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = managers.filter(manager => {
        const searchLower = searchTerm.toLowerCase();
        return (
          manager.full_name.toLowerCase().includes(searchLower) ||
          manager.email.toLowerCase().includes(searchLower) ||
          (manager.employee_code && manager.employee_code.toLowerCase().includes(searchLower)) ||
          (manager.department && manager.department.toLowerCase().includes(searchLower))
        );
      });
      setFilteredManagers(filtered);
    } else if (searchTerm.length === 0) {
      // Show all when search is empty
      setFilteredManagers(managers);
    } else {
      // Show none when only 1 character typed
      setFilteredManagers([]);
    }
  }, [searchTerm, managers]);

  const handleConfirm = () => {
    if (selectedManager) {
      onSelect(selectedManager.id, selectedManager.full_name);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Separate managers and regular team members
  const managersAndSupervisors = filteredManagers.filter(
    m => m.is_manager || m.role === 'manager' || m.role === 'admin'
  );
  const regularTeamMembers = filteredManagers.filter(
    m => !m.is_manager && m.role !== 'manager' && m.role !== 'admin'
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
          style={{ fontFamily: 'Inter, sans-serif', maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#243F7B' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                  Select Team Member for Escalation
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Escalate follow-up for <strong>{clientName}</strong> to a team member
            </p>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or department (min. 2 characters)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
                autoFocus
              />
            </div>
            {searchTerm.length === 1 && (
              <p className="text-xs text-orange-600 mt-1">
                Type at least 2 characters to search
              </p>
            )}
          </div>

          {/* Team Member List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 240px)' }}>
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
              </div>
            ) : searchTerm.length === 1 ? (
              <div className="px-6 py-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Type one more character to search
                </p>
              </div>
            ) : filteredManagers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm.length >= 2 
                    ? 'No team members found matching your search' 
                    : 'All team members are shown below'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {/* Show managers/supervisors first */}
                {managersAndSupervisors.length > 0 && (
                  <>
                    <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                      Managers & Supervisors ({managersAndSupervisors.length})
                    </div>
                    {managersAndSupervisors.map((manager) => (
                      <button
                        key={manager.id}
                        onClick={() => setSelectedManager(manager)}
                        className={`
                          w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100
                          ${selectedManager?.id === manager.id ? 'bg-blue-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PhotoAvatar 
                              photoUrl={manager.photoUrl}
                              name={manager.full_name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900">
                                  {manager.full_name}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  {manager.role === 'admin' ? 'Admin' : 'Manager'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {manager.email}
                              </div>
                              {manager.department && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {manager.department}
                                  {manager.designation && ` • ${manager.designation}`}
                                  {manager.employee_code && ` • ${manager.employee_code}`}
                                </div>
                              )}
                            </div>
                          </div>
                          {selectedManager?.id === manager.id && (
                            <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Show regular team members */}
                {regularTeamMembers.length > 0 && (
                  <>
                    <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 mt-2">
                      Team Members ({regularTeamMembers.length})
                    </div>
                    {regularTeamMembers.map((manager) => (
                      <button
                        key={manager.id}
                        onClick={() => setSelectedManager(manager)}
                        className={`
                          w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100
                          ${selectedManager?.id === manager.id ? 'bg-blue-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PhotoAvatar 
                              photoUrl={manager.photoUrl}
                              name={manager.full_name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-gray-900">
                                {manager.full_name}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {manager.email}
                              </div>
                              {manager.department && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {manager.department}
                                  {manager.designation && ` • ${manager.designation}`}
                                  {manager.employee_code && ` • ${manager.employee_code}`}
                                </div>
                              )}
                            </div>
                          </div>
                          {selectedManager?.id === manager.id && (
                            <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Show total count */}
                {filteredManagers.length > 0 && (
                  <div className="px-6 py-3 text-xs text-gray-500 text-center border-t">
                    Showing {filteredManagers.length} of {managers.length} team members
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={!selectedManager}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${selectedManager
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Escalate to {selectedManager?.is_manager || selectedManager?.role === 'manager' || selectedManager?.role === 'admin' ? 'Manager' : 'Team Member'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManagerSelectionModal;