// frontend/src/pages/SessionPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Stage } from 'react-konva';
import io from 'socket.io-client';
import api from '../services/api';
import * as sessionService from '../services/sessionService';
import * as presentationService from '../services/presentationService';
import ThemeToggleButton from '../components/ThemeToggleButton';
import SessionSidebar from '../components/SessionSidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import RandomPickerOverlay from '../components/RandomPickerOverlay';
import PollResultsChart from '../components/PollResultsChart';
import WordCloudDisplay from '../components/WordCloudDisplay';
import DrawingCanvas from '../components/DrawingCanvas';
import BubbleQuizDisplay from '../components/BubbleQuizDisplay';
import LeaderboardDisplay from '../components/LeaderboardDisplay';

const SessionPage = () => {
    const { sessionCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const studentName = location.state?.name || 'Guest';

    // State utama
    const [presentation, setPresentation] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    
    // State untuk semua jenis aktivitas
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [pickerData, setPickerData] = useState(null);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState(null);
    const [activePoll, setActivePoll] = useState(null);
    const [hasVotedPoll, setHasVotedPoll] = useState(false);
    const [pollResults, setPollResults] = useState(null);
    const [activeWordCloud, setActiveWordCloud] = useState(null);
    const [wordCloudResults, setWordCloudResults] = useState(null);
    const [submittedWord, setSubmittedWord] = useState(false);
    const [isDrawingActive, setIsDrawingActive] = useState(false);
    const [drawings, setDrawings] = useState({});
    const [activeBubbleQuiz, setActiveBubbleQuiz] = useState(null);
    const [hasClickedBubbleQuiz, setHasClickedBubbleQuiz] = useState(false);
    const [bubbleQuizClicks, setBubbleQuizClicks] = useState([]);

    // Refs
    const socketRef = useRef(null);
    const slideContainerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const resizeObserverRef = useRef(null);

    // Efek untuk mengamati perubahan ukuran kontainer
    useEffect(() => {
        const element = slideContainerRef.current;
        if (!element) return;

        // Fungsi untuk memperbarui ukuran
        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setContainerSize({ 
                    width: rect.width, 
                    height: rect.height 
                });
            }
        };

        // Buat ResizeObserver
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(element);

        // Panggil sekali untuk set ukuran awal
        updateSize();

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Tambahkan resize listener untuk window (jaga-jaga)
    useEffect(() => {
        const handleResize = () => {
            if (slideContainerRef.current) {
                const rect = slideContainerRef.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setContainerSize({ 
                        width: rect.width, 
                        height: rect.height 
                    });
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ukur ulang saat currentPage berubah
    useEffect(() => {
        const timer = setTimeout(() => {
            if (slideContainerRef.current) {
                const rect = slideContainerRef.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setContainerSize({ 
                        width: rect.width, 
                        height: rect.height 
                    });
                }
            }
        }, 50); // Waktu lebih singkat

        return () => clearTimeout(timer);
    }, [currentPage]);

    // useEffect utama untuk koneksi dan data
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

        // Listener koneksi dasar
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            socket.emit('join_session', { session_code: sessionCode, name: studentName });
        });
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('session_ended', (data) => { alert(data.message); navigate('/'); });
        
        // Listener update umum
        socket.on('update_leaderboard', (data) => setLeaderboardData(data));
        socket.on('student_picked', (data) => setPickerData(data));

        // Listener untuk memulai aktivitas
        socket.on('quiz_started', (quizData) => {
            setActiveQuiz(quizData);
            setHasAnsweredQuiz(false);
            setQuizFeedback(null);
            setActivePoll(null);
            setActiveWordCloud(null);
            setActiveBubbleQuiz(null);
            setIsDrawingActive(false);
        });
        socket.on('poll_started', (pollData) => {
            setActivePoll(pollData);
            setHasVotedPoll(false);
            setPollResults(null);
            setActiveQuiz(null);
            setActiveWordCloud(null);
            setActiveBubbleQuiz(null);
            setIsDrawingActive(false);
        });
        socket.on('wordcloud_started', (data) => {
            console.log('Received wordcloud_started:', data);
            setActiveWordCloud(data);
            setSubmittedWord(false);
            setWordCloudResults(null);
            setActiveQuiz(null);
            setActivePoll(null);
            setActiveBubbleQuiz(null);
            setIsDrawingActive(false);
        });
        socket.on('bubble_quiz_started', (quizData) => {
            console.log('Received bubble_quiz_started:', quizData);
            setActiveBubbleQuiz(quizData);
            setHasClickedBubbleQuiz(false);
            setBubbleQuizClicks([]);
            setActiveQuiz(null);
            setActivePoll(null);
            setActiveWordCloud(null);
            setIsDrawingActive(false);
        });
        socket.on('drawing_started', (data) => {
            setIsDrawingActive(true);
            const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
            if (currentSlide) {
                setDrawings(prev => ({...prev, [currentSlide.id]: data.lines || []}));
            }
        });
        socket.on('drawing_hidden', () => setIsDrawingActive(false));
        
        // Listener untuk update hasil
        socket.on('quiz_feedback', (feedback) => setQuizFeedback(feedback));
        socket.on('update_poll_results', (results) => setPollResults(results));
        socket.on('update_wordcloud_results', (results) => setWordCloudResults(results));
        socket.on('update_bubble_quiz_results', (data) => setBubbleQuizClicks(data.clicks));
        socket.on('canvas_cleared', (data) => setDrawings(prev => ({ ...prev, [data.slide_id]: [] })));
        socket.on('update_drawing', (data) => {
            const { drawData } = data;
            if (!drawData || !drawData.line || !drawData.slide_id) return;
            setDrawings(prev => {
                const currentLines = prev[drawData.slide_id] || [];
                let newLines = [...currentLines];
                if (drawData.type === 'start') { 
                    newLines.push(drawData.line); 
                } 
                else if (drawData.type === 'draw' && newLines.length > 0) { 
                    newLines[newLines.length - 1] = drawData.line; 
                }
                return { ...prev, [drawData.slide_id]: newLines };
            });
        });

        // Listener untuk pindah slide
        socket.on('slide_changed', (data) => {
            setCurrentPage(data.page_number);
            setActiveQuiz(null); setHasAnsweredQuiz(false); setQuizFeedback(null);
            setActivePoll(null); setHasVotedPoll(false); setPollResults(null);
            setActiveWordCloud(null); setSubmittedWord(false); setWordCloudResults(null);
            setIsDrawingActive(false);
            setActiveBubbleQuiz(null); setHasClickedBubbleQuiz(false); setBubbleQuizClicks([]);
        });

        return () => { 
            if (socketRef.current) {
                socketRef.current.disconnect(); 
            }
        };
    }, [sessionCode, studentName, navigate]);

    // Handlers
    const handleLeaveSession = () => { 
        if(socketRef.current) socketRef.current.disconnect(); 
        navigate('/'); 
    };
    
    const handleQuizSubmit = (answer) => {
        if (hasAnsweredQuiz || !socketRef.current) return;
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        socketRef.current.emit('submit_quiz_answer', { session_code: sessionCode, slide_id: currentSlide.id, answer: answer, name: studentName, sid: socketRef.current.id });
        setHasAnsweredQuiz(true);
    };

    const handleVoteSubmit = (option) => {
        if (hasVotedPoll || !socketRef.current) return;
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        socketRef.current.emit('submit_vote', { session_code: sessionCode, slide_id: currentSlide.id, option: option, name: studentName, sid: socketRef.current.id });
        setHasVotedPoll(true);
    };

    const handleWordSubmit = (e) => {
        e.preventDefault();
        const word = e.target.elements.word.value;
        if (!word.trim() || !socketRef.current) return;
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        socketRef.current.emit('submit_word', { session_code: sessionCode, slide_id: currentSlide.id, word: word, name: studentName, sid: socketRef.current.id });
        setSubmittedWord(true);
    };
    
    const handleImageClick = (e) => {
        if (hasClickedBubbleQuiz || !socketRef.current) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
        if (!stage || !currentSlide) return;
        setHasClickedBubbleQuiz(true);
        const normalizedPoint = { x: pos.x / stage.width(), y: pos.y / stage.height() };
        socketRef.current.emit('submit_bubble_click', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
            name: studentName,
            sid: socketRef.current.id,
            point: normalizedPoint
        });
    };

    if (loading || !presentation) return <div className="flex items-center justify-center min-h-screen text-2xl font-semibold dark:text-white">Joining session...</div>;
    
    if (currentPage === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="absolute top-4 right-4"><ThemeToggleButton /></div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">You're in!</h1>
                <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">Welcome, <strong>{studentName}</strong>!</p>
                <div className="mt-8 text-center"><p className="text-lg text-gray-700 dark:text-gray-200">Waiting for the teacher to start the presentation...</p><div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
            </div>
        );
    }
    
    const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
    const slideImageUrl = currentSlide ? `${api.defaults.baseURL}/${currentSlide.content_url}` : '';

    const renderInteractiveOverlay = () => {
        // Jika ukuran kontainer belum diukur, jangan render apapun
        if (containerSize.width === 0 || containerSize.height === 0) {
            return null;
        }

        // Tampilan Drawing Canvas (z-index 10)
        if (isDrawingActive) {
            return (
                <div className="absolute top-0 left-0 w-full h-full z-10">
                    <DrawingCanvas 
                        lines={drawings[currentSlide?.id] || []} 
                        isReadOnly={true} 
                        width={containerSize.width} 
                        height={containerSize.height} 
                    />
                </div>
            );
        }
        
        // Tampilan Bubble Quiz (z-index 20)
        if (activeBubbleQuiz) {
            // Ensure correctAreas is always an array of objects
            const correctAreas = Array.isArray(activeBubbleQuiz?.correct_areas)
                ? activeBubbleQuiz.correct_areas.map(area =>
                    typeof area === 'string' ? JSON.parse(area) : area
                  )
                : [];
            return (
                <div className="absolute top-0 left-0 w-full h-full z-20">
                    <BubbleQuizDisplay
                        clicks={bubbleQuizClicks}
                        correctAreas={correctAreas}
                        width={containerSize.width}
                        height={containerSize.height}
                    />
                    {!hasClickedBubbleQuiz && (
                        <>
                            <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-400 animate-pulse cursor-pointer" />
                            <Stage 
                                width={containerSize.width} 
                                height={containerSize.height} 
                                onClick={handleImageClick} 
                                onTap={handleImageClick} 
                                className="absolute top-0 left-0" 
                            />
                        </>
                    )}
                </div>
            );
        }
        
        // Overlay lain yang menutupi seluruh layar (z-index 30)
        let overlayContent = null;

        if (activePoll) {
            overlayContent = (
                <>
                    <h2 className="text-4xl font-bold mb-8 text-center text-white">{activePoll.question}</h2>
                    {!hasVotedPoll ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                            {activePoll.options.map((option, index) => (
                                <button key={index} onClick={() => handleVoteSubmit(option)} className="p-6 bg-blue-600 rounded-lg text-2xl hover:bg-blue-500">
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center w-full max-w-3xl p-4 bg-gray-800 rounded-lg">
                            <p className="text-2xl text-green-400 mb-4">Thank you for voting!</p>
                            {pollResults ? <PollResultsChart results={pollResults} /> : <p>Waiting for results...</p>}
                        </div>
                    )}
                </>
            );
        } else if (activeWordCloud) {
            overlayContent = (
                <div className="w-full max-w-3xl text-center">
                    <h2 className="text-4xl font-bold mb-8 text-white shadow-lg">{activeWordCloud.question}</h2>
                    {!submittedWord ? (
                        <form onSubmit={handleWordSubmit} className="flex gap-2 justify-center">
                            <input 
                                name="word" 
                                type="text" 
                                className="text-xl text-center text-gray-900 px-4 py-3 rounded-lg shadow-md w-80" 
                                placeholder="Type your word here..." 
                                maxLength="25" 
                                autoFocus 
                            />
                            <button type="submit" className="text-xl px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600">
                                Submit
                            </button>
                        </form>
                    ) : (
                        <div className="w-full p-4 bg-white/10 rounded-lg">
                            <p className="text-2xl text-green-400 mb-4">Thank you!</p>
                            {wordCloudResults ? <WordCloudDisplay results={wordCloudResults} /> : <p>Waiting for submissions...</p>}
                        </div>
                    )}
                </div>
            );
        } else if (activeQuiz) {
            overlayContent = (
                <>
                    <h2 className="text-4xl font-bold mb-8 text-center text-white">{activeQuiz.question}</h2>
                    {!hasAnsweredQuiz ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                            {activeQuiz.options.map((option, index) => (
                                <button key={index} onClick={() => handleQuizSubmit(option)} className="p-6 bg-blue-600 rounded-lg text-2xl hover:bg-blue-500">
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            {quizFeedback && (
                                <p className={`text-4xl font-bold ${quizFeedback.correct ? 'text-green-400' : 'text-red-500'}`}>
                                    {quizFeedback.correct ? "Correct!" : "Incorrect"}
                                </p>
                            )}
                            <p className="text-xl mt-4">Live Leaderboard</p>
                            <div className="mt-4 w-full max-w-md bg-white/10 p-4 rounded-lg">
                                <LeaderboardDisplay leaderboardData={leaderboardData} />
                            </div>
                        </div>
                    )}
                </>
            );
        }

        if (overlayContent) {
            return (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in z-30">
                    {overlayContent}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
            <SessionSidebar leaderboardData={leaderboardData} participants={[]} showParticipantsTab={false} />
            <ConfirmationModal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} onConfirm={handleLeaveSession} title="Leave Session?">
                <p>Are you sure?</p>
            </ConfirmationModal>
            {pickerData && <RandomPickerOverlay data={pickerData} onAnimationEnd={() => setPickerData(null)} />}
            <header className="p-3 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center relative">
                <div className="absolute top-3 left-3 z-50">
                    <button onClick={() => setShowLeaveConfirm(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
                        Leave
                    </button>
                </div>
                <div className="text-center flex-1 mx-20">
                    <h1 className="text-lg font-semibold truncate" title={presentation?.title}>
                        {presentation?.title}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Session Code: <strong>{sessionCode}</strong> | Status: 
                        <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? ' CONNECTED' : ' DISCONNECTED'}
                        </span>
                    </p>
                </div>
                <div className="absolute top-3 right-3 z-50">
                    <ThemeToggleButton />
                </div>
            </header>
        
            <main className="flex-grow flex items-center justify-center">
                <div 
                    ref={slideContainerRef} 
                    className="w-full max-w-5xl aspect-video min-h-[200px] bg-black flex items-center justify-center relative"
                    // style={{ border: '2px solid red' }}
                >
                    <img 
                        src={slideImageUrl} 
                        alt={`Slide ${currentPage}`} 
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => {
                            // Ukur ulang setelah gambar dimuat
                            if (slideContainerRef.current) {
                                const rect = slideContainerRef.current.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    setContainerSize({ width: rect.width, height: rect.height });
                                }
                            }
                        }}
                    />
                    {renderInteractiveOverlay()}
                </div>
            </main>
            
            <footer className="p-2 bg-white dark:bg-gray-800 shadow-inner">
                <p className="text-center font-bold text-xl">Slide {currentPage} / {presentation?.slides.length || '...'}</p>
            </footer>
        </div>
    );
};

export default SessionPage;