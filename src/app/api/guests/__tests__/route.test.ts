import { POST, GET, PATCH } from '../route';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';

describe('Guests API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/guests', () => {
    it('should create a new guest record', async () => {
      const mockGuest = {
        userId: '123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        roomNumber: '101',
        purpose: 'Visit',
        fromDate: '2024-04-10'
      };

      (addDoc as jest.Mock).mockResolvedValueOnce({
        id: 'guest123'
      });

      const request = new Request('http://localhost:3000/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockGuest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe('guest123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...mockGuest,
          status: 'active',
          createdAt: expect.any(Object),
        })
      );
    });
  });

  describe('GET /api/guests', () => {
    it('should fetch all guest records', async () => {
      const mockGuests = [
        {
          id: '1',
          firstName: 'Guest 1',
          status: 'active',
          createdAt: new Date(),
        },
        {
          id: '2',
          firstName: 'Guest 2',
          status: 'checked_out',
          createdAt: new Date(),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockGuests.map(guest => ({
          id: guest.id,
          data: () => guest,
        })),
      });

      const request = new Request('http://localhost:3000/api/guests');
      const response = await GET(request);
      const data = await response.json();

      expect(data.guests).toHaveLength(2);
      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'query',
        })
      );
    });

    it('should filter guests by userId', async () => {
      const userId = '123';
      const request = new Request(`http://localhost:3000/api/guests?userId=${userId}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should filter guests by status', async () => {
      const status = 'active';
      const request = new Request(`http://localhost:3000/api/guests?status=${status}`);
      
      await GET(request);

      expect(where).toHaveBeenCalledWith('status', '==', status);
    });
  });

  describe('PATCH /api/guests', () => {
    it('should update guest status and checkout time', async () => {
      const updateData = {
        id: 'guest123',
        status: 'checked_out',
        checkoutTime: '2024-04-10T15:30:00Z',
      };

      const request = new Request('http://localhost:3000/api/guests', {
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
          checkoutTime: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
    });
  });
}); 