import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const WordCloudCreationModal = ({ isOpen, onClose, onSubmit, slide }) => {
    const [question, setQuestion] = useState('');

    useEffect(() => {
        if (isOpen && slide?.interactive_type === 'word_cloud') {
            setQuestion(slide.settings.question || '');
        } else if (isOpen) {
            setQuestion('');
        }
    }, [isOpen, slide]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ question });
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={slide?.interactive_type === 'word_cloud' ? `Edit Word Cloud on Slide ${slide.page_number}` : `Add Word Cloud to Slide ${slide?.page_number}`}
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="wc-question-edit" className="block text-gray-700 dark:text-gray-300 mb-2">Prompt Question</label>
                    <input
                        type="text"
                        id="wc-question-edit"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What one word describes this topic?"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                        required
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg">Save Activity</button>
                </div>
            </form>
        </Modal>
    );
};

export default WordCloudCreationModal;