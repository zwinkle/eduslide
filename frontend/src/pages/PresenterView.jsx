// frontend/src/pages/PresenterView.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as presentationService from '../services/presentationService';
import PollResultsChart from '../components/PollResultsChart';

const PresenterView = () => {
    const { presentationId, sessionCode } = useParams();
    const navigate = useNavigate();

    const [presentation, setPresentation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socketRef = useRef(null);

    const [participants, setParticipants] = useState([]);
    const [isStarted, setIsStarted] = useState(false);
    
    const [isPollActive, setIsPollActive] = useState(false);
    const [pollResults, setPollResults] = useState(null);

    useEffect(() => {
        const fetchPresentation = async () => {
            try {
                const response = await presentationService.getPresentationById(presentationId);
                setPresentation(response.data);
            } catch (err) {
                setError('Failed to load presentation data.');
            } finally {
                setLoading(false);
            }
        };
        fetchPresentation();
    }, [presentationId]);

    useEffect(() => {
        const socket = io('http://127.0.0.1:8000');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Presenter connected!');
            socket.emit('teacher_join', { session_code: sessionCode });
        });

        socket.on('update_participant_list', (data) => {
            setParticipants(data.participants);
        });

        // PERBAIKAN KUNCI: Pastikan guru juga mendengarkan update hasil
        socket.on('update_poll_results', (results) => {
            console.log("Presenter received results:", results); // Tambahkan log untuk debug
            setPollResults(results);
        });

        return () => {
            socket.disconnect();
        };
    }, [sessionCode]);

    const handleStartPresentation = () => {
        if (!socketRef.current) return;
        setIsStarted(true);
        socketRef.current.emit('start_presentation', { session_code: sessionCode });
    };

    const handleSlideChange = (newPageNumber) => {
        if (!socketRef.current || !sessionCode || !presentation) return;
        
        if (newPageNumber > 0 && newPageNumber <= presentation.slides.length) {
            setCurrentPage(newPageNumber);
            setIsPollActive(false);
            setPollResults(null); // Reset hasil saat ganti slide
            socketRef.current.emit('change_slide', {
                session_code: sessionCode,
                page_number: newPageNumber,
            });
        }
    };
    
    const handleCloseSession = () => {
        if (socketRef.current) {
            socketRef.current.emit('end_session', { session_code: sessionCode });
        }
        navigate('/dashboard');
    };

    const handleStartPoll = () => {
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!socketRef.current || !currentSlide) return;

        setIsPollActive(true);
        setPollResults(null); // Reset hasil saat poll dimulai
        socketRef.current.emit('start_poll', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
        });
    };

    if (loading) return <div className="text-center p-10">Loading Presenter View...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    if (!isStarted) {
        const qrCodeUrl = `${api.defaults.baseURL}/presentations/sessions/${sessionCode}/qr`;
        return (
            <div className="flex h-screen bg-gray-200">
                <div className="w-2/3 flex flex-col items-center justify-center p-8">
                    <h1 className="text-3xl font-bold text-gray-800">Lobby Room</h1>
                    <p className="text-lg text-gray-600 mt-2">"{presentation?.title}"</p>
                    <div className="mt-8 flex items-center gap-8 bg-white p-8 rounded-lg shadow-md">
                        <div className="text-center">
                            <p className="text-gray-500">Share this code:</p>
                            <p className="text-6xl font-bold tracking-widest my-2 text-blue-600">{sessionCode}</p>
                        </div>
                        <div className="border-l-2 pl-8">
                             <p className="text-gray-500 text-center mb-2">Or scan QR code:</p>
                             <img src={qrCodeUrl} alt={`QR Code for session ${sessionCode}`} className="w-40 h-40" />
                        </div>
                    </div>
                    <button onClick={handleStartPresentation} className="mt-8 px-10 py-4 text-2xl bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600">Start Presentation</button>
                </div>
                <aside className="w-1/3 bg-white p-6 border-l overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-4">Participants ({participants.length})</h2>
                    <ul className="space-y-2">
                        {participants.length > 0 ? (participants.map((name, index) => (<li key={index} className="bg-gray-100 p-3 rounded-md">{name}</li>))) : (<p className="text-gray-500">Waiting for participants to join...</p>)}
                    </ul>
                </aside>
            </div>
        );
    }

    const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
    const slideImageUrl = currentSlide ? `${api.defaults.baseURL}/${currentSlide.content_url}` : '';
    
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <header className="bg-white shadow-md p-2 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={handleCloseSession} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">End Session</button>
                    <h1 className="text-lg font-bold truncate" title={presentation.title}>{presentation.title}</h1>
                </div>
                <div className="text-center">
                    <span className="text-sm text-gray-500">Session Code</span>
                    <p className="text-2xl font-bold tracking-widest text-blue-600">{sessionCode}</p>
                </div>
            </header>

            <main className="flex-grow p-4 flex items-center justify-center relative">
                {isStarted && currentSlide?.interactive_type === 'poll' && (
                    <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg w-80">
                        <h4 className="font-bold text-lg mb-2">Poll Control</h4>
                        {!isPollActive ? (
                            <button onClick={handleStartPoll} className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">Start Poll</button>
                        ) : (
                             <div>
                                <p className="text-sm text-green-600 font-bold mb-2">Poll is live! Results:</p>
                                {pollResults ? <PollResultsChart results={pollResults} /> : <p className="text-sm text-gray-500">Waiting for first vote...</p>}
                             </div>
                        )}
                    </div>
                )}
                
                <div className="w-full h-full bg-black flex items-center justify-center">
                    {slideImageUrl ? (
                        <img src={slideImageUrl} alt={`Slide ${currentPage}`} className="max-w-full max-h-full object-contain"/>
                    ) : (
                        <p className="text-white">Slide content not available.</p>
                    )}
                </div>
            </main>

            <footer className="bg-white p-2 flex justify-center items-center gap-4">
                <button onClick={() => handleSlideChange(currentPage - 1)} disabled={currentPage <= 1} className="px-6 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <span className="font-semibold">{currentPage} / {presentation.slides.length}</span>
                <button onClick={() => handleSlideChange(currentPage + 1)} disabled={currentPage >= presentation.slides.length} className="px-6 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                </button>
            </footer>
        </div>
    );
};

export default PresenterView;