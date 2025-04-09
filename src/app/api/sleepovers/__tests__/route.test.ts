import { POST, GET, PATCH } from '../route';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { SleepoverStatus } from '@/lib/firestore';

describe('Sleepover API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sleepovers', () => {
    it('should create a new sleepover request', async () => {
      const mockRequest = {
        userId: '123',
        guestName: 'John Doe',
        guestPhone: '1234567890',
        relationship: 'Friend',
        fromDate: '2024-04-10',
        toDate: '2024-04-12',
        roomNumber: '101'
      };

      (addDoc as jest.Mock).mockResolvedValueOnce({
        id: 'sleepover123'
      });

      const request = new Request('http://localhost:3000/api/sleepovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe('sleepover123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...mockRequest,
          status: SleepoverStatus.PENDING,
          createdAt: expect.any(Object),
        })
      );
    });
  });

  describe('GET /api/sleepovers', () => {
    it('should fetch all sleepover requests', async () => {
      const mockRequests = [
        {
          id: '1',
          guestName: 'Guest 1',
          status: SleepoverStatus.PENDING,
          createdAt: new Date(),
        },
        {
          id: '2',
          guestName: 'Guest 2',
          status: SleepoverStatus.APPROVED,
          createdAt: new Date(),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockRequests.map(request => ({
          id: request.id,
          data: () => request,
        })),
      });

      const request = new Request('http://localhost:3000/api/sleepovers');
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
      const request = new Request(`http://localhost:3000/api/sleepovers?userId=${userId}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should filter requests by status', async () => {
      const status = SleepoverStatus.PENDING;
      const request = new Request(`http://localhost:3000/api/sleepovers?status=${status}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('status', '==', status);
    });
  });

  describe('PATCH /api/sleepovers', () => {
    it('should update sleepover request status', async () => {
      const updateData = {
        id: 'sleepover123',
        status: SleepoverStatus.APPROVED,
        adminResponse: 'Request approved',
      };

      const request = new Request('http://localhost:3000/api/sleepovers', {
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