import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';
import Modal from './Modal';
import api from '../services/api'; // Kita akan gunakan instance axios kita

const BubbleQuizCreationModal = ({ isOpen, onClose, onSubmit, slide }) => {
    const [question, setQuestion] = useState('');
    const [areas, setAreas] = useState([]);
    
    // State BARU untuk menangani gambar secara manual
    const [imageElement, setImageElement] = useState(null);
    const [imageStatus, setImageStatus] = useState('idle');

    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    // useEffect BARU untuk memuat gambar menggunakan axios/fetch
    useEffect(() => {
        if (isOpen && slide?.content_url) {
            setImageStatus('loading');
            const imageUrl = `${api.defaults.baseURL}/${slide.content_url}`;
            
            // Gunakan fetch untuk mengambil gambar sebagai blob
            fetch(imageUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const imageObj = new window.Image();
                    imageObj.src = URL.createObjectURL(blob);
                    imageObj.onload = () => {
                        setImageElement(imageObj);
                        setImageStatus('loaded');
                    };
                    imageObj.onerror = () => {
                        setImageStatus('failed');
                    };
                })
                .catch(error => {
                    console.error('Error fetching image:', error);
                    setImageStatus('failed');
                });

        } else {
            setImageElement(null);
            setImageStatus('idle');
        }
    }, [isOpen, slide?.content_url]); // Bergantung pada isOpen dan URL gambar

    // useEffect untuk menghitung ukuran kanvas setelah gambar dimuat
    useEffect(() => {
        if (imageStatus === 'loaded' && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const scale = containerWidth / imageElement.width;
            setSize({
                width: containerWidth,
                height: imageElement.height * scale
            });
        }
    }, [imageStatus, imageElement]);
    
    // Reset form saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            if (slide?.settings?.question && slide?.settings?.correct_areas) {
                setQuestion(slide.settings.question);
                setAreas(slide.settings.correct_areas);
            } else {
                setQuestion('');
                setAreas([]);
            }
        }
    }, [isOpen, slide]);

    const handleStageClick = (e) => {
        if (areas.length >= 5) {
            alert("You can add a maximum of 5 correct areas.");
            return;
        }
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        
        const newArea = {
            x: pos.x / size.width,
            y: pos.y / size.height,
            r: 0.05
        };
        setAreas([...areas, newArea]);
    };

    const removeLastArea = () => {
        setAreas(areas.slice(0, -1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (areas.length === 0) {
            alert("Please define at least one correct area by clicking on the image.");
            return;
        }
        onSubmit({ question, correct_areas: areas });
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Add Bubble Quiz to Slide ${slide?.page_number}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="bubble-quiz-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
                    <input
                        type="text"
                        id="bubble-quiz-question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Click on the correct engine part"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm"
                        required
                    />
                </div>

                <div ref={containerRef} className="w-full bg-gray-200 dark:bg-gray-900 cursor-pointer rounded-md overflow-hidden">
                    {imageStatus === 'loaded' ? (
                        <Stage width={size.width} height={size.height} onClick={handleStageClick}>
                            <Layer>
                                <Image image={imageElement} width={size.width} height={size.height} />
                                {areas.map((area, index) => (
                                    <Circle
                                        key={index}
                                        x={area.x * size.width}
                                        y={area.y * size.height}
                                        radius={area.r * size.width}
                                        fill="rgba(59, 130, 246, 0.6)"
                                        stroke="rgba(37, 99, 235, 1)"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    ) : (
                        <div className="w-full aspect-video flex items-center justify-center">
                            <p className="text-gray-500">{imageStatus === 'loading' ? 'Loading image...' : 'Could not load image.'}</p>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click on the image to add or remove areas.</p>
                    {areas.length > 0 && (
                        <button type="button" onClick={removeLastArea} className="text-sm text-red-600 hover:underline">
                            Remove Last Area
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Save Bubble Quiz</button>
                </div>
            </form>
        </Modal>
    );
};

export default BubbleQuizCreationModal;