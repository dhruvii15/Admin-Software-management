import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

const VideoPreviewModal = ({ show, onHide, videos, currentIndex, onNavigate }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!show) return;

            if (e.key === 'ArrowLeft') {
                onNavigate(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                onNavigate(currentIndex + 1);
            } else if (e.key === 'Escape') {
                onHide();
            } else if (e.key === ' ') {
                togglePlayPause();
                e.preventDefault(); // Prevent page scrolling on spacebar
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [show, currentIndex, onNavigate, onHide, isPlaying]);

    // Auto-play video when opened or navigated
    useEffect(() => {
        if (show && videoRef.current) {
            videoRef.current.load();
            // Optional: Auto-play
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.log("Auto-play prevented:", error);
                setIsPlaying(false);
            });
        }
    }, [show, currentIndex, videos]);

    // Clean up when modal closes
    useEffect(() => {
        if (!show && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [show]);

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    if (!show || !videos.length) return null;

    const currentVideo = videos[currentIndex];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-99999">
            <div className="relative w-50 h-full flex items-center justify-center">
                {/* Close Button */}
                <button 
                    onClick={onHide} 
                    className="absolute top-4 right-4 bg-gray-800 text-white rounded-full focus:outline-none hover:bg-white hover:text-black h-10 w-10 flex items-center justify-center z-10"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
                
                {/* Video Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <video 
                        ref={videoRef}
                        className="max-w-full max-h-full object-contain"
                        onClick={togglePlayPause}
                    >
                        <source src={currentVideo.Video} type="video/mp4" />
                        Your browser does not support the video element.
                    </video>
                    
                    {/* Play/Pause Button (shown on hover) */}
                    <button
                        onClick={togglePlayPause}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                   bg-black bg-opacity-50 text-white rounded-full w-16 h-16 
                                   flex items-center justify-center opacity-0 hover:opacity-100 
                                   transition-opacity duration-200"
                    >
                        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Left Navigation Button */}
                {currentIndex > 0 && (
                    <button
                        onClick={() => onNavigate(currentIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 
                                rounded-full shadow-lg hover:bg-gray-200 h-10 w-10 flex items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                    </button>
                )}

                {/* Right Navigation Button */}
                {currentIndex < videos.length - 1 && (
                    <button
                        onClick={() => onNavigate(currentIndex + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 
                                rounded-full shadow-lg hover:bg-gray-200 h-10 w-10 flex items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoPreviewModal;