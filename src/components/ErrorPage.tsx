import React from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  statusCode: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode }) => {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return 'The page you are looking for does not exist.';
      case 500:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">{statusCode}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {statusCode === 404 ? 'Page Not Found' : 'Error'}
        </h2>
        <p className="text-gray-600 mb-8">{getErrorMessage()}</p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export { ErrorPage };
