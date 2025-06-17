import React from 'react';
import Modal from './Modal';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, presentationTitle }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
            <p className="text-gray-800 dark:text-gray-200">
                Are you sure you want to delete the presentation "<strong>{presentationTitle}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4 mt-6">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm} 
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Delete
                </button>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;