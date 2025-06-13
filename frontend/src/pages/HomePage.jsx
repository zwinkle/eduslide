import React from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome to EduSlide, {user?.name}!</h1>
      <p className="mt-2">Your role is: {user?.role}</p>
      <button 
        onClick={logout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
        Logout
      </button>
    </div>
  );
};

export default HomePage;