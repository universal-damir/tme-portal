'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Preferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_review_requested: boolean;
  email_review_completed: boolean;
  email_application_approved: boolean;
  email_application_rejected: boolean;
  email_follow_up_reminders: boolean;
  email_follow_up_escalations: boolean;
}

export default function NotificationPreferences({ isOpen, onClose }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    in_app_enabled: true,
    email_enabled: false,
    email_review_requested: true,
    email_review_completed: true,
    email_application_approved: true,
    email_application_rejected: true,
    email_follow_up_reminders: true,
    email_follow_up_escalations: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();
      
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Notification preferences updated');
        onClose();
      } else {
        toast.error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliveryMethodChange = (method: 'both' | 'in_app' | 'email') => {
    switch (method) {
      case 'both':
        setPreferences(prev => ({ 
          ...prev, 
          in_app_enabled: true, 
          email_enabled: true,
          // Automatically enable ALL email notification types when email is enabled
          email_review_requested: true,
          email_review_completed: true,
          email_application_approved: true,
          email_application_rejected: true,
          email_follow_up_reminders: true,
          email_follow_up_escalations: true
        }));
        break;
      case 'in_app':
        setPreferences(prev => ({ 
          ...prev, 
          in_app_enabled: true, 
          email_enabled: false,
          // Disable all email notification types when email is disabled
          email_review_requested: false,
          email_review_completed: false,
          email_application_approved: false,
          email_application_rejected: false,
          email_follow_up_reminders: false,
          email_follow_up_escalations: false
        }));
        break;
      case 'email':
        setPreferences(prev => ({ 
          ...prev, 
          in_app_enabled: false, 
          email_enabled: true,
          // Automatically enable ALL email notification types when email is enabled
          email_review_requested: true,
          email_review_completed: true,
          email_application_approved: true,
          email_application_rejected: true,
          email_follow_up_reminders: true,
          email_follow_up_escalations: true
        }));
        break;
    }
  };

  const getDeliveryMethod = (): 'both' | 'in_app' | 'email' => {
    if (preferences.in_app_enabled && preferences.email_enabled) return 'both';
    if (preferences.in_app_enabled && !preferences.email_enabled) return 'in_app';
    return 'email';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - starts below header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 bg-black/30 z-50"
            style={{ top: '80px' }}  // Start below the header
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-0 top-[10vh] z-50 flex justify-center pointer-events-none px-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <h2 className="text-xl font-semibold" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
              Notification Settings
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300" 
                     style={{ borderTopColor: '#243F7B' }}></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Delivery Method Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
                    Notification Delivery
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200"
                           style={{ 
                             borderColor: getDeliveryMethod() === 'both' ? '#243F7B' : '#e5e7eb',
                             backgroundColor: getDeliveryMethod() === 'both' ? '#f0f4ff' : 'white'
                           }}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={getDeliveryMethod() === 'both'}
                        onChange={() => handleDeliveryMethodChange('both')}
                      />
                      <span className="text-sm">Both Portal & Email</span>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200"
                           style={{ 
                             borderColor: getDeliveryMethod() === 'in_app' ? '#243F7B' : '#e5e7eb',
                             backgroundColor: getDeliveryMethod() === 'in_app' ? '#f0f4ff' : 'white'
                           }}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={getDeliveryMethod() === 'in_app'}
                        onChange={() => handleDeliveryMethodChange('in_app')}
                      />
                      <span className="text-sm">Portal Only</span>
                    </label>
                    
                    {/* Email Only option - hidden for now but kept for future use */}
                    {/* <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200"
                           style={{ 
                             borderColor: getDeliveryMethod() === 'email' ? '#243F7B' : '#e5e7eb',
                             backgroundColor: getDeliveryMethod() === 'email' ? '#f0f4ff' : 'white'
                           }}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={getDeliveryMethod() === 'email'}
                        onChange={() => handleDeliveryMethodChange('email')}
                      />
                      <span className="text-sm">Email Only</span>
                    </label> */}
                  </div>
                </div>

                {/* Email Notification Types - hidden but all enabled when email is on */}
                {/* {preferences.email_enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
                      Email Notification Types
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={preferences.email_review_requested}
                          onChange={(e) => setPreferences(prev => ({ ...prev, email_review_requested: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Review Requests</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={preferences.email_review_completed}
                          onChange={(e) => setPreferences(prev => ({ ...prev, email_review_completed: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Review Completions</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={preferences.email_application_approved}
                          onChange={(e) => setPreferences(prev => ({ ...prev, email_application_approved: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Application Approvals</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={preferences.email_application_rejected}
                          onChange={(e) => setPreferences(prev => ({ ...prev, email_application_rejected: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Application Rejections</span>
                      </label>
                      
                      <div className="border-t pt-2 mt-2">
                        <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={preferences.email_follow_up_reminders}
                            onChange={(e) => setPreferences(prev => ({ ...prev, email_follow_up_reminders: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Follow-up Reminders (7, 14, 21 days)</span>
                        </label>
                        
                        <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={preferences.email_follow_up_escalations}
                            onChange={(e) => setPreferences(prev => ({ ...prev, email_follow_up_escalations: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Manager Escalations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )} */}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 border-2"
              style={{ borderColor: '#e5e7eb', color: '#666' }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#243F7B' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
          </div>
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
}