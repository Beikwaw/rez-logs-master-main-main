import React from 'react';
import { FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';

const ContactInfo = () => {
  const contactInfo = [
    {
      title: 'Maintenance',
      email: 'maintenance@mydomain.co.za',
      phone: '011 234 5678'
    },
    {
      title: 'Security',
      email: 'security@mydomain.co.za',
      phone: '011 234 5679'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h2>
      <div className="space-y-4">
        {contactInfo.map((contact, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="text-blue-600 mt-1">
              {contact.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-700">{contact.title}</h3>
              {contact.email ? (
                <a 
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {contact.email}
                </a>
              ) : (
                <a 
                  href={`tel:${contact.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {contact.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactInfo; 