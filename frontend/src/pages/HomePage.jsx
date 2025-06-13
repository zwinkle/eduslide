import React, { useState} from 'react';
import { useAuth } from '../context/AuthContext';
import PresentationList from '../components/PresentationList';

const HomePage = () => {
  const { user, logout } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState('');

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (sessionCode.trim()) {
      // Nanti kita akan implementasikan navigasi ke halaman sesi
      alert(`Joining session with code: ${sessionCode}`);
      // navigate(`/session/${sessionCode}`);
    }
  };

  const renderTeacherDashboard = () => (
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
      < PresentationList
        isCreateModalOpen={isCreateModalOpen}
        setCreateModalOpen={setCreateModalOpen}
      />
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="text-center">
      <h1 className="text-3xl font-bold">Join a Presentation</h1>
      <p className="mt-2 text-gray-600">Welcome, {user?.name}!</p>
      <div className="mt-8 max-w-md mx-auto">
        <form onSubmit={handleJoinSession} className="flex items-center bg-white p-2 rounded-lg shadow">
          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="flex-grow p-4 text-2xl font-bold tracking-widest text-center border-none focus:ring-0"
            maxLength="6"
          />
          <button type="submit" className="px-6 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">
            Join
          </button>
        </form>
        <p className="mt-4 text-gray-500">
          Your teacher will provide a code or a QR code to join the session.
        </p>
      </div>
    </div>
  );

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
        {user?.role === 'teacher' ? renderTeacherDashboard() : renderStudentDashboard()}
      </main>
    </div>
  );
};

export default HomePage;