'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'

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
              Welcome, {firstName}!
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

          {/* Compact Recent Activity Section */}
          <div>
            <h3 className="text-base font-semibold mb-2">Recent Activity</h3>
            {loadingActivities ? (
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-300 rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => {
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
                    if (action === 'pdf_previewed') {
                      const filename = details?.filename;
                      if (filename) {
                        return `Previewed ${filename}`;
                      }
                      const documentType = details?.document_type || 'Document';
                      const clientName = details?.client_name ? ` for ${details.client_name}` : '';
                      return `Previewed ${documentType}${clientName}`;
                    }
                    return action
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                      .replace('Admin ', '')
                      .replace('User ', '');
                  };

                  // Get activity icon and color based on type
                  const getActivityStyle = (action: string, resource?: string) => {
                    if (action.includes('login')) return { bg: 'bg-green-100', text: 'text-green-600', icon: '🔑' };
                    if (action.includes('logout')) return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🚪' };
                    if (action.includes('password')) return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '🔒' };
                    if (action.includes('admin')) return { bg: 'bg-blue-100', text: 'text-blue-600', icon: '⚙️' };
                    if (action.includes('alert')) return { bg: 'bg-red-100', text: 'text-red-600', icon: '⚠️' };
                    
                    // PDF-related activities with different colors based on resource
                    if (action.includes('pdf_generated')) {
                      if (resource === 'company_services') return { bg: 'bg-blue-100', text: 'text-blue-600', icon: '🏢' };
                      if (resource === 'golden_visa') return { bg: 'bg-amber-100', text: 'text-amber-600', icon: '👑' };
                      return { bg: 'bg-purple-100', text: 'text-purple-600', icon: '📄' }; // cost_overview
                    }
                    if (action.includes('pdf_previewed')) {
                      if (resource === 'company_services') return { bg: 'bg-blue-50', text: 'text-blue-500', icon: '🔍' };
                      if (resource === 'golden_visa') return { bg: 'bg-amber-50', text: 'text-amber-500', icon: '👁️' };
                      return { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: '👁️' }; // cost_overview
                    }
                    
                    return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '📋' };
                  };

                  const style = getActivityStyle(activity.action, activity.resource);

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-6 h-6 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className="text-xs">{style.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatActivityType(activity.action, activity.details)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.created_at)}
                          </p>
                          {activity.resource && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-400 capitalize">
                                {activity.resource}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No recent activity to display</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}