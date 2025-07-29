'use client';

import { useState } from 'react';

export default function DevTools() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const clearNotifications = async () => {
    setLoading(true);
    setStatus('Clearing notifications...');
    
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Success: ${data.message}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestNotification = async () => {
    setLoading(true);
    setStatus('Creating test notification...');
    
    try {
      // Get current user info first
      const userResponse = await fetch('/api/auth/session');
      const userData = await userResponse.json();
      
      if (!userData.user) {
        setStatus('❌ Error: Not logged in');
        return;
      }
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          type: 'review_requested',
          title: 'Fresh Test Notification',
          message: `This notification was created at ${new Date().toLocaleString()} for testing timestamps.`,
          application_id: null
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Created fresh notification at ${new Date().toLocaleString()}`);
      } else {
        setStatus(`❌ Error creating notification: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dev Tools</h1>
      
      <div className="space-y-4">
        <button
          onClick={clearNotifications}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Working...' : 'Clear Old Notifications'}
        </button>
        
        <button
          onClick={createTestNotification}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Working...' : 'Create Fresh Test Notification'}
        </button>
      </div>
      
      {status && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className="text-sm">{status}</pre>
        </div>
      )}
    </div>
  );
}