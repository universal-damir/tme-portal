'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, UserPlus, FileText, Settings, Key, Shield, AlertTriangle, Building, Crown, Eye, Send, CheckCircle, XCircle, Download } from 'lucide-react'

interface ActivityLog {
  id: number
  action: string
  resource: string
  created_at: string
  ip_address: string
  details?: any
}

interface ProfileTabProps {
  refreshTrigger?: number;
}

export default function ProfileTab({ refreshTrigger }: ProfileTabProps = {}) {
  const { user, loading } = useAuth()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [showAllActivities, setShowAllActivities] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserActivities()
    }
  }, [user])

  // Refresh activities when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && user) {
      fetchUserActivities()
    }
  }, [refreshTrigger, user])

  // Add a refresh effect when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchUserActivities()
      }
    }

    const handleRefreshActivities = () => {
      if (user) {
        fetchUserActivities()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('refreshActivities', handleRefreshActivities)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('refreshActivities', handleRefreshActivities)
    }
  }, [user])

  const fetchUserActivities = async () => {
    try {
      const response = await fetch('/api/user/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const formatDate = (dateString: string) => {
    // Now that we get proper UTC timestamps with timezone info, 
    // JavaScript will automatically convert to local time
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }


  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const firstName = user.full_name.split(' ')[0]

  return (
    <div className="px-6">
      <Card>
        <CardContent className="p-4">
          {/* Welcome Message */}
          <div className="mb-3">
            <h1 className="text-xl font-bold">
              Hey, {firstName}!
            </h1>
          </div>

          {/* Profile Details */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Employee Code</p>
              <p className="text-sm">{user.employee_code}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Department</p>
              <p className="text-sm">{user.department}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Designation</p>
              <p className="text-sm">{user.designation}</p>
            </div>
          </div>

          <Separator className="my-3" />

          {/* TME Design System Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Latest system activities and user actions
            </p>
            
            {loadingActivities ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-lg bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {(showAllActivities ? activities : activities.slice(0, 5)).map((activity, index) => {
                    // Format activity type to be more readable
                    const formatActivityType = (action: string, details?: any) => {
                      if (action === 'pdf_generated') {
                        const filename = details?.filename;
                        if (filename) {
                          return `Generated ${filename}`;
                        }
                        const documentType = details?.document_type || 'Document';
                        const clientName = details?.client_name ? ` for ${details.client_name}` : '';
                        return `Generated ${documentType}${clientName}`;
                      }
                      if (action === 'pdf_sent') {
                        const filename = details?.filename;
                        if (filename) {
                          return `Sent ${filename}`;
                        }
                        const documentType = details?.document_type || 'Document';
                        const clientName = details?.client_name;
                        if (clientName) {
                          return `Sent to ${clientName} ${documentType}`;
                        }
                        return `Sent ${documentType}`;
                      }
                      if (action === 'pdf_downloaded') {
                        const filename = details?.filename;
                        if (filename) {
                          return `Downloaded ${filename}`;
                        }
                        const documentType = details?.document_type || 'Document';
                        const clientName = details?.client_name;
                        if (clientName) {
                          return `Downloaded ${clientName} ${documentType}`;
                        }
                        return `Downloaded ${documentType}`;
                      }
                      if (action === 'pdf_previewed') {
                        const filename = details?.filename;
                        if (filename) {
                          return `Previewed ${filename}`;
                        }
                        const documentType = details?.document_type || 'Document';
                        const clientName = details?.client_name ? ` for ${details.client_name}` : '';
                        return `Previewed ${documentType}${clientName}`;
                      }
                      if (action === 'form_submitted_for_review') {
                        // Debug log to see what data we're working with
                        console.log('🔧 DEBUG form_submitted_for_review details:', details);
                        
                        // Check if we have a PDF filename first (for consistency)
                        const filename = details?.filename;
                        const reviewerName = details?.reviewer_name;
                        
                        if (filename) {
                          if (reviewerName) {
                            return `Submitted ${filename} for review to ${reviewerName}`;
                          }
                          return `Submitted ${filename} for review`;
                        }
                        
                        // Try to get form name from details, fallback to generic message
                        const formName = details?.form_name || details?.application_title || details?.title;
                        if (formName) {
                          if (reviewerName) {
                            return `Submitted ${formName} for review to ${reviewerName}`;
                          }
                          return `Submitted ${formName} for review`;
                        }
                        
                        if (reviewerName) {
                          return `Submitted application for review to ${reviewerName}`;
                        }
                        return `Submitted application for review`;
                      }
                      if (action === 'review_approved') {
                        // Check if we have a PDF filename first (for consistency)
                        const filename = details?.filename;
                        if (filename) {
                          return `Approved ${filename}`;
                        }
                        
                        // Try to get form name from details, fallback to generic message
                        const formName = details?.form_name || details?.application_title || details?.title;
                        if (formName) {
                          return `Approved ${formName}`;
                        }
                        return `Approved application review`;
                      }
                      if (action === 'review_rejected') {
                        // Check if we have a PDF filename first (for consistency)
                        const filename = details?.filename;
                        if (filename) {
                          return `Rejected ${filename}`;
                        }
                        
                        // Try to get form name from details, fallback to generic message
                        const formName = details?.form_name || details?.application_title || details?.title;
                        if (formName) {
                          return `Rejected ${formName}`;
                        }
                        return `Rejected application review`;
                      }
                      return action
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())
                        .replace('Admin ', '')
                        .replace('User ', '');
                    };

                    // Get activity icon and styling based on type
                    const getActivityConfig = (action: string, resource?: string) => {
                      if (action.includes('login')) 
                        return { bg: 'bg-green-100', icon: LogIn, iconColor: 'text-green-600', category: 'Auth' };
                      if (action.includes('logout')) 
                        return { bg: 'bg-red-100', icon: LogOut, iconColor: 'text-red-600', category: 'Auth' };
                      if (action.includes('password')) 
                        return { bg: 'bg-yellow-100', icon: Key, iconColor: 'text-yellow-600', category: 'Security' };
                      if (action.includes('admin')) 
                        return { bg: 'bg-blue-100', icon: Settings, iconColor: 'text-blue-600', category: 'System' };
                      if (action.includes('alert')) 
                        return { bg: 'bg-red-100', icon: AlertTriangle, iconColor: 'text-red-600', category: 'Alert' };
                      
                      // PDF-related activities with different colors based on resource
                      if (action.includes('pdf_generated')) {
                        if (resource === 'company_services') 
                          return { bg: 'bg-blue-100', icon: Building, iconColor: 'text-blue-600', category: 'Summary of Services' };
                        if (resource === 'golden_visa') 
                          return { bg: 'bg-amber-100', icon: Crown, iconColor: 'text-amber-600', category: 'Golden Visa' };
                        return { bg: 'bg-purple-100', icon: FileText, iconColor: 'text-purple-600', category: 'Documents' };
                      }
                      if (action.includes('pdf_sent')) {
                        if (resource === 'company_services') 
                          return { bg: 'bg-blue-100', icon: Send, iconColor: 'text-blue-600', category: 'Sent to Client' };
                        if (resource === 'golden_visa') 
                          return { bg: 'bg-amber-100', icon: Send, iconColor: 'text-amber-600', category: 'Sent to Client' };
                        if (resource === 'cost_overview') 
                          return { bg: 'bg-green-100', icon: Send, iconColor: 'text-green-600', category: 'Sent to Client' };
                        return { bg: 'bg-purple-100', icon: Send, iconColor: 'text-purple-600', category: 'Sent to Client' };
                      }
                      if (action.includes('pdf_downloaded')) {
                        if (resource === 'company_services') 
                          return { bg: 'bg-blue-50', icon: Download, iconColor: 'text-blue-500', category: 'Downloaded' };
                        if (resource === 'golden_visa') 
                          return { bg: 'bg-amber-50', icon: Download, iconColor: 'text-amber-500', category: 'Downloaded' };
                        if (resource === 'cost_overview') 
                          return { bg: 'bg-green-50', icon: Download, iconColor: 'text-green-500', category: 'Downloaded' };
                        return { bg: 'bg-gray-100', icon: Download, iconColor: 'text-gray-600', category: 'Downloaded' };
                      }
                      if (action.includes('pdf_previewed')) {
                        if (resource === 'company_services') 
                          return { bg: 'bg-blue-50', icon: Eye, iconColor: 'text-blue-500', category: 'Summary of Services' };
                        if (resource === 'golden_visa') 
                          return { bg: 'bg-amber-50', icon: Eye, iconColor: 'text-amber-500', category: 'Golden Visa' };
                        return { bg: 'bg-indigo-100', icon: Eye, iconColor: 'text-indigo-600', category: 'Documents' };
                      }
                      
                      // Review system activities
                      if (action === 'form_submitted_for_review') 
                        return { bg: 'bg-orange-100', icon: Send, iconColor: 'text-orange-600', category: 'Review Submission' };
                      if (action === 'review_approved') 
                        return { bg: 'bg-green-100', icon: CheckCircle, iconColor: 'text-green-600', category: 'Review Approved' };
                      if (action === 'review_rejected') 
                        return { bg: 'bg-red-100', icon: XCircle, iconColor: 'text-red-600', category: 'Review Rejected' };
                      
                      return { bg: 'bg-gray-100', icon: FileText, iconColor: 'text-gray-600', category: 'System' };
                    };

                    const config = getActivityConfig(activity.action, activity.resource);
                    const IconComponent = config.icon;

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
                            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {formatActivityType(activity.action, activity.details)}
                              </p>
                              <span 
                                className="text-xs font-medium px-2 py-1 rounded-full" 
                                style={{ 
                                  backgroundColor: '#f3f4f6', 
                                  color: '#243F7B',
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                {config.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Activity Feed Footer */}
                {activities.length > 5 && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="w-full text-center text-sm font-medium py-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                      style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
                    >
                      {showAllActivities ? 'Show Less Activities' : `View All Activities (${activities.length})`}
                    </motion.button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  No recent activity to display
                </p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}