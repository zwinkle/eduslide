import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as presentationService from '../services/presentationService';
import ThemeToggleButton from '../components/ThemeToggleButton';
import DrawingCanvas from '../components/DrawingCanvas';
import DrawingToolbar from '../components/DrawingToolbar';
import BubbleQuizDisplay from '../components/BubbleQuizDisplay';
import RandomPickerOverlay from '../components/RandomPickerOverlay';
import SessionSidebar from '../components/SessionSidebar';
import ConfirmationModal from '../components/ConfirmationModal';

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
    const [tool, setTool] = useState({ tool: 'pen', color: '#EF4444', strokeWidth: 5 });
    const [isBubbleQuizActive, setIsBubbleQuizActive] = useState(false);
    const [bubbleQuizClicks, setBubbleQuizClicks] = useState([]);
    const [pickerData, setPickerData] = useState(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    useEffect(() => {
        const element = slideContainerRef.current;
        if (!element) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setCanvasSize({ width, height });
                }
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
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
            socket.emit('teacher_join', { session_code: sessionCode });
        });
        socket.on('update_participant_list', (data) => setParticipants(data.participants));
        socket.on('update_leaderboard', (data) => setLeaderboardData(data));
        socket.on('update_poll_results', (results) => setPollResults(results));
        socket.on('update_wordcloud_results', (results) => setWordCloudResults(results));
        socket.on('update_bubble_quiz_results', (data) => setBubbleQuizClicks(data.clicks));
        socket.on('student_picked', (data) => setPickerData(data));
        return () => { socket.disconnect(); };
    }, [sessionCode]);

    const handleStartPresentation = () => {
        if (!socketRef.current) return;
        setIsStarted(true);
        socketRef.current.emit('start_presentation', { session_code: sessionCode });
    };

    const handleSlideChange = (newPageNumber) => {
        if (!socketRef.current || !presentation) return;
        if (newPageNumber > 0 && newPageNumber <= presentation.slides.length) {
            setCurrentPage(newPageNumber);
            setIsQuizActive(false);
            setIsPollActive(false);
            setPollResults(null);
            setIsWordCloudActive(false);
            setWordCloudResults(null);
            setIsDrawingActive(false);
            setIsBubbleQuizActive(false);
            setBubbleQuizClicks([]);
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

    const handleStartActivity = () => {
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!socketRef.current || !currentSlide || !currentSlide.interactive_type) return;
        const type = currentSlide.interactive_type;
        const eventName = `start_${type}`;
        if (type === 'quiz') setIsQuizActive(true);
        if (type === 'poll') { setIsPollActive(true); setPollResults(null); }
        if (type === 'word_cloud') { setIsWordCloudActive(true); setWordCloudResults(null); }
        if (type === 'bubble_quiz') { setIsBubbleQuizActive(true); setBubbleQuizClicks([]); }
        socketRef.current.emit(eventName, { session_code: sessionCode, slide_id: currentSlide.id });
    };
    
    const handleToggleDrawing = () => {
        const newDrawingState = !isDrawingActive;
        setIsDrawingActive(newDrawingState);
        const currentSlideId = presentation?.slides.find(s => s.page_number === currentPage)?.id;
        if (newDrawingState) {
            socketRef.current.emit('start_drawing', { session_code: sessionCode, lines: drawings[currentSlideId] || [], slide_id: currentSlideId });
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
            newLines.push({ tool: tool.tool, color: tool.color, strokeWidth: tool.strokeWidth / canvasSize.width, points: [data.point.x, data.point.y] });
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

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
    }

    const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
    const slideImageUrl = currentSlide ? `${api.defaults.baseURL}/${currentSlide.content_url}` : '';

    if (!isStarted) {
        const qrCodeUrl = `${api.defaults.baseURL}/presentations/sessions/${sessionCode}/qr`;
        return (
            <div className="flex flex-col md:flex-row h-screen bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
                <div className="absolute top-4 right-4 flex gap-4">
                    <ThemeToggleButton />
                    <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                </div>

                <div className="w-full md:w-2/3 flex flex-col items-center justify-center p-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Lobby Room</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 text-center">"{presentation?.title}"</p>
                    
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-8 bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md">
                        <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400">Share this code:</p>
                            <p className="text-6xl font-bold tracking-widest my-2 text-blue-600 dark:text-blue-400">{sessionCode}</p>
                        </div>
                        <div className="border-t-2 sm:border-t-0 sm:border-l-2 border-gray-200 dark:border-gray-600 pt-8 sm:pt-0 sm:pl-8">
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-2">Or scan QR code:</p>
                            <div className="p-2 bg-white rounded-md">
                                <img src={qrCodeUrl} alt={`QR Code for session ${sessionCode}`} className="w-40 h-40" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleStartPresentation} className="mt-8 px-10 py-4 text-2xl bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600">
                        Start Presentation
                    </button>
                </div>
                <aside className="w-full md:w-1/3 bg-white dark:bg-gray-800 p-6 border-t-2 md:border-t-0 md:border-l-2 border-gray-300 dark:border-gray-700 overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Participants ({participants.length})</h2>
                    <ul className="space-y-2">
                        {participants.length > 0 ? (
                            participants.map((participant, index) => (
                                <li key={participant.student_id || index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-100">
                                    {participant.name}
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Waiting for participants to join...</p>
                        )}
                    </ul>
                </aside>
            </div>
        );
    }

    const getActiveActivityType = () => {
        if (isQuizActive) return 'quiz';
        if (isPollActive) return 'poll';
        if (isWordCloudActive) return 'word_cloud';
        if (isBubbleQuizActive) return 'bubble_quiz';
        return null;
    };

    const renderActivityButton = () => {
        if (!currentSlide?.interactive_type) return null;

        const type = currentSlide.interactive_type;
        const config = {
            quiz: { text: 'Start Quiz', color: 'bg-yellow-500 hover:bg-yellow-600', active: isQuizActive },
            poll: { text: 'Start Poll', color: 'bg-purple-600 hover:bg-purple-700', active: isPollActive },
            word_cloud: { text: 'Start Word Cloud', color: 'bg-teal-600 hover:bg-teal-700', active: isWordCloudActive },
            bubble_quiz: { text: 'Start Bubble Quiz', color: 'bg-pink-600 hover:bg-pink-700', active: isBubbleQuizActive },
        };

        const currentConfig = config[type];
        if (!currentConfig || currentConfig.active) {
            return null;
        }

        return (
            <button onClick={handleStartActivity} className={`px-4 py-2 text-white font-bold rounded-lg text-sm ${currentConfig.color}`}>
                {currentConfig.text}
            </button>
        );
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white">
            <SessionSidebar 
                participants={participants} 
                leaderboardData={leaderboardData}
                activeActivityType={getActiveActivityType()}
                pollResults={pollResults}
                wordCloudResults={wordCloudResults}
            />
            <ConfirmationModal isOpen={showEndConfirm} onClose={() => setShowEndConfirm(false)} onConfirm={handleCloseSession} title="End Session?">
                <p>Are you sure you want to end this session?</p>
            </ConfirmationModal>
            {pickerData && <RandomPickerOverlay data={pickerData} onAnimationEnd={() => setPickerData(null)} />}
            
            <header className="bg-white dark:bg-gray-800 shadow-md p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">

                    <button onClick={() => setShowEndConfirm(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">End Session</button>
                    <button onClick={handlePickStudent} disabled={participants.length === 0} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400 text-sm">Pick Student</button>
                    <button onClick={handleToggleDrawing} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">{isDrawingActive ? 'Hide Canvas' : 'Show Canvas'}</button>
                    
                    {renderActivityButton()}
                </div>
                <h1 className="text-lg font-bold truncate" title={presentation?.title}>{presentation?.title}</h1>
                <div className="flex items-center gap-4">
                    <div className="text-center"><span className="text-sm text-gray-500 dark:text-gray-400">Session Code</span><p className="text-2xl font-bold tracking-widest text-blue-600 dark:text-blue-400">{sessionCode}</p></div>
                    <ThemeToggleButton />
                </div>
            </header>

            <main className="flex-grow p-4 flex justify-center relative">
                <div ref={slideContainerRef} className="w-full max-w-6xl aspect-video bg-black flex items-center justify-center relative">
                    <img src={slideImageUrl} alt={`Slide ${currentPage}`} className="max-w-full max-h-full object-contain"/>
                    
                    {isDrawingActive && (
                        <div className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair">
                            <DrawingToolbar tool={tool} setTool={setTool} onClear={handleClearCanvas} />
                            <DrawingCanvas onDraw={handleDraw} lines={drawings[currentSlide?.id] || []} width={canvasSize.width} height={canvasSize.height}/>
                        </div>
                    )}

                    {isBubbleQuizActive && (
                        <div className="absolute top-0 left-0 w-full h-full z-10">
                            <BubbleQuizDisplay clicks={bubbleQuizClicks} correctAreas={currentSlide?.settings?.correct_areas || []} width={canvasSize.width} height={canvasSize.height}/>
                        </div>
                    )}
                </div>
            </main>
            
            <footer className="bg-white dark:bg-gray-800 p-2 flex justify-center items-center gap-4 shadow-inner">
                <button onClick={() => handleSlideChange(currentPage - 1)} disabled={currentPage <= 1} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">Previous</button>
                <span className="font-semibold">{currentPage} / {presentation?.slides.length}</span>
                <button onClick={() => handleSlideChange(currentPage + 1)} disabled={currentPage >= presentation?.slides.length} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">Next</button>
            </footer>
        </div>
    );
};

export default PresenterView;