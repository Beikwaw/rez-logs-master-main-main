import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  Timestamp,
  addDoc,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

const USERS_COLLECTION = 'users';
const ADMINS_COLLECTION = 'admins';

// Define status types first
export const SleepoverStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DENIED: 'denied'
} as const;

export const MaintenanceStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

export const ComplaintStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
} as const;

export const ManagementStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type SleepoverStatus = typeof SleepoverStatus[keyof typeof SleepoverStatus];
export type MaintenanceStatus = typeof MaintenanceStatus[keyof typeof MaintenanceStatus];
export type ComplaintStatus = typeof ComplaintStatus[keyof typeof ComplaintStatus];
export type ManagementStatus = typeof ManagementStatus[keyof typeof ManagementStatus];

export interface AdminData {
  id: string;
  userId: string;
  email: string;
  type: 'superadmin' | 'admin-maintenance' | 'admin-security' | 'admin-complaints' | 'admin-guest-management';
  role: 'admin' | 'superadmin';
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  permissions?: string[];
  isSuperAdmin: boolean;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  surname: string;
  full_name: string;
  phone?: string;
  role: 'student' | 'newbie' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  applicationStatus?: 'accepted' | 'denied' | 'pending';
  place_of_study: string;
  room_number: string;
  tenant_code: string;
  isGuest?: boolean;
  requestDetails?: {
    accommodationType: string;
    location: string;
    dateSubmitted: Date;
  };
  communicationLog?: {
    message: string;
    sentBy: 'admin' | 'superadmin' | 'student';
    timestamp: Date;
  }[];
}

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'maintenance' | 'security' | 'noise' | 'cleanliness' | 'other';
  location?: string;
  status: ComplaintStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  adminResponse?: string;
  roomNumber: string;
  tenantCode: string;
}

export interface SleepoverRequest {
  id: string;
  userId: string;
  tenantCode: string;
  guestName: string;
  guestSurname: string;
  guestPhoneNumber: string;
  roomNumber: string;
  additionalGuests: {
    name: string;
    surname: string;
    phoneNumber: string;
  }[];
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  status: SleepoverStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  adminResponse?: string;
  securityCode?: string;
  isActive?: boolean;
  signOutTime?: Timestamp | Date;
  durationOfStay?: string;
}

export interface MaintenanceRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: 'bedroom' | 'bathroom' | 'kitchen' | 'furniture' | 'other';
  roomNumber?: string;
  timeSlot?: string;
  preferredDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: MaintenanceStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  adminResponse?: string;
  tenantCode?: string;
  images?: string[];
}

export interface GuestRegistration {
  id: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  visitDate: string;
  visitTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  adminResponse?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'maintenance' | 'complaint' | 'sleepover' | 'guest' | 'message';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreUser {
  id: string;
  name: string;
  surname: string;
  tenant_code: string;
  room_number: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin';
}

export interface DailyReport {
  date: Date;
  sleepovers: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
  };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  complaints: {
    total: number;
    pending: number;
    resolved: number;
  };
}

export interface DetailedReport {
  date: Date;
  sleepovers: {
    total: number;
    pending: number;
    resolved: number;
    denied: number;
    items: Array<{
      id: string;
      studentName: string;
      date: Date;
      status: SleepoverStatus;
      details: string;
    }>;
  };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    items: Array<{
      id: string;
      title: string;
      description: string;
      status: MaintenanceStatus;
      createdAt: Date;
    }>;
  };
  complaints: {
    total: number;
    pending: number;
    resolved: number;
    items: Array<{
      id: string;
      title: string;
      description: string;
      status: ComplaintStatus;
      createdAt: Date;
    }>;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  expiresAt?: Date;
  isFirstTimeShown?: boolean;
  priority?: 'low' | 'medium' | 'high';
  createdBy?: string;
  createdByName?: string;
  status: 'active' | 'archived';
}

export interface GuestRequest {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roomNumber: string;
  purpose: string;
  fromDate: string;
  status: 'active' | 'checked_out';
  tenantCode: string;
  userId: string;
  createdAt: Date;
  checkoutTime?: Date;
}

export interface ManagementRequest {
  id: string;
  userId: string;
  tenantCode: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  description: string;
  status: ManagementStatus;
  createdAt: Date;
  updatedAt: Date;
  adminResponse?: string;
}

export interface GuestData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roomNumber: string;
  purpose: string;
  fromDate: string;
  status: 'active' | 'checked_out';
  tenantCode: string;
  createdAt: Date;
  checkoutTime?: Date;
}

// Helper function to convert Timestamp to Date
const convertTimestampToDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper function to convert Date to Timestamp
const convertDateToTimestamp = (date: Date | Timestamp | undefined): Timestamp => {
  if (!date) return Timestamp.now();
  if (date instanceof Timestamp) return date;
  return Timestamp.fromDate(date);
};

// Helper function to query data in date range
const queryDataInDateRange = async <T>(
  collectionName: string,
  startDate: Date,
  endDate: Date,
  dateField: string,
  additionalFilters: Record<string, any>
): Promise<T[]> => {
  const collectionRef = collection(db, collectionName)
  const queryConstraints = [
    where(dateField, '>=', convertDateToTimestamp(startDate)),
    where(dateField, '<=', convertDateToTimestamp(endDate)),
    ...Object.entries(additionalFilters).map(([field, value]) => where(field, '==', value))
  ]
  const q = query(collectionRef, ...queryConstraints)
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[]
}

export const createUser = async (userData: Omit<UserData, 'createdAt' | 'updatedAt' | 'communicationLog'>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userData.id);
    const now = serverTimestamp();

    await setDoc(userRef, {
      ...userData,
      createdAt: now,
      updatedAt: now,
      communicationLog: [],
      isGuest: userData.isGuest || false
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      email: data.email,
      name: data.name,
      surname: data.surname,
      full_name: data.full_name,
      phone: data.phone,
      role: data.role,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      applicationStatus: data.applicationStatus,
      place_of_study: data.place_of_study,
      room_number: data.room_number,
      tenant_code: data.tenant_code,
      isGuest: data.isGuest || false,
      requestDetails: data.requestDetails ? {
        ...data.requestDetails,
        dateSubmitted: data.requestDetails.dateSubmitted?.toDate() || new Date()
      } : undefined,
      communicationLog: data.communicationLog?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp?.toDate() || new Date()
      })) || []
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  const usersRef = collection(db, USERS_COLLECTION);
  const usersSnap = await getDocs(usersRef);
  return usersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      communicationLog: data.communicationLog?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp?.toDate() || new Date()
      })) || []
    } as UserData;
  });
};

export const getPendingApplications = async () => {
  const usersRef = collection(db, USERS_COLLECTION);
  const pendingQuery = query(
    usersRef, 
    where('applicationStatus', '==', 'pending')
  );
  const newbieQuery = query(
    usersRef,
    where('role', '==', 'newbie')
  );

  const [pendingSnap, newbieSnap] = await Promise.all([
    getDocs(pendingQuery),
    getDocs(newbieQuery)
  ]);

  const pendingUsers = pendingSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      communicationLog: data.communicationLog?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp?.toDate() || new Date()
      })) || []
    } as UserData;
  });

  const newbieUsers = newbieSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      communicationLog: data.communicationLog?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp?.toDate() || new Date()
      })) || []
    } as UserData;
  });

  // Combine both arrays and remove duplicates based on id
  const allPending = [...pendingUsers, ...newbieUsers];
  const uniquePending = allPending.filter((user, index, self) =>
    index === self.findIndex((u) => u.id === user.id)
  );

  return uniquePending;
};

export const processRequest = async (
  userId: string,
  status: 'accepted' | 'denied',
  message: string,
  adminId: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentStatus = userData.applicationStatus;

    if (currentStatus !== 'pending') {
      throw new Error('Application has already been processed');
    }

    const batch = writeBatch(db);
    const now = new Date();
    
    // Update user document
    batch.update(userRef, {
      applicationStatus: status,
      role: status === 'accepted' ? 'student' : 'newbie',
      updatedAt: now,
      communicationLog: arrayUnion({
        type: 'application_status_change',
        status,
        message,
        timestamp: now,
        adminId
      })
    });

    // If accepted, create a student profile
    if (status === 'accepted') {
      const studentRef = doc(db, 'students', userId);
      batch.set(studentRef, {
        userId,
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        full_name: userData.full_name,
        phone: userData.phone,
        place_of_study: userData.place_of_study,
        room_number: userData.room_number,
        tenant_code: userData.tenant_code,
        createdAt: now,
        updatedAt: now,
        status: 'active'
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error processing request:', error);
    throw error;
  }
};

export const addCommunication = async (
  userId: string,
  message: string,
  sentBy: 'admin' | 'student'
) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const now = new Date();

  await updateDoc(userRef, {
    communicationLog: arrayUnion({
      message,
      sentBy,
      timestamp: convertDateToTimestamp(now)
    })
  });
};

export const updateUser = async (userId: string, updates: Partial<UserData>) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, updates);
};

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
};

// Admin functions
export const createAdmin = async (adminData: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Check if trying to create a superadmin
    if (adminData.type === 'superadmin') {
      // Check if a superadmin already exists
      const superadminQuery = query(
        collection(db, ADMINS_COLLECTION),
        where('type', '==', 'superadmin')
      );
      const superadminSnapshot = await getDocs(superadminQuery);
      
      if (!superadminSnapshot.empty) {
        throw new Error('A superadmin already exists. Only one superadmin is allowed.');
      }
    }

    const adminRef = doc(collection(db, ADMINS_COLLECTION));
    const newAdmin: AdminData = {
    ...adminData,
      id: adminRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSuperAdmin: adminData.type === 'superadmin'
    };

    await setDoc(adminRef, newAdmin);
    return adminRef.id;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

export const getAdminByUserId = async (userId: string) => {
  if (!userId) {
    console.error('No userId provided to getAdminByUserId');
    return null;
  }

  try {
  const adminsRef = collection(db, ADMINS_COLLECTION);
  const q = query(adminsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();

    // Helper function to safely convert Firestore timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      if (timestamp instanceof Timestamp) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      return new Date(timestamp);
    };

  return {
    id: doc.id,
    ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastLogin: data.lastLogin ? toDate(data.lastLogin) : undefined
  } as AdminData;
  } catch (error) {
    console.error('Error in getAdminByUserId:', error);
    throw error;
  }
};

export const getAllAdmins = async () => {
  const adminsRef = collection(db, ADMINS_COLLECTION);
  const adminsSnap = await getDocs(adminsRef);
  
  return adminsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastLogin: data.lastLogin?.toDate()
    } as AdminData;
  });
};

export const updateAdmin = async (adminId: string, adminData: Partial<AdminData>): Promise<void> => {
  try {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId);
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      throw new Error('Admin not found');
    }

    const currentAdmin = adminDoc.data() as AdminData;
    
    // Prevent changing superadmin status
    if (currentAdmin.type === 'superadmin' && adminData.type !== 'superadmin') {
      throw new Error('Cannot change superadmin status');
    }

    // Prevent creating another superadmin
    if (adminData.type === 'superadmin' && currentAdmin.type !== 'superadmin') {
      const superadminQuery = query(
        collection(db, ADMINS_COLLECTION),
        where('type', '==', 'superadmin')
      );
      const superadminSnapshot = await getDocs(superadminQuery);
      
      if (!superadminSnapshot.empty) {
        throw new Error('A superadmin already exists. Only one superadmin is allowed.');
      }
    }
  
  await updateDoc(adminRef, {
      ...adminData,
      updatedAt: new Date(),
      isSuperAdmin: adminData.type === 'superadmin' || currentAdmin.type === 'superadmin'
  });
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

export const deleteAdmin = async (adminId: string): Promise<void> => {
  try {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId);
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      throw new Error('Admin not found');
    }

    const adminData = adminDoc.data() as AdminData;
    
    // Prevent deleting the superadmin
    if (adminData.type === 'superadmin') {
      throw new Error('Cannot delete the superadmin');
    }

  await deleteDoc(adminRef);
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
};

export const updateAdminLastLogin = async (adminId: string) => {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId);
  const now = new Date();
  
  await updateDoc(adminRef, {
    lastLogin: now,
    updatedAt: now
  });
};

export const createComplaint = async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse'>) => {
  const complaintsRef = collection(db, 'complaints');
  const now = new Date();
  
  const docRef = await addDoc(complaintsRef, {
    ...complaint,

    adminResponse: '',
    createdAt: now,
    updatedAt: now
  });

  return docRef.id;
};

export const createSleepoverRequest = async (data: {
  userId: string;
  guestName: string;
  guestSurname: string;
  guestEmail: string;
  guestPhone: string;
  relationship: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  tenantCode: string;
  status?: SleepoverStatus;
}) => {
  try {
    const sleepoverRef = collection(db, 'sleepover_requests');
    const newRequest = {
      ...data,
      status: data.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(sleepoverRef, newRequest);
    return docRef.id;
  } catch (error) {
    console.error('Error creating sleepover request:', error);
    throw error;
  }
};

export async function createMaintenanceRequest({
  userId,
  title,
  description,
  priority,
  category,
  roomNumber,
  tenantCode,
  preferredDate,
  timeSlot
}: {
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  roomNumber: string;
  tenantCode: string;
  preferredDate: Date;
  timeSlot: string;
}): Promise<string> {
  const maintenanceRef = collection(db, 'maintenance_requests');
  const newRequest = {
    userId,
    title,
    description,
    priority,
    category,
    roomNumber,
    tenantCode,
    preferredDate,
    timeSlot,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(maintenanceRef, newRequest);
  return docRef.id;
}

export const getComplaints = async (userId: string, startDate: Date, endDate: Date): Promise<Complaint[]> => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef,
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const complaints = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Complaint;
    });

    // Filter complaints by date range in memory
    return complaints.filter(complaint => {
      const complaintDate = complaint.createdAt;
      return complaintDate >= startDate && complaintDate < endDate;
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

export const getSleepoverRequests = async () => {
  const requestsRef = collection(db, 'sleepover_requests');
  const requestsSnap = await getDocs(requestsRef);
  
  // Helper function to safely convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  return requestsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      signOutTime: data.signOutTime ? toDate(data.signOutTime) : undefined
    };
  }) as SleepoverRequest[];
};

export const getMaintenanceRequests = async (userId: string, startDate: Date, endDate: Date): Promise<MaintenanceRequest[]> => {
  const requests = await queryDataInDateRange<MaintenanceRequest>(
    'maintenance_requests',
    startDate,
    endDate,
    'createdAt',
    { userId }
  )
  return requests.map((request: MaintenanceRequest) => ({
    ...request,
    createdAt: convertTimestampToDate(request.createdAt as Timestamp | Date)
  }))
};

export const modifyComplaintStatus = async (complaintId: string, status: Complaint['status'], adminResponse?: string) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, {
    status,
    adminResponse,
    updatedAt: new Date()
  });
};

export const updateSleepoverStatus = async (requestId: string, status: SleepoverRequest['status'], adminResponse?: string) => {
  const requestRef = doc(db, 'sleepover_requests', requestId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists()) {
    throw new Error('Sleepover request not found');
  }

  const request = requestSnap.data();
  const now = new Date();

  // Only include adminResponse in the update if it's provided
  const updateData: any = {
    status,
    updatedAt: now
  };

  if (adminResponse !== undefined) {
    updateData.adminResponse = adminResponse;
  }

  // If approved, set isActive to true
  if (status === 'approved') {
    updateData.isActive = true;
  }

  await updateDoc(requestRef, updateData);

  // Create notification for the user
  await createNotification({
    userId: request.userId,
    title: 'Sleepover Request Update',
    message: `Your sleepover request for ${request.guestName} has been ${status}`,
    type: 'sleepover',
    read: false
  });
};

export const updateMaintenanceRequestStatus = async (requestId: string, status: MaintenanceRequest['status'], adminResponse?: string) => {
  const requestRef = doc(db, 'maintenance_requests', requestId);
  await updateDoc(requestRef, {
    status,
    adminResponse,
    updatedAt: new Date()
  });
};

export const createGuestRegistration = async (registration: Omit<GuestRegistration, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse'>) => {
  const registrationsRef = collection(db, 'guest_registrations');
  const now = new Date();
  
  const docRef = await addDoc(registrationsRef, {
    ...registration,

    adminResponse: '',
    createdAt: now,
    updatedAt: now
  });

  return docRef.id;
};

export const getGuestRegistrations = async (userId: string) => {
  const registrationsRef = collection(db, 'guest_registrations');
  const registrationsQuery = query(registrationsRef, where('userId', '==', userId));
  const registrationsSnap = await getDocs(registrationsQuery);
  return registrationsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }) as GuestRegistration[];
};

export const updateRequestStatus = async (requestId: string, status: string) => {
  const requestRef = doc(db, 'requests', requestId);
  await updateDoc(requestRef, {
    status
  });
};

export const assignStaffToRequest = async (requestId: string, staffId: string) => {
  const requestRef = doc(db, 'requests', requestId);
  await updateDoc(requestRef, {
    staffId
  });
};

export async function getAllComplaints(): Promise<Complaint[]> {
  const complaintsRef = collection(db, 'complaints');
  const q = query(complaintsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date),
    updatedAt: convertTimestampToDate(doc.data().updatedAt as Timestamp | Date)
  })) as Complaint[];
}

export const updateComplaintStatus = async (
  complaintId: string,
  status: ComplaintStatus,
  adminResponse?: string
) => {
  const complaintRef = doc(db, 'complaints', complaintId)
  const updateData: any = {
    status,
    updatedAt: Timestamp.now()
  }
  
  if (adminResponse !== undefined) {
    updateData.adminResponse = adminResponse
  }
  
  await updateDoc(complaintRef, updateData)
}

export async function assignStaffToComplaint(complaintId: string, staffId: string) {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, {
    assignedStaffId: staffId,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'maintenance_requests'),
        orderBy('createdAt', 'desc')
      )
    );

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt) : undefined
      } as MaintenanceRequest;
    });
  } catch (error) {
    console.error('Error getting maintenance requests:', error);
    throw error;
  }
}

export async function getTodayMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'maintenance_requests'),
        where('createdAt', '>=', today),
        where('createdAt', '<', tomorrow),
        orderBy('createdAt', 'desc')
      )
    );

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt) : undefined
      } as MaintenanceRequest;
    });
  } catch (error) {
    console.error('Error getting today\'s maintenance requests:', error);
    throw error;
  }
}

export const getTodayManagementRequests = async (): Promise<ManagementRequest[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'management_requests'),
        where('createdAt', '>=', today),
        orderBy('createdAt', 'desc')
      )
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestampToDate(doc.data().createdAt)
    })) as ManagementRequest[];
  } catch (error) {
    console.error('Error getting today\'s management requests:', error);
    throw error;
  }
};

export const updateMaintenanceStatus = async (
  requestId: string, 
  status: MaintenanceStatus,
  adminResponse?: string
) => {
  const maintenanceRef = doc(db, 'maintenance_requests', requestId)
  await updateDoc(maintenanceRef, {
    status,
    adminResponse,
    updatedAt: Timestamp.now()
  })
}

export async function assignStaffToMaintenance(maintenanceId: string, staffId: string) {
  const maintenanceRef = doc(db, 'maintenance', maintenanceId);
  await updateDoc(maintenanceRef, {
    assignedStaffId: staffId,
    updatedAt: serverTimestamp(),
  });
}

export const getAllSleepoverRequests = async (): Promise<SleepoverRequest[]> => {
  const requestsRef = collection(db, 'sleepover_requests');
  const q = query(requestsRef, orderBy('createdAt', 'desc'));
  const requestsSnap = await getDocs(q);
  
  // Helper function to safely convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  return requestsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      signOutTime: data.signOutTime ? toDate(data.signOutTime) : undefined
    } as SleepoverRequest;
  });
};

export const getTodaySleepoverRequests = async () => {
  const requestsRef = collection(db, 'sleepover_requests');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const q = query(
    requestsRef,
    where('createdAt', '>=', today),
    where('createdAt', '<', tomorrow),
    orderBy('createdAt', 'desc')
  );
  
  const requestsSnap = await getDocs(q);
  
  // Helper function to safely convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  return requestsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      signOutTime: data.signOutTime ? toDate(data.signOutTime) : undefined
    };
  }) as SleepoverRequest[];
};

export async function getAllGuestRequests(): Promise<GuestRequest[]> {
  try {
    const guestRequestsRef = collection(db, 'guest_requests');
    const snapshot = await getDocs(guestRequestsRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
        roomNumber: data.roomNumber || '',
        purpose: data.purpose || '',
        fromDate: data.fromDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        tenantCode: data.tenantCode || '',
        userId: data.userId || '',
        createdAt: convertTimestampToDate(data.createdAt as Timestamp | Date),
        checkoutTime: data.checkoutTime ? convertTimestampToDate(data.checkoutTime as Timestamp | Date) : undefined
      } as GuestRequest;
    });
  } catch (error) {
    console.error('Error fetching all guest requests:', error);
    throw error;
  }
}

export async function updateGuestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  adminResponse: string
) {
  const guestRequestRef = doc(db, 'guest_requests', requestId);
  await updateDoc(guestRequestRef, {
    status,
    adminResponse,
    updatedAt: serverTimestamp(),
  });
}

//student api calls
export async function getMyComplaints(userId:string){
  const complaintsRef = collection(db, 'complaints');
  const q = query(complaintsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  }));
  
}

export async function getMySleepoverRequests(userId: string) {
  if (!userId) return [];
  
  try {
    const sleepoverRef = collection(db, 'sleepover_requests');
    const q = query(
      sleepoverRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    // Helper function to safely convert Firestore timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      if (timestamp instanceof Timestamp) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      return new Date(timestamp);
    };

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        tenantCode: data.tenantCode,
        guestName: data.guestName,
        guestSurname: data.guestSurname,
        guestPhoneNumber: data.guestPhoneNumber,
        roomNumber: data.roomNumber,
        additionalGuests: data.additionalGuests || [],
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        status: data.status || 'pending',
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        adminResponse: data.adminResponse,
        securityCode: data.securityCode,
        isActive: data.isActive,
        signOutTime: data.signOutTime ? toDate(data.signOutTime) : undefined,
        durationOfStay: data.durationOfStay
      } as SleepoverRequest;
    });
  } catch (error) {
    console.error('Error fetching sleepover requests:', error);
    throw error;
  }
}

export async function getMyGuestRequests(userId:string){
  const guestRef = collection(db, 'guest');
  const q = query(guestRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  }));
}

export async function getMyMaintenanceRequests(userId: string) {
  try {
    const maintenanceRef = collection(db, 'maintenance_requests')
    const q = query(
      maintenanceRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
      createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
    }))
  } catch (error) {
    console.error('Error getting user maintenance requests:', error)
    throw error
  }
}

export async function getRequestDetails(requestId: string) {
  // Implement the logic to fetch request details by ID
  // This is a placeholder implementation
  return {
    id: requestId,
    title: 'Sample Request',
    userName: 'John Doe',
    roomNumber: '101',
    description: 'Sample description',
    priority: 'High',
    status: 'pending',
  };
}

export async function setCheckoutCode(code: number) {
  const checkoutRef = doc(collection(db, 'checkout'));
  const now = new Date();
  await setDoc(checkoutRef, {
    code,
    createdAt: now,
  });
}

export async function getCheckoutCode() {
  const checkoutRef = collection(db, 'checkout');
  const querySnapshot = await getDocs(checkoutRef);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      code: doc.data().code.toString(), // Ensure the code is a string
      createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
    };
  }
  return null;
}

export async function updateCheckoutCode(newCode: number) {
  const checkoutRef = collection(db, 'checkout');
  const querySnapshot = await getDocs(checkoutRef);
  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      code: newCode,
      updatedAt: serverTimestamp(),
    });
  }
}

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => {
  const notificationsRef = collection(db, 'notifications');
  const now = new Date();
  
  const docRef = await addDoc(notificationsRef, {
    ...notification,
    createdAt: now,
    updatedAt: now
  });
  
  return { id: docRef.id, ...notification, createdAt: now, updatedAt: now } as Notification;
};

export const getUserNotifications = async (userId: string) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestampToDate(data.createdAt as Timestamp | Date),
      updatedAt: convertTimestampToDate(data.updatedAt as Timestamp | Date)
    };
  }) as Notification[];
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
    updatedAt: new Date()
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      read: true,
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
};

export async function getAnalyticsData(timeRange: "days" | "weeks" | "months") {
  const now = new Date();
  let startDate: Date;
  let dateFormat: string;

  // Calculate start date based on time range
  switch (timeRange) {
    case "days":
      startDate = new Date(now.setDate(now.getDate() - 14));
      dateFormat = "MMM dd";
      break;
    case "weeks":
      startDate = new Date(now.setDate(now.getDate() - 42)); // 6 weeks
      dateFormat = "MMM dd";
      break;
    case "months":
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      dateFormat = "MMM yyyy";
      break;
  }

  // Fetch data from all collections
  const [complaintsSnap, maintenanceSnap, sleepoverSnap, guestSnap] = await Promise.all([
    getDocs(query(collection(db, 'complaints'), where('createdAt', '>=', startDate))),
    getDocs(query(collection(db, 'maintenance_requests'), where('createdAt', '>=', startDate))),
    getDocs(query(collection(db, 'sleepover_requests'), where('createdAt', '>=', startDate))),
    getDocs(query(collection(db, 'guest_registrations'), where('createdAt', '>=', startDate)))
  ]);

  // Create a map to store aggregated data by date
  const dataMap = new Map<string, {
    complaints: number;
    maintenance: number;
    sleepover: number;
    guests: number;
  }>();

  // Initialize all dates in the range with zero counts
  let currentDate = new Date(startDate);
  while (currentDate <= new Date()) {
    const dateKey = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: timeRange === 'months' ? 'numeric' : undefined });
    dataMap.set(dateKey, { complaints: 0, maintenance: 0, sleepover: 0, guests: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Helper function to safely convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  // Aggregate complaints data
  complaintsSnap.docs.forEach(doc => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: timeRange === 'months' ? 'numeric' : undefined });
    const current = dataMap.get(dateKey) || { complaints: 0, maintenance: 0, sleepover: 0, guests: 0 };
    dataMap.set(dateKey, { ...current, complaints: current.complaints + 1 });
  });

  // Aggregate maintenance data
  maintenanceSnap.docs.forEach(doc => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: timeRange === 'months' ? 'numeric' : undefined });
    const current = dataMap.get(dateKey) || { complaints: 0, maintenance: 0, sleepover: 0, guests: 0 };
    dataMap.set(dateKey, { ...current, maintenance: current.maintenance + 1 });
  });

  // Aggregate sleepover data
  sleepoverSnap.docs.forEach(doc => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: timeRange === 'months' ? 'numeric' : undefined });
    const current = dataMap.get(dateKey) || { complaints: 0, maintenance: 0, sleepover: 0, guests: 0 };
    dataMap.set(dateKey, { ...current, sleepover: current.sleepover + 1 });
  });

  // Aggregate guest data
  guestSnap.docs.forEach(doc => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: timeRange === 'months' ? 'numeric' : undefined });
    const current = dataMap.get(dateKey) || { complaints: 0, maintenance: 0, sleepover: 0, guests: 0 };
    dataMap.set(dateKey, { ...current, guests: current.guests + 1 });
  });

  // Convert map to array and sort by date
  return Array.from(dataMap.entries())
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const getUserByTenantCode = async (tenantCode: string): Promise<FirestoreUser> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('tenant_code', '==', tenantCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Student not found');
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirestoreUser;
  } catch (error) {
    console.error('Error getting user by tenant code:', error);
    throw error;
  }
};

// Announcement-related functions
export const createAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>
) => {
  try {
    const announcementRef = collection(db, 'announcements');
    const newAnnouncement = {
      ...announcement,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || '',
      createdByName: auth.currentUser?.displayName || 'Unknown Admin',
      id: '',
      status: 'active' as const,
      isFirstTimeShown: false
    };

    const docRef = await addDoc(announcementRef, newAnnouncement);
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const getAnnouncements = async () => {
  try {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    // Helper function to safely convert Firestore timestamp to Date
    const toDate = (timestamp: any): Date | undefined => {
      if (!timestamp) return undefined;
      if (timestamp instanceof Timestamp) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      return new Date(timestamp);
    };
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt) || new Date(),
        expiresAt: toDate(data.expiresAt),
        isFirstTimeShown: data.isFirstTimeShown || false
      } as Announcement;
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

export const markAnnouncementAsShown = async (announcementId: string) => {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      isFirstTimeShown: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking announcement as shown:', error);
    throw error;
  }
};

// Report-related functions
export async function generateDailyReport(date: Date = new Date()): Promise<DailyReport> {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [sleepovers, maintenance, complaints] = await Promise.all([
      getSleepoversForDateRange(startOfDay, endOfDay),
      getMaintenanceForDateRange(startOfDay, endOfDay),
      getComplaintsForDateRange(startOfDay, endOfDay)
    ])

    return {
      date,
      sleepovers: {
        total: sleepovers.length,
        pending: sleepovers.filter(s => s.status === SleepoverStatus.PENDING).length,
        approved: sleepovers.filter(s => s.status === SleepoverStatus.APPROVED).length,
        denied: sleepovers.filter(s => s.status === SleepoverStatus.DENIED).length
      },
      maintenance: {
        total: maintenance.length,
        pending: maintenance.filter(m => m.status === MaintenanceStatus.PENDING).length,
        inProgress: maintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length,
        completed: maintenance.filter(m => m.status === MaintenanceStatus.COMPLETED).length
      },
      complaints: {
        total: complaints.length,
        pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
        resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length
      }
    }
  } catch (error) {
    console.error('Error generating daily report:', error)
    throw error
  }
}

export const generateDetailedReport = async (tenantCode: string, date: Date): Promise<DetailedReport> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get sleepovers with details
    const sleepoversRef = collection(db, 'tenants', tenantCode, 'sleepovers');
    const sleepoversQuery = query(
      sleepoversRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    const sleepoversSnapshot = await getDocs(sleepoversQuery);
    const sleepovers = sleepoversSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
        studentName: data.studentName || '',
        date: convertTimestampToDate(data.createdAt),
        status: data.status as SleepoverStatus,
        details: data.details || ''
      };
    });

    // Get maintenance requests with details
    const maintenanceRef = collection(db, 'tenants', tenantCode, 'maintenance');
    const maintenanceQuery = query(
      maintenanceRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    const maintenanceSnapshot = await getDocs(maintenanceQuery);
    const maintenance = maintenanceSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status as MaintenanceStatus,
        createdAt: convertTimestampToDate(data.createdAt)
      };
    });

    // Get complaints with details
    const complaintsRef = collection(db, 'tenants', tenantCode, 'complaints');
    const complaintsQuery = query(
      complaintsRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    const complaintsSnapshot = await getDocs(complaintsQuery);
    const complaints = complaintsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status as ComplaintStatus,
        createdAt: convertTimestampToDate(data.createdAt)
      };
    });

    return {
      date,
      sleepovers: {
        total: sleepovers.length,
        resolved: sleepovers.filter(s => s.status === SleepoverStatus.APPROVED).length,
        denied: sleepovers.filter(s => s.status === SleepoverStatus.DENIED).length,
        pending: sleepovers.filter(s => s.status === SleepoverStatus.PENDING).length,
        items: sleepovers
      },
      maintenance: {
        total: maintenance.length,
        pending: maintenance.filter(m => m.status === MaintenanceStatus.PENDING).length,
        inProgress: maintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length,
        completed: maintenance.filter(m => m.status === MaintenanceStatus.COMPLETED).length,
        items: maintenance
      },
      complaints: {
        total: complaints.length,
        pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
        resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
        items: complaints
      }
    };
  } catch (error) {
    console.error('Error generating detailed report:', error);
    throw error;
  }
};

export const signOutSleepoverGuest = async (requestId: string, securityCode: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'sleepover_requests', requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const request = requestDoc.data() as SleepoverRequest;

    // Check if the request is active
    if (!request.isActive) {
      throw new Error('Guest is not currently active');
    }

    // Use fixed PIN instead of checking against request's security code
    if (securityCode !== '3693') {
      throw new Error('Invalid security code');
    }

    // Update the request with sign-out time and inactive status
    await updateDoc(requestRef, {
      isActive: false,
      signOutTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Add to communication log using the correct function name
    await addCommunication(
      request.userId,
      `Guest ${request.guestName} ${request.guestSurname} signed out successfully`,
      'student'
    );
  } catch (error) {
    console.error('Error signing out sleepover guest:', error);
    throw error;
  }
};

export const getActiveSleepoverGuests = async (userId: string) => {
  const requestsRef = collection(db, 'sleepover_requests');
  const q = query(
    requestsRef,
    where('userId', '==', userId),
    where('status', '==', 'approved'),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date),
    updatedAt: convertTimestampToDate(doc.data().updatedAt as Timestamp | Date),
    startDate: convertTimestampToDate(doc.data().startDate as Timestamp | Date),
    endDate: convertTimestampToDate(doc.data().endDate as Timestamp | Date),
    signOutTime: doc.data().signOutTime ? convertTimestampToDate(doc.data().signOutTime as Timestamp | Date) : undefined
  })) as SleepoverRequest[];
};

export async function getAllGuestSignIns() {
  try {
    const querySnapshot = await getDocs(collection(db, 'guest_sign_ins'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
        guestName: data.guestName || '',
        guestSurname: data.guestSurname || '',
        tenantCode: data.tenantCode || '',
        roomNumber: data.roomNumber || '',
        guestPhoneNumber: data.guestPhoneNumber || '',
        signInTime: data.signInTime?.toDate() || new Date(),
        signOutTime: data.signOutTime?.toDate(),
        additionalGuests: data.additionalGuests || []
      };
    });
  } catch (error) {
    console.error('Error fetching guest sign-ins:', error);
    throw error;
  }
}

export async function updateGuestCheckout(guestId: string) {
  try {
    const guestRef = doc(db, 'guest_requests', guestId);
    await updateDoc(guestRef, {
      status: 'checked_out',
      checkoutTime: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating guest checkout:', error);
    throw error;
  }
}

export async function getUserMaintenanceRequests(userId: string) {
  try {
    const maintenanceRef = collection(db, 'maintenance_requests')
    const q = query(
      maintenanceRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
    }))
  } catch (error) {
    console.error('Error getting user maintenance requests:', error)
    throw error
  }
}

export async function updateMaintenanceRequest(requestId: string, data: {
  status?: string
  adminComment?: string
}) {
  try {
    const requestRef = doc(db, 'maintenance_requests', requestId)
    await updateDoc(requestRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating maintenance request:', error)
    throw error
  }
}

// Helper functions for date range queries
async function getSleepoversForDateRange(startDate: Date, endDate: Date): Promise<SleepoverRequest[]> {
  const sleepoversRef = collection(db, 'sleepover_requests')
  const q = query(
    sleepoversRef,
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  })) as SleepoverRequest[]
}

async function getMaintenanceForDateRange(startDate: Date, endDate: Date): Promise<MaintenanceRequest[]> {
  const maintenanceRef = collection(db, 'maintenance_requests')
  const q = query(
    maintenanceRef,
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  })) as MaintenanceRequest[]
}

async function getComplaintsForDateRange(startDate: Date, endDate: Date): Promise<Complaint[]> {
  const complaintsRef = collection(db, 'complaints')
  const q = query(
    complaintsRef,
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  })) as Complaint[]
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await deleteDoc(announcementRef);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw new Error('Failed to delete announcement');
  }
}

export async function updateAnnouncement(announcementId: string, data: Partial<Announcement>): Promise<void> {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw new Error('Failed to update announcement');
  }
}

export async function getAllApplications() {
  const applicationsRef = collection(db, 'applications');
  const q = query(applicationsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    createdAt: convertTimestampToDate(doc.data().createdAt as Timestamp | Date)
  }));
}

export async function approveApplication(applicationId: string, adminResponse: string) {
  const applicationRef = doc(db, 'applications', applicationId);
  await updateDoc(applicationRef, {
    status: 'approved',
    updatedAt: new Date(),
    adminResponse
  });
}

export async function rejectApplication(applicationId: string, adminResponse: string) {
  const applicationRef = doc(db, 'applications', applicationId);
  await updateDoc(applicationRef, {
    status: 'rejected',
    updatedAt: new Date(),
    adminResponse
  });
}

export async function approveSleepoverRequest(requestId: string, adminResponse: string) {
  const requestRef = doc(db, 'sleepover_requests', requestId);
  await updateDoc(requestRef, {
    status: 'approved',
    adminResponse,
    updatedAt: new Date(),
  });
}

export async function rejectSleepoverRequest(requestId: string, adminResponse: string) {
  const requestRef = doc(db, 'sleepover_requests', requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    adminResponse,
    updatedAt: new Date(),
  });
}

export async function createGuestRequest(data: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roomNumber: string;
  purpose: string;
  fromDate: string;
  tenantCode: string;
  userId: string;
  status: 'active' | 'checked_out';
  createdAt: Date;
}) {
  try {
    const guestRef = doc(collection(db, 'guest_requests'));
    await setDoc(guestRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return guestRef.id;
  } catch (error) {
    console.error('Error creating guest request:', error);
    throw error;
  }
}

export async function getUserActiveGuests(userId: string) {
  try {
    const guestsRef = collection(db, 'guest_requests');
    const q = query(
      guestsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt as Timestamp | Date),
        checkoutTime: data.checkoutTime?.toDate(),
        fromDate: data.fromDate || new Date().toISOString().split('T')[0]
      };
    });
  } catch (error) {
    console.error('Error fetching active guests:', error);
    throw error;
  }
}

export async function checkoutSleepoverGuest(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const sleepoverRef = collection(db, 'sleepover_requests');
    const q = query(
      sleepoverRef,
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );

  const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('No approved sleepover found');
    }

    // Find the most recent active sleepover
    const activeSleepover = querySnapshot.docs
      .map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
          guestName: data.guestName || '',
          startDate: convertTimestampToDate(data.startDate),
          endDate: convertTimestampToDate(data.endDate),
          signOutTime: data.signOutTime ? convertTimestampToDate(data.signOutTime) : undefined
        };
      })
      .find(sleepover => {
        const now = new Date();
        const isWithinDateRange = now >= sleepover.startDate && 
          now <= new Date(sleepover.endDate.getFullYear(), sleepover.endDate.getMonth(), sleepover.endDate.getDate(), 23, 59, 59);
        const notSignedOut = !sleepover.signOutTime;
        return isWithinDateRange && notSignedOut;
      });

    if (!activeSleepover) {
      throw new Error('No active sleepover found. Please ensure your sleepover request is approved and within the valid date range.');
    }

    // Update the sleepover request
    await updateDoc(doc(db, 'sleepover_requests', activeSleepover.id), {
      isActive: false,
      signOutTime: serverTimestamp(),
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    // Create a notification for the user
    await createNotification({
      userId,
      title: 'Sleepover Checkout',
      message: `Guest ${activeSleepover.guestName} has been checked out successfully`,
      type: 'sleepover',
      read: false
    });

    return {
      message: 'Guest checked out successfully',
      checkoutTime: new Date()
    };
  } catch (error) {
    console.error('Error checking out sleepover guest:', error);
    throw error;
  }
}

export async function approveManagementRequest(requestId: string, adminResponse: string) {
  const requestRef = doc(db, 'management_requests', requestId);
  await updateDoc(requestRef, {
    status: ManagementStatus.APPROVED,
    adminResponse,
    updatedAt: serverTimestamp()
  });
}

export async function rejectManagementRequest(requestId: string, adminResponse: string) {
  const requestRef = doc(db, 'management_requests', requestId);
  await updateDoc(requestRef, {
    status: ManagementStatus.REJECTED,
    adminResponse,
    updatedAt: serverTimestamp()
  });
}

export const getAllManagementRequests = async (): Promise<ManagementRequest[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'management_requests'),
      orderBy('createdAt', 'desc')
      )
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
      ...doc.data(),
      createdAt: convertTimestampToDate(doc.data().createdAt)
    })) as ManagementRequest[];
  } catch (error) {
    console.error('Error getting management requests:', error);
    throw error;
  }
};

export async function getAllStudents(): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive';
  room_number: string;
  tenant_code: string;
  phoneNumber: string;
  placeOfStudy: string;
}[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      firstName: doc.data().name || '',
      lastName: doc.data().surname || '',
      email: doc.data().email || '',
      status: 'active' as const,
      room_number: doc.data().room_number || '',
      tenant_code: doc.data().tenant_code || '',
      phoneNumber: doc.data().phone || '',
      placeOfStudy: doc.data().place_of_study || ''
    }));
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
}

export async function deactivateStudent(studentId: string) {
  try {
    const studentRef = doc(db, USERS_COLLECTION, studentId);
    await updateDoc(studentRef, {
      status: 'inactive',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deactivating student:', error);
    throw error;
  }
}