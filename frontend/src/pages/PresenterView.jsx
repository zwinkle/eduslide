// frontend/src/pages/PresenterView.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as presentationService from '../services/presentationService';
import ThemeToggleButton from '../components/ThemeToggleButton'; 
import PollResultsChart from '../components/PollResultsChart';
import WordCloudDisplay from '../components/WordCloudDisplay';
import DrawingCanvas from '../components/DrawingCanvas';
import DrawingToolbar from '../components/DrawingToolbar';
import RandomPickerOverlay from '../components/RandomPickerOverlay';
import LeaderboardDisplay from '../components/LeaderboardDisplay';
import SessionSidebar from '../components/SessionSidebar';

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

    const [isQuizActive, setIsQuizActive] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    
    const [isPollActive, setIsPollActive] = useState(false);
    const [pollResults, setPollResults] = useState(null);

    const [isWordCloudActive, setIsWordCloudActive] = useState(false);
    const [wordCloudResults, setWordCloudResults] = useState(null);

    const [isDrawingActive, setIsDrawingActive] = useState(false);
    const [drawings, setDrawings] = useState({});
    const slideContainerRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [tool, setTool] = useState({ color: '#000000', strokeWidth: 5 });

    const [pickerData, setPickerData] = useState(null);

    useEffect(() => {
        const checkSize = () => {
            if (slideContainerRef.current) {
                setCanvasSize({
                    width: slideContainerRef.current.offsetWidth,
                    height: slideContainerRef.current.offsetHeight,
                });
            }
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, [isStarted]);
    
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

        socket.on('update_leaderboard', (data) => {
            setLeaderboardData(data);
        });

        socket.on('update_poll_results', (results) => {
            setPollResults(results);
        });

        socket.on('update_wordcloud_results', (results) => {
            setWordCloudResults(results);
        });

        socket.on('student_picked', (data) => {
            setPickerData(data);
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
            
            setIsQuizActive(false);
            // setLeaderboardData([]);
            setIsPollActive(false); 
            setPollResults(null);
            setIsWordCloudActive(false);
            setWordCloudResults(null);
            setIsDrawingActive(false);
            // setLines([]);
    
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

    const handleStartQuiz = () => {
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!socketRef.current || !currentSlide) return;

        setIsQuizActive(true);
        socketRef.current.emit('start_quiz', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
        });
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

    const handleStartWordCloud = () => {
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!socketRef.current || !currentSlide) return;
        setIsWordCloudActive(true);
        socketRef.current.emit('start_wordcloud', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
        });
    };

    const handleToggleDrawing = () => {
        const newDrawingState = !isDrawingActive;
        setIsDrawingActive(newDrawingState);
        if (newDrawingState) {
            const currentSlideId = presentation?.slides.find(s => s.page_number === currentPage)?.id;
            socketRef.current.emit('start_drawing', { session_code: sessionCode, lines: drawings[currentSlideId] || [] });
        } else {
            socketRef.current.emit('hide_drawing', { session_code: sessionCode });
        }
    };

    const handleDraw = (data) => {
        const currentSlideId = presentation?.slides.find(s => s.page_number === currentPage)?.id;
        if (!canvasSize.width || !currentSlideId) return;

        const currentLines = drawings[currentSlideId] || [];
        let newLines = [...currentLines];
        
        if (data.type === 'start') {
            newLines.push({
                tool: tool.tool,
                color: tool.color,
                strokeWidth: tool.strokeWidth / canvasSize.width, // Normalisasi dengan canvasSize.width
                points: [data.point.x, data.point.y],
            });
        } else if (data.type === 'draw' && newLines.length > 0) {
            let lastLine = newLines[newLines.length - 1];
            if (lastLine) {
                lastLine.points = lastLine.points.concat([data.point.x, data.point.y]);
            }
        }
        
        setDrawings(prev => ({ ...prev, [currentSlideId]: newLines }));
        const lastLineData = newLines[newLines.length - 1];
        socketRef.current.emit('drawing_event', { session_code: sessionCode, drawData: {type: data.type, line: lastLineData, slide_id: currentSlideId} });
    };

    const handleClearCanvas = () => {
        const currentSlideId = presentation?.slides.find(s => s.page_number === currentPage)?.id;
        if (!socketRef.current || !currentSlideId) return;
        setDrawings(prev => ({ ...prev, [currentSlideId]: [] }));
        socketRef.current.emit('clear_canvas', { session_code: sessionCode, slide_id: currentSlideId });
    };

    const handlePickStudent = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('pick_random_student', { session_code: sessionCode });
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
        <div className="flex flex-col h-screen bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white">
            <SessionSidebar participants={participants} leaderboardData={leaderboardData} />
            <header className="bg-white dark:bg-gray-800 shadow-md p-2 flex justify-between items-center">
                {pickerData && <RandomPickerOverlay data={pickerData} onAnimationEnd={() => setPickerData(null)} />}
                <div className="flex items-center gap-4">
                    <button onClick={handleCloseSession} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">End Session</button>
                    <button 
                        onClick={handlePickStudent} 
                        disabled={participants.length === 0}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
                    >
                        Pick Student
                    </button>
                    <button onClick={handleToggleDrawing} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                        {isDrawingActive ? 'Hide Canvas' : 'Show Canvas'}
                    </button>
                </div>
                <h1 className="text-lg font-bold truncate" title={presentation.title}>{presentation.title}</h1>
                <div className="flex items-center gap-4">
                     <div className="text-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Session Code</span>
                        <p className="text-2xl font-bold tracking-widest text-blue-600 dark:text-blue-400">{sessionCode}</p>
                    </div>
                    <ThemeToggleButton />
                </div>
            </header>

            <main className="flex-grow p-4 flex items-center justify-center relative">
                {isStarted && currentSlide?.interactive_type === 'quiz' && (
                    <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg w-80">
                        <h4 className="font-bold text-lg mb-2">Quiz Control</h4>
                        {!isQuizActive ? (
                            <button onClick={handleStartQuiz} className="w-full px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600">Start Quiz</button>
                        ) : (
                             <div>
                                <p className="text-sm text-green-600 font-bold mb-2">Quiz is live!</p>
                             </div>
                        )}
                    </div>
                )}
                
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

                {isStarted && currentSlide?.interactive_type === 'word_cloud' && (
                    <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg w-80">
                        <h4 className="font-bold text-lg mb-2">Word Cloud Control</h4>
                        {!isWordCloudActive ? (
                            <button onClick={handleStartWordCloud} className="w-full px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Start Word Cloud</button>
                        ) : (
                            <div>
                                <p className="text-sm text-green-600 font-bold mb-2">Word Cloud is live!</p>
                                {wordCloudResults ? <WordCloudDisplay results={wordCloudResults} /> : <p className="text-sm text-gray-500">Waiting for submissions...</p>}
                            </div>
                        )}
                    </div>
                )}
                
                <div ref={slideContainerRef} className="w-full bg-black flex items-center justify-center aspect-video relative">
                    <img src={slideImageUrl} alt={`Slide ${currentPage}`} className="max-w-full max-h-full object-contain"/>

                    {isDrawingActive && (
                        <>
                            <DrawingToolbar tool={tool} setTool={setTool} onClear={handleClearCanvas} />
                            <div className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair">
                                <DrawingCanvas 
                                    onDraw={handleDraw} 
                                    lines={drawings[currentSlide?.id] || []}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>

            <footer className="bg-white dark:bg-gray-800 p-2 flex justify-center items-center gap-4 shadow-inner">
                <button
                    onClick={() => handleSlideChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="font-semibold">{currentPage} / {presentation.slides.length}</span>
                <button
                    onClick={() => handleSlideChange(currentPage + 1)}
                    disabled={currentPage >= presentation.slides.length}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </footer>
        </div>
    );
};

export default PresenterView;