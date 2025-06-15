import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PresentationList from '../components/PresentationList';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">EduSlide</h1>
          <div>
            <span className="text-gray-700 mr-4">Hello, {user?.name} ({user?.role})</span>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
              Logout
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + Create New Presentation
            </button>
          </div>
          <p className="mt-2 text-gray-600">Welcome, {user?.name}!</p>
          <PresentationList 
            isCreateModalOpen={isCreateModalOpen}
            setCreateModalOpen={setCreateModalOpen}
          />
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;