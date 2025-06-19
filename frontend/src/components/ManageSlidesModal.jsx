import React from 'react';
import Modal from './Modal';
import api from '../services/api';

const ManageSlidesModal = ({ isOpen, onClose, presentation, onAddPoll, onAddWordCloud, onAddQuiz, onAddBubbleQuiz }) => {
    if (!presentation) return null;

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
                                
                                {slide.interactive_type === 'poll' && <span className="text-xs font-bold text-green-800 dark:text-green-300">Poll Added</span>}
                                {slide.interactive_type === 'word_cloud' && <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Word Cloud Added</span>}
                                {slide.interactive_type === 'quiz' && <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300">Quiz Added</span>}
                                {slide.interactive_type === 'bubble_quiz' && <span className="text-xs font-bold text-red-800 dark:text-red-300">Bubble Quiz Added</span>}
                                
                                {!slide.interactive_type && (
                                    // PERBAIKAN STYLE DI SINI
                                    <div className="grid grid-cols-2 gap-1">
                                        <button onClick={() => onAddPoll(slide)} className="text-xs font-semibold px-2 py-1 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 transition-all transform hover:scale-105">Poll</button>
                                        <button onClick={() => onAddWordCloud(slide)} className="text-xs font-semibold px-2 py-1 bg-purple-500 text-white rounded-md shadow-sm hover:bg-purple-600 transition-all transform hover:scale-105">WC</button>
                                        <button onClick={() => onAddQuiz(slide)} className="text-xs font-semibold px-2 py-1 bg-yellow-500 text-white rounded-md shadow-sm hover:bg-yellow-600 transition-all transform hover:scale-105">Quiz</button>
                                        <button onClick={() => onAddBubbleQuiz(slide)} className="text-xs font-semibold px-2 py-1 bg-pink-500 text-white rounded-md shadow-sm hover:bg-pink-600 transition-all transform hover:scale-105">Bubble</button>
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