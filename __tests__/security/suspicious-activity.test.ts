import { detectSuspiciousActivity, SecurityEvent } from '@/lib/security';
import { detectSuspiciousActivity as detectFromLogs } from '@/lib/audit';

// Mock database for testing
jest.mock('@/lib/database', () => ({
  query: jest.fn(),
}));

describe('Suspicious Activity Detection Tests', () => {
  const mockQuery = require('@/lib/database').query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Real-time Activity Detection', () => {
    test('should detect unusual access hours', () => {
      const userId = 1;
      const action = 'login';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      // Mock current time to be 3 AM (outside business hours)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(3);
      
      const events = detectSuspiciousActivity(userId, action, ipAddress, userAgent);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('unusual_access');
      expect(events[0].severity).toBe('medium');
      expect(events[0].details.hour).toBe(3);
    });

    test('should detect brute force attempts', () => {
      const userId = 1;
      const action = 'login_failed';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      // Mock previous activity with many recent attempts
      const previousActivity = Array(15).fill(0).map((_, i) => ({
        created_at: new Date(Date.now() - i * 10000), // 10 seconds apart
        action: 'login_failed',
        ip_address: ipAddress
      }));
      
      const events = detectSuspiciousActivity(userId, action, ipAddress, userAgent, previousActivity);
      
      const bruteForceEvent = events.find(e => e.type === 'brute_force');
      expect(bruteForceEvent).toBeDefined();
      expect(bruteForceEvent?.severity).toBe('high');
      expect(bruteForceEvent?.details.attemptCount).toBe(15);
    });

    test('should not trigger during business hours', () => {
      const userId = 1;
      const action = 'login';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      
      // Mock current time to be 2 PM (business hours)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      
      const events = detectSuspiciousActivity(userId, action, ipAddress, userAgent);
      
      expect(events).toHaveLength(0);
    });
  });

  describe('Database-based Activity Detection', () => {
    test('should detect multiple failed logins from same IP', async () => {
      const mockFailedLogins = {
        rows: [
          {
            ip_address: '192.168.1.100',
            attempt_count: 8,
            user_ids: [1, 2, 3],
            last_attempt: new Date()
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce(mockFailedLogins) // Failed logins
        .mockResolvedValueOnce({ rows: [] }) // Lockouts
        .mockResolvedValueOnce({ rows: [] }) // Unusual hours
        .mockResolvedValueOnce({ rows: [] }) // Simultaneous sessions
        .mockResolvedValueOnce({ rows: [] }) // Admin after hours
        .mockResolvedValueOnce({ rows: [] }); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('brute_force_attack');
      expect(activities[0].severity).toBe('high');
      expect(activities[0].details).toContain('8 failed login attempts');
    });

    test('should detect account lockouts', async () => {
      const mockLockouts = {
        rows: [
          {
            user_id: 1,
            full_name: 'Test User',
            employee_code: 'TEST01',
            ip_address: '192.168.1.1',
            created_at: new Date()
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Failed logins
        .mockResolvedValueOnce(mockLockouts) // Lockouts
        .mockResolvedValueOnce({ rows: [] }) // Unusual hours
        .mockResolvedValueOnce({ rows: [] }) // Simultaneous sessions
        .mockResolvedValueOnce({ rows: [] }) // Admin after hours
        .mockResolvedValueOnce({ rows: [] }); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('account_lockout');
      expect(activities[0].severity).toBe('medium');
      expect(activities[0].user_name).toBe('Test User');
    });

    test('should detect unusual access hours', async () => {
      const mockUnusualHours = {
        rows: [
          {
            user_id: 1,
            full_name: 'Test User',
            employee_code: 'TEST01',
            ip_address: '192.168.1.1',
            created_at: new Date(),
            hour: 2
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Failed logins
        .mockResolvedValueOnce({ rows: [] }) // Lockouts
        .mockResolvedValueOnce(mockUnusualHours) // Unusual hours
        .mockResolvedValueOnce({ rows: [] }) // Simultaneous sessions
        .mockResolvedValueOnce({ rows: [] }) // Admin after hours
        .mockResolvedValueOnce({ rows: [] }); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('unusual_hours_access');
      expect(activities[0].severity).toBe('low');
      expect(activities[0].details).toContain('Login at 2:00');
    });

    test('should detect multiple simultaneous sessions', async () => {
      const mockSessions = {
        rows: [
          {
            user_id: 1,
            full_name: 'Test User',
            employee_code: 'TEST01',
            ip_count: 3,
            session_count: 5
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Failed logins
        .mockResolvedValueOnce({ rows: [] }) // Lockouts
        .mockResolvedValueOnce({ rows: [] }) // Unusual hours
        .mockResolvedValueOnce(mockSessions) // Simultaneous sessions
        .mockResolvedValueOnce({ rows: [] }) // Admin after hours
        .mockResolvedValueOnce({ rows: [] }); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('multiple_sessions');
      expect(activities[0].severity).toBe('medium');
      expect(activities[0].details).toContain('5 active sessions from 3 different IP addresses');
    });

    test('should detect admin actions after hours', async () => {
      const mockAdminAfterHours = {
        rows: [
          {
            user_id: 1,
            full_name: 'Admin User',
            employee_code: 'ADMIN01',
            action: 'admin_delete_user',
            created_at: new Date(),
            hour: 23
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Failed logins
        .mockResolvedValueOnce({ rows: [] }) // Lockouts
        .mockResolvedValueOnce({ rows: [] }) // Unusual hours
        .mockResolvedValueOnce({ rows: [] }) // Simultaneous sessions
        .mockResolvedValueOnce(mockAdminAfterHours) // Admin after hours
        .mockResolvedValueOnce({ rows: [] }); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('admin_after_hours');
      expect(activities[0].severity).toBe('high');
      expect(activities[0].details).toContain("Administrative action 'delete_user' performed at 23:00");
    });

    test('should detect rapid API calls', async () => {
      const mockRapidCalls = {
        rows: [
          {
            user_id: 1,
            full_name: 'Test User',
            employee_code: 'TEST01',
            ip_address: '192.168.1.1',
            call_count: 75,
            first_call: new Date(Date.now() - 5 * 60 * 1000),
            last_call: new Date()
          }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Failed logins
        .mockResolvedValueOnce({ rows: [] }) // Lockouts
        .mockResolvedValueOnce({ rows: [] }) // Unusual hours
        .mockResolvedValueOnce({ rows: [] }) // Simultaneous sessions
        .mockResolvedValueOnce({ rows: [] }) // Admin after hours
        .mockResolvedValueOnce(mockRapidCalls); // Rapid API calls

      const activities = await detectFromLogs();
      
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('rapid_api_calls');
      expect(activities[0].severity).toBe('medium');
      expect(activities[0].details).toContain('75 API calls in 5 minutes');
    });
  });

  describe('Security Event Classification', () => {
    test('should classify events by severity', () => {
      const events: SecurityEvent[] = [
        {
          type: 'unusual_access',
          severity: 'low',
          details: {},
          timestamp: new Date()
        },
        {
          type: 'brute_force',
          severity: 'high',
          details: {},
          timestamp: new Date()
        },
        {
          type: 'privilege_escalation',
          severity: 'critical',
          details: {},
          timestamp: new Date()
        }
      ];

      const lowSeverity = events.filter(e => e.severity === 'low');
      const highSeverity = events.filter(e => e.severity === 'high');
      const criticalSeverity = events.filter(e => e.severity === 'critical');

      expect(lowSeverity).toHaveLength(1);
      expect(highSeverity).toHaveLength(1);
      expect(criticalSeverity).toHaveLength(1);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});