import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as sessionService from '../services/sessionService';
import * as presentationService from '../services/presentationService';
import PollResultsChart from '../components/PollResultsChart';

const SessionPage = () => {
    const { sessionCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const studentName = location.state?.name || 'Guest';

    const [presentation, setPresentation] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [activePoll, setActivePoll] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [pollResults, setPollResults] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const sessionResponse = await sessionService.validateSession(sessionCode);
                const presentationId = sessionResponse.data.presentation_id;
                const presentationResponse = await presentationService.getPresentationById(presentationId);
                setPresentation(presentationResponse.data);
            } catch (err) {
                setError('Could not load session. The code might be invalid or expired.');
            } finally {
                setLoading(false);
            }
        };
        fetchSessionData();

        const socket = io('http://127.0.0.1:8000');
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join_session', { 
                session_code: sessionCode, 
                name: studentName 
            });
        });
        
        socket.on('slide_changed', (data) => {
            setCurrentPage(data.page_number);
            setActivePoll(null); 
            setHasVoted(false);
            setPollResults(null);
        });
        
        socket.on('poll_started', (pollData) => {
            setActivePoll(pollData);
            setHasVoted(false);
            setPollResults(null);
        });

        socket.on('update_poll_results', (results) => {
            setPollResults(results);
        });

        socket.on('session_ended', (data) => {
            alert(data.message);
            navigate('/');
        });

        socket.on('disconnect', () => setIsConnected(false));

        return () => {
            socket.disconnect();
        };
    }, [sessionCode, studentName, navigate]);

    const handleVoteSubmit = (option) => {
        if (!activePoll || hasVoted || !socketRef.current) {
            console.error("Vote submission failed. Conditions not met.", { activePoll, hasVoted, socket: socketRef.current });
            return;
        }

        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!currentSlide) return;
        
        // INI PERBAIKAN KUNCI: Gunakan socketRef.current yang sudah ada
        socketRef.current.emit('submit_vote', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
            option: option
        });
        
        setHasVoted(true);
    };
    
    if (loading) return <div className="flex items-center justify-center min-h-screen text-2xl font-semibold">Joining session...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    if (currentPage === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <h1 className="text-4xl font-bold text-gray-800">You're in!</h1>
                <p className="mt-2 text-xl text-gray-600">Welcome, <strong>{studentName}</strong>!</p>
                <div className="mt-8 text-center">
                    <p className="text-lg">Waiting for the teacher to start the presentation...</p>
                    <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
    const slideImageUrl = currentSlide ? `${api.defaults.baseURL}/${currentSlide.content_url}` : '';

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="p-3 bg-black bg-opacity-30 text-center">
                <h1 className="text-lg font-semibold truncate" title={presentation?.title}>
                    {presentation?.title || 'Loading title...'}
                </h1>
                <p className="text-xs text-gray-400">
                    Session Code: <strong>{sessionCode}</strong> | Status: 
                    <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {isConnected ? ' CONNECTED' : ' DISCONNECTED'}
                    </span>
                </p>
            </header>

            <main className="flex-grow p-4 flex items-center justify-center">
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                    {slideImageUrl && <img src={slideImageUrl} alt={`Slide ${currentPage}`} className="max-w-full max-h-full object-contain"/>}

                    {activePoll && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-8 animate-fade-in">
                            <h2 className="text-4xl font-bold mb-8 text-center">{activePoll.question}</h2>
                            
                            {!hasVoted ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                                    {activePoll.options.map((option, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => handleVoteSubmit(option)}
                                            className="p-6 bg-blue-600 rounded-lg text-2xl hover:bg-blue-500 transition-transform transform hover:scale-105"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center w-full max-w-3xl p-4 bg-gray-800 rounded-lg">
                                    <p className="text-2xl text-green-400 mb-4">Thank you for voting! Here are the live results:</p>
                                    {pollResults ? <PollResultsChart results={pollResults} /> : <p>Waiting for results...</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <footer className="p-2 bg-black bg-opacity-30">
                <p className="text-center font-bold text-xl">Slide {currentPage} / {presentation?.slides.length || '...'}</p>
            </footer>
        </div>
    );
};

export default SessionPage;