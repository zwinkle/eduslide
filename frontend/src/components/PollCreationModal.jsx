import React, { useState } from 'react';
import Modal from './Modal';

const PollCreationModal = ({ isOpen, onClose, onSubmit, slide }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']); // Mulai dengan 2 pilihan

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 8) { // Batasi maksimal 8 pilihan
            setOptions([...options, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) { // Minimal harus ada 2 pilihan
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Filter opsi yang kosong sebelum submit
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            alert("Please provide at least two valid options.");
            return;
        }
        onSubmit({ question, options: validOptions });
    };

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Add Poll to Slide ${slide?.page_number}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700">Poll Question</label>
                    <input
                        type="text"
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 mt-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => removeOption(index)}
                                disabled={options.length <= 2}
                                className="px-2 py-1 bg-red-500 text-white rounded disabled:bg-gray-300"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addOption} disabled={options.length >= 8} className="mt-2 text-sm text-blue-600 hover:underline disabled:text-gray-400">
                        + Add Option
                    </button>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg">Save Poll</button>
                </div>
            </form>
        </Modal>
    );
};

export default PollCreationModal;