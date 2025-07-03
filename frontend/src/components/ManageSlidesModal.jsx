import React from 'react';
import Modal from './Modal';
import api from '../services/api';

const ManageSlidesModal = ({ isOpen, onClose, presentation, onAddPoll, onAddWordCloud, onAddQuiz, onAddBubbleQuiz, onDeleteActivity }) => {
    if (!presentation) return null;

    const getActivityButton = (slide) => {
        switch (slide.interactive_type) {
            case 'poll':
                return <button onClick={() => onAddPoll(slide)} className="flex-1 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Edit Poll</button>;
            case 'word_cloud':
                return <button onClick={() => onAddWordCloud(slide)} className="flex-1 text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">Edit WC</button>;
            case 'quiz':
                return <button onClick={() => onAddQuiz(slide)} className="flex-1 text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit Quiz</button>;
            case 'bubble_quiz':
                return <button onClick={() => onAddBubbleQuiz(slide)} className="flex-1 text-xs px-2 py-1 bg-pink-500 text-white rounded hover:bg-pink-600">Edit Bubble</button>;
            default:
                return (
                    <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => onAddPoll(slide)} className="text-xs font-semibold px-2 py-1 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600">Poll</button>
                        <button onClick={() => onAddWordCloud(slide)} className="text-xs font-semibold px-2 py-1 bg-purple-500 text-white rounded-md shadow-sm hover:bg-purple-600">WC</button>
                        <button onClick={() => onAddQuiz(slide)} className="text-xs font-semibold px-2 py-1 bg-yellow-500 text-white rounded-md shadow-sm hover:bg-yellow-600">Quiz</button>
                        <button onClick={() => onAddBubbleQuiz(slide)} className="text-xs font-semibold px-2 py-1 bg-pink-500 text-white rounded-md shadow-sm hover:bg-pink-600">Bubble</button>
                    </div>
                );
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Manage Slides: ${presentation.title}`}
        >
            <div className="max-h-[70vh] overflow-y-auto p-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Click an activity button on a slide to add or edit it.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {presentation.slides.map((slide) => (
                        <div key={slide.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center shadow-sm bg-gray-50 dark:bg-gray-800">
                            <div className="w-full mb-2">
                                <img 
                                    src={`${api.defaults.baseURL}/${slide.content_url}`} 
                                    alt={`Slide ${slide.page_number}`}
                                    className="w-full h-auto object-contain rounded-md"
                                />
                            </div>
                                <div className="w-full text-center mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Slide {slide.page_number}</p>
                                {slide.interactive_type ? (
                                    <div className="flex items-center gap-2">
                                        {getActivityButton(slide)}
                                        <button onClick={() => onDeleteActivity(slide)} title="Remove Activity" className="p-1.5 bg-red-500 text-white rounded hover:bg-red-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    getActivityButton(slide)
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