import { POST, GET, PATCH } from '../route';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ComplaintStatus } from '@/lib/firestore';

describe('Complaints API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/complaints', () => {
    it('should create a new complaint', async () => {
      const mockComplaint = {
        userId: '123',
        title: 'Noise complaint',
        description: 'Loud music from room 102',
        priority: 'high',
        roomNumber: '101'
      };

      (addDoc as jest.Mock).mockResolvedValueOnce({
        id: 'complaint123'
      });

      const request = new Request('http://localhost:3000/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockComplaint),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe('complaint123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...mockComplaint,
          status: ComplaintStatus.PENDING,
          createdAt: expect.any(Object),
        })
      );
    });
  });

  describe('GET /api/complaints', () => {
    it('should fetch all complaints', async () => {
      const mockComplaints = [
        {
          id: '1',
          title: 'Complaint 1',
          status: ComplaintStatus.PENDING,
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Complaint 2',
          status: ComplaintStatus.IN_PROGRESS,
          createdAt: new Date(),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockComplaints.map(complaint => ({
          id: complaint.id,
          data: () => complaint,
        })),
      });

      const request = new Request('http://localhost:3000/api/complaints');
      const response = await GET(request);
      const data = await response.json();

      expect(data.complaints).toHaveLength(2);
      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'query',
        })
      );
    });

    it('should filter complaints by userId', async () => {
      const userId = '123';
      const request = new Request(`http://localhost:3000/api/complaints?userId=${userId}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should filter complaints by status', async () => {
      const status = ComplaintStatus.PENDING;
      const request = new Request(`http://localhost:3000/api/complaints?status=${status}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('status', '==', status);
    });
  });

  describe('PATCH /api/complaints', () => {
    it('should update complaint status', async () => {
      const updateData = {
        id: 'complaint123',
        status: ComplaintStatus.IN_PROGRESS,
        adminResponse: 'Investigating the issue',
      };

      const request = new Request('http://localhost:3000/api/complaints', {
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