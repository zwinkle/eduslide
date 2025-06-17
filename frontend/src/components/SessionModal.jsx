import React from 'react';
import Modal from './Modal';
import api from '../services/api';

const SessionModal = ({ isOpen, onClose, session }) => {
    if (!session) return null;

    const qrCodeUrl = `${api.defaults.baseURL}/presentations/sessions/${session.code}/qr`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Session Started!">
            <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">Students can join using this code:</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
                    <p className="text-5xl font-bold tracking-widest text-gray-800 dark:text-gray-100">{session.code}</p>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Or by scanning this QR code:</p>
                <div className="flex justify-center p-4 bg-white rounded-md">
                    <img src={qrCodeUrl} alt={`QR Code for session ${session.code}`} className="w-64 h-64" />
                </div>
                <button onClick={onClose} className="mt-8 px-6 py-2 bg-blue-500 text-white rounded-lg">
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default SessionModal;