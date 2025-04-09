import { 
  initializeFirebase,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getMaintenanceRequests,
  getComplaints,
  getSleepoverRequests,
  getManagementRequests,
  getAllMaintenanceRequests,
  getTodayMaintenanceRequests,
  MaintenanceStatus,
  ComplaintStatus,
  SleepoverStatus,
  ManagementStatus
} from '../firestore';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
    now: jest.fn()
  }
}));

describe('Firestore Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeFirebase', () => {
    it('should initialize Firebase with correct config', () => {
      initializeFirebase();
      expect(require('firebase/app').initializeApp).toHaveBeenCalled();
    });
  });

  describe('User Management', () => {
    const testUser = {
      id: 'test-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '1234567890',
      roomNumber: '101',
      tenantCode: 'TEST',
      role: 'student'
    };

    it('should create a user', async () => {
      const result = await createUser(testUser);
      expect(result).toBe(true);
    });

    it('should get a user', async () => {
      const result = await getUser('test-id');
      expect(result).toBeDefined();
    });

    it('should update a user', async () => {
      const result = await updateUser('test-id', { firstName: 'Updated' });
      expect(result).toBe(true);
    });

    it('should delete a user', async () => {
      const result = await deleteUser('test-id');
      expect(result).toBe(true);
    });
  });

  describe('Request Management', () => {
    it('should get maintenance requests', async () => {
      const result = await getMaintenanceRequests('test-id');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get complaints', async () => {
      const result = await getComplaints('test-id');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get sleepover requests', async () => {
      const result = await getSleepoverRequests('test-id');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get management requests', async () => {
      const result = await getManagementRequests('test-id');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get all maintenance requests', async () => {
      const result = await getAllMaintenanceRequests();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get today\'s maintenance requests', async () => {
      const result = await getTodayMaintenanceRequests();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Status Types', () => {
    it('should have correct maintenance status values', () => {
      expect(MaintenanceStatus).toHaveProperty('PENDING');
      expect(MaintenanceStatus).toHaveProperty('IN_PROGRESS');
      expect(MaintenanceStatus).toHaveProperty('COMPLETED');
    });

    it('should have correct complaint status values', () => {
      expect(ComplaintStatus).toHaveProperty('PENDING');
      expect(ComplaintStatus).toHaveProperty('IN_PROGRESS');
      expect(ComplaintStatus).toHaveProperty('RESOLVED');
    });

    it('should have correct sleepover status values', () => {
      expect(SleepoverStatus).toHaveProperty('PENDING');
      expect(SleepoverStatus).toHaveProperty('APPROVED');
      expect(SleepoverStatus).toHaveProperty('REJECTED');
    });

    it('should have correct management status values', () => {
      expect(ManagementStatus).toHaveProperty('PENDING');
      expect(ManagementStatus).toHaveProperty('IN_PROGRESS');
      expect(ManagementStatus).toHaveProperty('RESOLVED');
    });
  });
}); 