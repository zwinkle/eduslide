import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SessionPage from './pages/SessionPage';
import PresenterView from './pages/PresenterView';

import TeacherDashboard from './pages/TeacherDashboard';
import PublicHomePage from './pages/PublicHomePage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/session/:sessionCode" element={<SessionPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/presenter/:presentationId/session/:sessionCode" element={<PresenterView />} />
      </Route>

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;