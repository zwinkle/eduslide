import React from 'react';
import Modal from './Modal';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, presentationTitle }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
            <p>Are you sure you want to delete the presentation "<strong>{presentationTitle}</strong>"? This action cannot be undone.</p>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg">Delete</button>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;