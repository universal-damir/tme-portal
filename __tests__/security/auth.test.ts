import { authenticateUser, validatePassword, hashPassword, verifyPassword } from '@/lib/auth';
import { validateQueryParams, checkPasswordStrength } from '@/lib/security';

// Mock database and Redis for testing
jest.mock('@/lib/database', () => ({
  query: jest.fn(),
  redis: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Authentication Security Tests', () => {
  const mockQuery = require('@/lib/database').query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Security', () => {
    test('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      const isInvalid = await verifyPassword('WrongPassword', hashedPassword);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'MySecureP@ssw0rd!';
      
      const weakResult = validatePassword(weakPassword);
      const strongResult = validatePassword(strongPassword);
      
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.errors.length).toBe(0);
    });

    test('should check password strength with detailed feedback', () => {
      const passwords = [
        { password: '123', expectedScore: 0 },
        { password: 'password', expectedScore: 1 },
        { password: 'Password1', expectedScore: 3 },
        { password: 'MySecureP@ssw0rd!', expectedScore: 4 },
      ];

      passwords.forEach(({ password, expectedScore }) => {
        const result = checkPasswordStrength(password);
        expect(result.score).toBe(expectedScore);
        expect(result.isStrong).toBe(expectedScore >= 3);
      });
    });
  });

  describe('Account Lockout Protection', () => {
    test('should lock account after 5 failed attempts', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        employee_code: employeeCode,
        hashed_password: await hashPassword('CorrectPassword'),
        failed_login_attempts: 4,
        locked_until: null,
        status: 'active'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Update failed attempts
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Lock account

      try {
        await authenticateUser(email, 'WrongPassword');
      } catch (error) {
        expect(error.message).toContain('Account locked');
      }

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET locked_until'),
        expect.any(Array)
      );
    });

    test('should reject locked account login', async () => {
      const email = 'test@example.com';
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 15);
      
      const mockUser = {
        id: 1,
        employee_code: employeeCode,
        locked_until: futureDate,
        status: 'active'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      try {
        await authenticateUser(email, 'AnyPassword');
      } catch (error) {
        expect(error.message).toContain('Account is locked');
      }
    });
  });

  describe('SQL Injection Protection', () => {
    test('should detect SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; INSERT INTO users VALUES ('hacker'); --"
      ];

      maliciousInputs.forEach(input => {
        const params = { search: input };
        const isValid = validateQueryParams(params);
        expect(isValid).toBe(false);
      });
    });

    test('should allow safe inputs', () => {
      const safeInputs = [
        "John Doe",
        "user@example.com",
        "TME123",
        "Normal search text"
      ];

      safeInputs.forEach(input => {
        const params = { search: input };
        const isValid = validateQueryParams(params);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', () => {
      const { validateEmail } = require('@/lib/security');
      
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should validate employee code format', () => {
      const { validateEmployeeCode } = require('@/lib/security');
      
      const validCodes = ['AB12', 'TME123', 'XY99', 'ABC1234'];
      const invalidCodes = ['ab12', '123', 'TOOLONG123', 'XY-12', 'XY 12'];

      validCodes.forEach(code => {
        expect(validateEmployeeCode(code)).toBe(true);
      });

      invalidCodes.forEach(code => {
        expect(validateEmployeeCode(code)).toBe(false);
      });
    });
  });

  describe('Session Security', () => {
    test('should generate secure session cookies', () => {
      const { generateSecureSessionCookie } = require('@/lib/security');
      
      const sessionId = 'test-session-id';
      const maxAge = 3600;
      const cookie = generateSecureSessionCookie(sessionId, maxAge);
      
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain(`Max-Age=${maxAge}`);
      expect(cookie).toContain('Path=/');
    });
  });
});