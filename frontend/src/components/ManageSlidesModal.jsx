// frontend/src/components/ManageSlidesModal.jsx

import React from 'react';
import Modal from './Modal';
import api from '../services/api';

const ManageSlidesModal = ({ isOpen, onClose, presentation, onAddPoll, onAddWordCloud, onAddQuiz }) => {
    if (!presentation) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Manage Slides: ${presentation.title}`}
            size="4xl"
        >
            <div className="max-h-[70vh] overflow-y-auto p-2">
                <p className="text-sm text-gray-600 mb-4">Click an activity button on a slide to add or edit it.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {presentation.slides.map((slide) => (
                        <div key={slide.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center shadow-sm">
                            <img 
                                src={`${api.defaults.baseURL}/${slide.content_url}`} 
                                alt={`Slide ${slide.page_number}`}
                                className="w-full h-auto object-contain rounded-md mb-2"
                            />
                            <div className="w-full text-center">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">Slide {slide.page_number}</p>
                                {slide.interactive_type === 'quiz' && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Quiz Added</span>}
                                {slide.interactive_type === 'poll' && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Poll Added</span>}
                                {slide.interactive_type === 'word_cloud' && <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Word Cloud Added</span>}
                                
                                {!slide.interactive_type && (
                                    <div className="flex gap-1 mt-1">
                                        <button onClick={() => onAddQuiz(slide)} className="flex-1 text-xs px-1 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Quiz</button>
                                        <button onClick={() => onAddPoll(slide)} className="flex-1 text-xs px-1 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Poll</button>
                                        <button onClick={() => onAddWordCloud(slide)} className="flex-1 text-xs px-1 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">WC</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default ManageSlidesModal;