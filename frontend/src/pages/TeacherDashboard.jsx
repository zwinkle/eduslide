import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PresentationList from '../components/PresentationList';
import ThemeToggleButton from '../components/ThemeToggleButton';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">EduSlide</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">Hello, {user?.name}</span>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Logout
            </button>
            <ThemeToggleButton />
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