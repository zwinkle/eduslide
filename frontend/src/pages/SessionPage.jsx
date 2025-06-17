import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as sessionService from '../services/sessionService';
import * as presentationService from '../services/presentationService';
import ThemeToggleButton from '../components/ThemeToggleButton';
import PollResultsChart from '../components/PollResultsChart';
import WordCloudDisplay from '../components/WordCloudDisplay';
import RandomPickerOverlay from '../components/RandomPickerOverlay';
import LeaderboardDisplay from '../components/LeaderboardDisplay';
import SessionSidebar from '../components/SessionSidebar';
import DrawingCanvas from '../components/DrawingCanvas';

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

    const [activeQuiz, setActiveQuiz] = useState(null);
    const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState(null);
    const [leaderboardData, setLeaderboardData] = useState([]);
    
    const [activePoll, setActivePoll] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [pollResults, setPollResults] = useState(null);

    const [activeWordCloud, setActiveWordCloud] = useState(null);
    const [wordCloudResults, setWordCloudResults] = useState(null);
    const [submittedWord, setSubmittedWord] = useState(false);

    const [isDrawingActive, setIsDrawingActive] = useState(false);
    const [drawings, setDrawings] = useState({});
    const slideContainerRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const [pickerData, setPickerData] = useState(null);

    const socketRef = useRef(null);

    useEffect(() => {
        const checkSize = () => {
            if (slideContainerRef.current) {
                setCanvasSize({
                    width: slideContainerRef.current.offsetWidth,
                    height: slideContainerRef.current.offsetHeight,
                });
            }
        };
        
        if (isDrawingActive) {
            checkSize();
            window.addEventListener('resize', checkSize);
        }
        
        return () => window.removeEventListener('resize', checkSize);
    }, [isDrawingActive]);

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
            setActiveQuiz(null);
            setHasAnsweredQuiz(false);
            setQuizFeedback(null);
            // setLeaderboardData([]);
            setActivePoll(null); 
            setHasVoted(false);
            setPollResults(null);
            setActiveWordCloud(null);
            setSubmittedWord(false);
            setWordCloudResults(null);
            setIsDrawingActive(false);
            // setLines([]);
        });

        socket.on('quiz_started', (quizData) => {
            setActiveQuiz(quizData);
            setHasAnsweredQuiz(false);
            setQuizFeedback(null);
            // setLeaderboardData([]);
        });

        socket.on('quiz_feedback', (feedback) => {
            setQuizFeedback(feedback);
        });

        socket.on('update_leaderboard', (data) => {
            setLeaderboardData(data);
        });
        
        socket.on('poll_started', (pollData) => {
            setActivePoll(pollData);
            setHasVoted(false);
            setPollResults(null);
        });

        socket.on('update_poll_results', (results) => {
            setPollResults(results);
        });

        socket.on('wordcloud_started', (data) => {
            setActiveWordCloud(data);
            setSubmittedWord(false);
            setWordCloudResults(null);
        });

        socket.on('update_wordcloud_results', (results) => {
            setWordCloudResults(results);
        });

        socket.on('drawing_started', (data) => {
            setIsDrawingActive(true);
            if(data.lines) setDrawings(prev => ({...prev, [data.slide_id]: data.lines}));
        });
        socket.on('drawing_hidden', () => setIsDrawingActive(false));
        socket.on('canvas_cleared', (data) => {
            const slide_id = data.slide_id;
            setDrawings(prev => ({ ...prev, [slide_id]: [] }));
        });
        socket.on('update_drawing', (data) => {
            const { drawData } = data;
            if (!drawData || !drawData.line || !drawData.slide_id) return;
            
            setDrawings(prev => {
                const currentLines = prev[drawData.slide_id] || [];
                let newLines = [...currentLines];

                if (drawData.type === 'start') {
                    newLines.push(drawData.line);
                } else if (drawData.type === 'draw' && newLines.length > 0) {
                    newLines[newLines.length - 1] = drawData.line;
                }
                return { ...prev, [drawData.slide_id]: newLines };
            });
        });

        socket.on('student_picked', (data) => {
            setPickerData(data);
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

    const handleQuizSubmit = (answer) => {
        if (hasAnsweredQuiz || !socketRef.current) return;
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        
        socketRef.current.emit('submit_quiz_answer', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
            answer: answer,
            name: studentName,
            sid: socketRef.current.id // Kirim sid untuk identifikasi
        });
        setHasAnsweredQuiz(true);
    };

    const handleVoteSubmit = (option) => {
        if (!activePoll || hasVoted || !socketRef.current) {
            console.error("Vote submission failed. Conditions not met.", { activePoll, hasVoted, socket: socketRef.current });
            return;
        }

        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        if (!currentSlide) return;
        
        socketRef.current.emit('submit_vote', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
            option: option
        });
        
        setHasVoted(true);
    };

    const handleWordSubmit = (e) => {
        e.preventDefault();
        const word = e.target.elements.word.value;
        if (!word.trim() || !socketRef.current) return;
        
        const currentSlide = presentation.slides.find(s => s.page_number === currentPage);
        socketRef.current.emit('submit_word', {
            session_code: sessionCode,
            slide_id: currentSlide.id,
            word: word
        });
        setSubmittedWord(true);
    };
    
    if (loading) return <div className="flex items-center justify-center min-h-screen text-2xl font-semibold">Joining session...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    if (currentPage === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="absolute top-4 right-4">
                    <ThemeToggleButton />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">You're in!</h1>
                <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">Welcome, <strong>{studentName}</strong>!</p>
                <div className="mt-8 text-center">
                    <p className="text-lg text-gray-700 dark:text-gray-200">Waiting for the teacher to start the presentation...</p>
                    <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    const currentSlide = presentation?.slides.find(s => s.page_number === currentPage);
    const slideImageUrl = currentSlide ? `${api.defaults.baseURL}/${currentSlide.content_url}` : '';

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
            <SessionSidebar 
                leaderboardData={leaderboardData} 
                participants={[]} 
                showParticipantsTab={false} 
            />
            {pickerData && <RandomPickerOverlay data={pickerData} onAnimationEnd={() => setPickerData(null)} />}
            <header className="p-3 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center">
                <div className="text-center flex-1">
                    <h1 className="text-lg font-semibold truncate" title={presentation?.title}>
                        {presentation?.title || 'Loading title...'}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Session Code: <strong>{sessionCode}</strong> | Status: 
                        <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? ' CONNECTED' : ' DISCONNECTED'}
                        </span>
                    </p>
                </div>
                <div className="absolute top-3 right-3">
                    <ThemeToggleButton />
                </div>
            </header>

            <main className="flex-grow p-4 flex items-center justify-center">
                <div ref={slideContainerRef} className="w-full bg-black flex items-center justify-center aspect-video relative">
                    {slideImageUrl && <img src={slideImageUrl} alt={`Slide ${currentPage}`} className="max-w-full max-h-full object-contain"/>}

                    {activeQuiz && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-8 animate-fade-in">
                            <h2 className="text-4xl font-bold mb-8 text-center">{activeQuiz.question}</h2>
                            
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
                        </div>
                    )}
                    
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

                    {activeWordCloud && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
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
                                        <button type="submit" className="text-xl px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600">Submit</button>
                                    </form>
                                ) : (
                                    <div className="w-full p-4 bg-white/10 rounded-lg">
                                        <p className="text-2xl text-green-400 mb-4">Thank you! Watching results...</p>
                                        {wordCloudResults ? <WordCloudDisplay results={wordCloudResults} /> : <p>Waiting for submissions...</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isDrawingActive && (
                        <div className="absolute top-0 left-0 w-full h-full z-10">
                            <DrawingCanvas 
                                lines={drawings[currentSlide.id] || []}
                                isReadOnly={true}
                                width={canvasSize.width}
                                height={canvasSize.height}
                            />
                        </div>
                    )}
                </div>
            </main>

            <footer className="p-2 bg-white dark:bg-gray-800 shadow-inner">
                <p className="text-center font-bold text-xl">Slide {currentPage} / {presentation?.slides.length || '...'}</p>
            </footer>
        </div>
    );
};

export default SessionPage;