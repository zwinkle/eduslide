import React from 'react';
import Modal from './Modal';
import api from '../services/api';

const ManageSlidesModal = ({ isOpen, onClose, presentation, onAddActivity }) => {
    if (!presentation) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Manage Slides: ${presentation.title}`}
            size="4xl"
        >
            <div className="max-h-[70vh] overflow-y-auto p-2">
                <p className="text-sm text-gray-600 mb-4">Click "Add Activity" on a slide to insert a poll.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {presentation.slides.map((slide) => (
                        <div key={slide.id} className="border rounded-lg p-2 flex flex-col items-center shadow-sm">
                            <img 
                                src={`${api.defaults.baseURL}/${slide.content_url}`} 
                                alt={`Slide ${slide.page_number}`}
                                className="w-full h-auto object-contain rounded-md mb-2"
                            />
                            <div className="w-full text-center">
                                <p className="font-semibold">Slide {slide.page_number}</p>
                                {slide.interactive_type === 'poll' ? (
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Poll Added</span>
                                ) : (
                                    <button 
                                        onClick={() => onAddActivity(slide)}
                                        className="mt-1 w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add Activity
                                    </button>
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