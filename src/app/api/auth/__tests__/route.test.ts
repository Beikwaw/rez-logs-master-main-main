import { POST, DELETE } from '../route';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';

// Mock the next/headers module
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth', () => {
    it('should register a new user', async () => {
      const mockUser = { uid: '123' };
      const mockUserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        roomNumber: '101',
        tenantCode: 'ABC123',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const request = new Request('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          action: 'register',
          userData: mockUserData,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.userId).toBe('123');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          email: 'test@example.com',
          role: 'student',
          ...mockUserData,
        })
      );
    });

    it('should login an existing user', async () => {
      const mockUser = { uid: '123', getIdToken: jest.fn().mockResolvedValue('token123') };
      const mockUserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      (getDoc as jest.Mock).mockResolvedValueOnce({
        data: () => mockUserData,
      });

      const request = new Request('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          action: 'login',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        id: '123',
        ...mockUserData,
      });
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'password123'
      );
    });
  });

  describe('DELETE /api/auth', () => {
    it('should logout the user', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(cookies().delete).toHaveBeenCalledWith('session');
    });
  });
}); 