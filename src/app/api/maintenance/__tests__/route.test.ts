import { POST, GET, PATCH } from '../route';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { MaintenanceStatus } from '@/lib/firestore';

describe('Maintenance API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/maintenance', () => {
    it('should create a new maintenance request', async () => {
      const mockRequest = {
        userId: '123',
        title: 'Broken faucet',
        description: 'The kitchen faucet is leaking',
        priority: 'high',
        category: 'Kitchen',
        roomNumber: '101'
      };

      (addDoc as jest.Mock).mockResolvedValueOnce({
        id: 'request123'
      });

      const request = new Request('http://localhost:3000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe('request123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...mockRequest,
          status: MaintenanceStatus.PENDING,
          createdAt: expect.any(Object),
        })
      );
    });
  });

  describe('GET /api/maintenance', () => {
    it('should fetch all maintenance requests', async () => {
      const mockRequests = [
        {
          id: '1',
          title: 'Request 1',
          status: MaintenanceStatus.PENDING,
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Request 2',
          status: MaintenanceStatus.IN_PROGRESS,
          createdAt: new Date(),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockRequests.map(request => ({
          id: request.id,
          data: () => request,
        })),
      });

      const request = new Request('http://localhost:3000/api/maintenance');
      const response = await GET(request);
      const data = await response.json();

      expect(data.requests).toHaveLength(2);
      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'query',
        })
      );
    });

    it('should filter requests by userId', async () => {
      const userId = '123';
      const request = new Request(`http://localhost:3000/api/maintenance?userId=${userId}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should filter requests by status', async () => {
      const status = MaintenanceStatus.PENDING;
      const request = new Request(`http://localhost:3000/api/maintenance?status=${status}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('status', '==', status);
    });
  });

  describe('PATCH /api/maintenance', () => {
    it('should update maintenance request status', async () => {
      const updateData = {
        id: 'request123',
        status: MaintenanceStatus.IN_PROGRESS,
        adminResponse: 'Work in progress',
      };

      const request = new Request('http://localhost:3000/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: updateData.status,
          adminResponse: updateData.adminResponse,
          updatedAt: expect.any(Object),
        })
      );
    });
  });
}); 