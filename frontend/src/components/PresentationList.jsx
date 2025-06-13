import React, { useState, useEffect } from 'react';
import * as presentationService from '../services/presentationService';

// Import semua modal yang baru dibuat
import PresentationModal from './PresentationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import SessionModal from './SessionModal';

const PresentationList = ({ isCreateModalOpen, setCreateModalOpen }) => {
    const [presentations, setPresentations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State untuk mengelola modal-modal
    const [editingPresentation, setEditingPresentation] = useState(null);
    const [deletingPresentation, setDeletingPresentation] = useState(null);
    const [uploadingPresentation, setUploadingPresentation] = useState(null);
    const [activeSession, setActiveSession] = useState(null);
    
    const fileInputRef = React.useRef(null);

    const fetchPresentations = async () => {
        try {
            const response = await presentationService.getPresentations();
            setPresentations(response.data);
        } catch (err) {
            setError('Failed to fetch presentations.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPresentations();
    }, []);

    // Handler untuk CRUD
    const handleCreate = async (title) => {
        try {
            await presentationService.createPresentation(title);
            fetchPresentations(); // Muat ulang daftar
            setCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to create presentation", err);
        }
    };

    const handleEdit = async (title) => {
        if (!editingPresentation) return;
        try {
            await presentationService.updatePresentation(editingPresentation.id, title);
            fetchPresentations();
            setEditingPresentation(null);
        } catch (err) {
            console.error("Failed to edit presentation", err);
        }
    };

    const handleDelete = async () => {
        if (!deletingPresentation) return;
        try {
            await presentationService.deletePresentation(deletingPresentation.id);
            fetchPresentations();
            setDeletingPresentation(null);
        } catch (err) {
            console.error("Failed to delete presentation", err);
        }
    };
    
    const handleUploadClick = (presentation) => {
        setUploadingPresentation(presentation);
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && uploadingPresentation) {
            try {
                // Nanti bisa ditambahkan loading indicator
                await presentationService.uploadPdf(uploadingPresentation.id, file);
                alert("File uploaded successfully and slides created!");
                fetchPresentations();
            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed. Please check the console.");
            } finally {
                setUploadingPresentation(null);
                event.target.value = null; // Reset file input
            }
        }
    };
    
    const handleStartSession = async (presentationId) => {
        try {
            const response = await presentationService.createSession(presentationId);
            setActiveSession(response.data);
        } catch (err) {
            console.error("Failed to start session", err);
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
                            <div key={pres.id} className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">{pres.title}</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Created on: {new Date(pres.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button onClick={() => handleStartSession(pres.id)} className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Start Session</button>
                                    <button onClick={() => handleUploadClick(pres)} className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600">Upload PDF</button>
                                    <button onClick={() => setEditingPresentation(pres)} className="px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => setDeletingPresentation(pres)} className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Render semua modal di sini */}
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
            <SessionModal 
                isOpen={!!activeSession}
                onClose={() => setActiveSession(null)}
                session={activeSession}
            />
        </>
    );
};

export default PresentationList;