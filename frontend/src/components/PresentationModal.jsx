import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const PresentationModal = ({ isOpen, onClose, onSubmit, presentation }) => {
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (presentation) {
            setTitle(presentation.title);
        } else {
            setTitle('');
        }
    }, [presentation, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(title);
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={presentation ? 'Edit Presentation' : 'Create New Presentation'}
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="presentation-title" className="block text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input
                        type="text"
                        id="presentation-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                        required
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                        {presentation ? 'Save Changes' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PresentationModal;