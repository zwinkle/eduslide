import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as presentationService from '../services/presentationService';
import PresentationModal from './PresentationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ManageSlidesModal from './ManageSlidesModal';
import QuizCreationModal from './QuizCreationModal';
import PollCreationModal from './PollCreationModal';
import WordCloudCreationModal from './WordCloudCreationModal';

const PresentationList = ({ isCreateModalOpen, setCreateModalOpen }) => {
    const [presentations, setPresentations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [editingPresentation, setEditingPresentation] = useState(null);
    const [deletingPresentation, setDeletingPresentation] = useState(null);
    const [managingSlidesOf, setManagingSlidesOf] = useState(null);
    const [addingQuizTo, setAddingQuizTo] = useState(null); 
    const [addingPollTo, setAddingPollTo] = useState(null);
    const [addingWordCloudTo, setAddingWordCloudTo] = useState(null); 

    const fileInputRef = useRef(null);

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

    const handleUploadClick = (presentation) => {
        fileInputRef.current.dataset.presentationId = presentation.id;
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const presentationId = fileInputRef.current.dataset.presentationId;
        if (file && presentationId) {
            try {
                await presentationService.uploadPdf(presentationId, file);
                alert("File uploaded successfully!");
                // Muat ulang data presentasi yang sedang dikelola jika modalnya terbuka
                if (managingSlidesOf) {
                    const response = await presentationService.getPresentationById(presentationId);
                    setManagingSlidesOf(response.data);
                }
                fetchPresentations(); // Muat ulang daftar utama
            } catch (err) {
                alert("Upload failed.");
            } finally {
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

    if (loading) return <p>Loading presentations...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <>
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
            />
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
        </>
    );
};

export default PresentationList;