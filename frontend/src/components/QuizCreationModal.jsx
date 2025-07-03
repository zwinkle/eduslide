// frontend/src/components/QuizCreationModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const QuizCreationModal = ({ isOpen, onClose, onSubmit, slide }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [correctAnswer, setCorrectAnswer] = useState('');

    useEffect(() => {
        if (isOpen && slide?.interactive_type === 'quiz') {
            setQuestion(slide.settings.question || '');
            setOptions(slide.settings.options || ['', '']);
            setCorrectAnswer(slide.settings.correct_answer || '');
        } else if (isOpen) {
            setQuestion('');
            setOptions(['', '']);
            setCorrectAnswer('');
        }
    }, [isOpen, slide]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        const oldOptionValue = newOptions[index];
        newOptions[index] = value;
        setOptions(newOptions);
        if (correctAnswer === oldOptionValue) {
            setCorrectAnswer('');
        }
    };

    const addOption = () => {
        if (options.length < 8) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const currentOptionValue = options[index];
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            if (correctAnswer === currentOptionValue) {
                setCorrectAnswer('');
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            alert("Please provide at least two valid options.");
            return;
        }
        if (!correctAnswer || !validOptions.includes(correctAnswer)) {
            alert("Please select a correct answer from the valid options.");
            return;
        }
        onSubmit({ question, options: validOptions, correct_answer: correctAnswer });
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={slide?.interactive_type === 'quiz' ? `Edit Quiz on Slide ${slide.page_number}` : `Add Quiz to Slide ${slide?.page_number}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="quiz-question-edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quiz Question</label>
                    <input
                        type="text"
                        id="quiz-question-edit"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options (Select the correct answer)</label>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 mt-2">
                            <input
                                type="radio"
                                name="correct_answer_radio"
                                value={option}
                                disabled={!option.trim()} 
                                checked={correctAnswer === option && option.trim() !== ''}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm"
                            />
                            <button type="button" onClick={() => removeOption(index)} disabled={options.length <= 2} className="px-2 py-1 bg-red-500 text-white rounded disabled:bg-gray-300">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addOption} disabled={options.length >= 8} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400">+ Add Option</button>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Save Quiz</button>
                </div>
            </form>
        </Modal>
    );
};

export default QuizCreationModal;