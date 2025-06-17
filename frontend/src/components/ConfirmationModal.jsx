// frontend/src/components/ConfirmationModal.jsx
import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-gray-800 dark:text-gray-200">{children}</div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Confirm
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;