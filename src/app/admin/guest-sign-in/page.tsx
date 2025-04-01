'use client';

import { useState, useEffect } from 'react';
import { getAllGuestSignIns, getTodayGuestSignIns, signOutGuest } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminGuestSignInPage() {
  const { user } = useAuth();
  const [signIns, setSignIns] = useState([]);
  const [todaySignIns, setTodaySignIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignIn, setSelectedSignIn] = useState(null);
  const [signOutCode, setSignOutCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSignIns();
    }
  }, [user]);

  const fetchSignIns = async () => {
    try {
      const [allSignIns, today] = await Promise.all([
        getAllGuestSignIns(),
        getTodayGuestSignIns()
      ]);
      setSignIns(allSignIns);
      setTodaySignIns(today);
    } catch (err) {
      setError('Failed to fetch guest sign-ins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!selectedSignIn || !signOutCode) return;

    try {
      await signOutGuest(selectedSignIn.id, signOutCode);
      toast.success('Guest signed out successfully');
      setSelectedSignIn(null);
      setSignOutCode('');
      fetchSignIns();
    } catch (err) {
      toast.error('Failed to sign out guest');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const displaySignIns = showHistory ? signIns : todaySignIns;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Guest Sign-In Management</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showHistory ? 'Show Today\'s Sign-Ins' : 'Show History'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {displaySignIns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {showHistory ? 'No guest sign-ins found.' : 'No guest sign-ins for today.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displaySignIns.map((signIn) => (
            <div
              key={signIn.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {signIn.guestName} {signIn.guestSurname}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Tenant Code</p>
                      <p>{signIn.tenantCode}</p>
                    </div>
                    <div>
                      <p className="font-medium">Room Number</p>
                      <p>{signIn.roomNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Phone Number</p>
                      <p>{signIn.guestPhoneNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Sign-In Time</p>
                      <p>{format(signIn.signInTime, 'PPP p')}</p>
                    </div>
                    {signIn.signOutTime && (
                      <div>
                        <p className="font-medium">Sign-Out Time</p>
                        <p>{format(signIn.signOutTime, 'PPP p')}</p>
                      </div>
                    )}
                  </div>

                  {signIn.additionalGuests && signIn.additionalGuests.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Additional Guests</h3>
                      <ul className="list-disc list-inside">
                        {signIn.additionalGuests.map((guest, index) => (
                          <li key={index}>
                            {guest.name} {guest.surname} - {guest.phoneNumber}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      signIn.signOutTime
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {signIn.signOutTime ? 'Signed Out' : 'Active'}
                  </span>
                </div>
              </div>

              {!signIn.signOutTime && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedSignIn(signIn)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Sign Out Guest
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sign Out Modal */}
      {selectedSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Sign Out Guest</h3>
            <p className="mb-4">
              Please enter the security code to sign out {selectedSignIn.guestName} {selectedSignIn.guestSurname}
            </p>
            <input
              type="text"
              value={signOutCode}
              onChange={(e) => setSignOutCode(e.target.value)}
              placeholder="Enter security code"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedSignIn(null);
                  setSignOutCode('');
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 