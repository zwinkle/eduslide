import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const PresentationModal = ({ isOpen, onClose, onSubmit, presentation }) => {
    const [title, setTitle] = useState('');

    useEffect(() => {
        // Jika ada data presentasi (mode edit), set judulnya
        if (presentation) {
            setTitle(presentation.title);
        } else {
            setTitle('');
        }
    }, [presentation, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(title);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={presentation ? 'Edit Presentation' : 'Create New Presentation'}
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                        {presentation ? 'Save Changes' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PresentationModal;