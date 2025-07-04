import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as presentationService from '../services/presentationService';
import PresentationModal from './PresentationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ConfirmationModal from './ConfirmationModal';
import ManageSlidesModal from './ManageSlidesModal';
import QuizCreationModal from './QuizCreationModal';
import PollCreationModal from './PollCreationModal';
import WordCloudCreationModal from './WordCloudCreationModal';
import BubbleQuizCreationModal from './BubbleQuizCreationModal';
import { Spin, message, Progress } from 'antd';

const PresentationList = ({ isCreateModalOpen, setCreateModalOpen }) => {
    const [presentations, setPresentations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [editingPresentation, setEditingPresentation] = useState(null);
    const [deletingPresentation, setDeletingPresentation] = useState(null);
    const [deletingActivityFrom, setDeletingActivityFrom] = useState(null);
    const [managingSlidesOf, setManagingSlidesOf] = useState(null);
    const [addingQuizTo, setAddingQuizTo] = useState(null); 
    const [addingPollTo, setAddingPollTo] = useState(null);
    const [addingWordCloudTo, setAddingWordCloudTo] = useState(null);
    const [addingBubbleQuizTo, setAddingBubbleQuizTo] = useState(null);

    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchPresentations = async () => {
        setLoading(true);
        try {
            const response = await presentationService.getPresentations();
            setPresentations(response.data);
        } catch (err) {
            setError('Failed to fetch presentations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPresentations();
    }, []);

    const handleCreate = async (title) => {
        await presentationService.createPresentation(title);
        fetchPresentations();
        setCreateModalOpen(false);
    };

    const handleEdit = async (title) => {
        await presentationService.updatePresentation(editingPresentation.id, title);
        fetchPresentations();
        setEditingPresentation(null);
    };

    const handleDelete = async () => {
        await presentationService.deletePresentation(deletingPresentation.id);
        fetchPresentations();
        setDeletingPresentation(null);
    };

    const handleActivityDelete = async () => {
        if (!deletingActivityFrom) return;
        try {
            await presentationService.removeActivityFromSlide(deletingActivityFrom.id);
            setDeletingActivityFrom(null);
            // Muat ulang data untuk melihat perubahan
            const response = await presentationService.getPresentationById(managingSlidesOf.id);
            setManagingSlidesOf(response.data);
            alert("Activity removed successfully!");
        } catch (err) {
            alert("Failed to remove activity.");
        }
    };

    const handleUploadClick = (presentation) => {
        fileInputRef.current.dataset.presentationId = presentation.id;
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const presentationId = fileInputRef.current.dataset.presentationId;
        if (file && presentationId) {
            setUploading(true);
            setUploadProgress(0);
            try {
                await presentationService.uploadPdf(
                    presentationId,
                    file,
                    (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                );
                message.success("File uploaded successfully!");
                if (managingSlidesOf) {
                    const response = await presentationService.getPresentationById(presentationId);
                    setManagingSlidesOf(response.data);
                }
                fetchPresentations();
            } catch (err) {
                message.error("Upload failed.");
            } finally {
                setUploading(false);
                setUploadProgress(0);
                event.target.value = null;
            }
        }
    };

    const handleStartSession = async (presentation) => {
        if (!presentation.slides || presentation.slides.length === 0) {
            alert("This presentation has no slides. Please upload a PDF first.");
            return;
        }
        const response = await presentationService.createSession(presentation.id);
        navigate(`/presenter/${presentation.id}/session/${response.data.code}`);
    };

    const handleAddQuizSubmit = async (quizData) => {
        if (!addingQuizTo) return;
        try {
            await presentationService.addQuizActivity(addingQuizTo.id, quizData);
            setAddingQuizTo(null);
            const response = await presentationService.getPresentationById(managingSlidesOf.id);
            setManagingSlidesOf(response.data);
            alert("Quiz added successfully!");
        } catch (err) {
            console.error("Failed to add quiz", err);
            alert("Failed to add quiz.");
        }
    };

    const handleAddPollSubmit = async (pollData) => {
        if (!addingPollTo) return;
        try {
            await presentationService.addActivityToSlide(addingPollTo.id, pollData);
            setAddingPollTo(null);
            
            const response = await presentationService.getPresentationById(managingSlidesOf.id);
            setManagingSlidesOf(response.data);

            alert("Poll added successfully!");
        } catch (err) {
            console.error("Failed to add poll", err);
            alert("Failed to add poll.");
        }
    };

    const handleAddWordCloudSubmit = async (questionData) => {
        if (!addingWordCloudTo) return;
        try {
            await presentationService.addWordCloudActivity(addingWordCloudTo.id, questionData);
            setAddingWordCloudTo(null);

            const response = await presentationService.getPresentationById(managingSlidesOf.id);
            setManagingSlidesOf(response.data);

            alert("Word Cloud activity added successfully!");
        } catch (err) {
            console.error("Failed to add Word Cloud", err);
            alert("Failed to add Word Cloud activity.");
        }
    };

    const handleAddBubbleQuizSubmit = async (quizData) => {
        if (!addingBubbleQuizTo) return;
        try {
            await presentationService.addBubbleQuizActivity(addingBubbleQuizTo.id, quizData);
            setAddingBubbleQuizTo(null);
            const response = await presentationService.getPresentationById(managingSlidesOf.id);
            setManagingSlidesOf(response.data);
            alert("Bubble Quiz added successfully!");
        } catch (err) {
            alert("Failed to add Bubble Quiz.");
        }
    };

    if (loading) return <p>Loading presentations...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <>
            {uploading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 z-50">
                    <Spin size="large" tip="Uploading..." />
                    <div className="w-64 mt-4">
                        <Progress percent={uploadProgress} status="active" />
                    </div>
                </div>
            )}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Your Presentations</h2>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf"/>
                {presentations.length === 0 ? (
                    <p>You haven't created any presentations yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {presentations.map((pres) => (
                            <div key={pres.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col justify-between">
                                <div className="cursor-pointer" onClick={() => setManagingSlidesOf(pres)}>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pres.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        {pres.slides.length} slide(s)
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Created on: {new Date(pres.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-2">
                                    <button onClick={() => handleStartSession(pres)} className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Start Session</button>
                                    <button onClick={() => handleUploadClick(pres)} className="flex-1 px-3 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600">Upload PDF</button>
                                    <button onClick={() => setEditingPresentation(pres)} className="px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">Rename</button>
                                    <button onClick={() => setDeletingPresentation(pres)} className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PresentationModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setCreateModalOpen(false)} 
                onSubmit={handleCreate} 
            />
            <PresentationModal 
                isOpen={!!editingPresentation} 
                onClose={() => setEditingPresentation(null)} 
                onSubmit={handleEdit}
                presentation={editingPresentation}
            />
            <DeleteConfirmationModal 
                isOpen={!!deletingPresentation}
                onClose={() => setDeletingPresentation(null)}
                onConfirm={handleDelete}
                presentationTitle={deletingPresentation?.title}
            />
            <ManageSlidesModal
                isOpen={!!managingSlidesOf}
                onClose={() => setManagingSlidesOf(null)}
                presentation={managingSlidesOf}
                onAddQuiz={(slide) => setAddingQuizTo(slide)}
                onAddPoll={(slide) => setAddingPollTo(slide)}
                onAddWordCloud={(slide) => setAddingWordCloudTo(slide)}
                onAddBubbleQuiz={(slide) => setAddingBubbleQuizTo(slide)}
                onDeleteActivity={(slide) => setDeletingActivityFrom(slide)}
            />
            <ConfirmationModal
                isOpen={!!deletingActivityFrom}
                onClose={() => setDeletingActivityFrom(null)}
                onConfirm={handleActivityDelete}
                title="Delete Activity?"
            >
                <p>Are you sure you want to remove the activity from this slide?</p>
            </ConfirmationModal>
            <QuizCreationModal
                isOpen={!!addingQuizTo}
                onClose={() => setAddingQuizTo(null)}
                onSubmit={handleAddQuizSubmit}
                slide={addingQuizTo}
            />
            <PollCreationModal
                isOpen={!!addingPollTo}
                onClose={() => setAddingPollTo(null)}
                onSubmit={handleAddPollSubmit}
                slide={addingPollTo}
            />
            <WordCloudCreationModal
                isOpen={!!addingWordCloudTo}
                onClose={() => setAddingWordCloudTo(null)}
                onSubmit={handleAddWordCloudSubmit}
                slide={addingWordCloudTo}
            />
            <BubbleQuizCreationModal
                isOpen={!!addingBubbleQuizTo}
                onClose={() => setAddingBubbleQuizTo(null)}
                onSubmit={handleAddBubbleQuizSubmit}
                slide={addingBubbleQuizTo}
            />
        </>
    );
};

export default PresentationList;