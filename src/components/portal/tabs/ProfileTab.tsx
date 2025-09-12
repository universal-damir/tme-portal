'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { FollowUpPanel } from '@/components/follow-ups'

export default function ProfileTab() {
  const { user, loading } = useAuth()


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
          <div className="mb-6">
            <h1 className="text-xl font-bold">
              Hey, {firstName}!
            </h1>
          </div>

          {/* Main Content: Email Response Tracker */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <FollowUpPanel 
                maxHeight="700px"
                autoRefresh={true}
                refreshInterval={60000}
                className="h-full"
              />
            </motion.div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}