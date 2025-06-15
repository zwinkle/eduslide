import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as sessionService from '../services/sessionService';

const PublicHomePage = () => {
    const [sessionCode, setSessionCode] = useState('');
    const [studentName, setStudentName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleJoinSession = async (e) => {
        e.preventDefault();
        setError('');
        if (!sessionCode.trim() || !studentName.trim()) {
            setError('Please enter a session code and your name.');
            return;
        }

        try {
            await sessionService.validateSession(sessionCode);
            // Kirim nama siswa ke halaman sesi melalui state
            navigate(`/session/${sessionCode}`, { state: { name: studentName } });
        } catch (err) {
            setError('Invalid session code. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="absolute top-0 right-0 p-6">
                <Link to="/login">
                    <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg shadow-sm hover:bg-gray-100">
                        Teacher / Admin Login
                    </button>
                </Link>
            </header>

            <main className="flex-grow flex items-center justify-center">
                <div className="text-center max-w-lg w-full px-4">
                    <h1 className="text-5xl font-bold text-gray-800">Welcome to EduSlide</h1>
                    <p className="mt-4 text-lg text-gray-600">The interactive presentation tool for modern classrooms.</p>
                    
                    <div className="mt-12 bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">Join a Session</h2>
                        <form onSubmit={handleJoinSession} className="space-y-4">
                            <div>
                                <label htmlFor="sessionCode" className="sr-only">Session Code</label>
                                <input
                                    type="text"
                                    id="sessionCode"
                                    value={sessionCode}
                                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER CODE"
                                    className="w-full p-4 text-2xl font-bold tracking-widest text-center border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    maxLength="6"
                                />
                            </div>
                             <div>
                                <label htmlFor="studentName" className="sr-only">Your Name</label>
                                <input
                                    type="text"
                                    id="studentName"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full p-3 text-lg text-center border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button type="submit" className="w-full px-6 py-4 bg-blue-500 text-white font-bold text-lg rounded-lg hover:bg-blue-600 transition-colors">
                                Join
                            </button>
                        </form>
                        <div className="mt-6">
                            <button className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                                Or Scan QR Code
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicHomePage;