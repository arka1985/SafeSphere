import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Play, Pause } from 'lucide-react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { calculateRULAScore } from '../utils/rula';
import { calculateREBAScore } from '../utils/reba';

const FileUpload = ({ mode = 'rula' }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [score, setScore] = useState(null);
    const [side, setSide] = useState('right');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = (file) => {
        setFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsVideo(file.type.startsWith('video/'));
        setScore(null);

        // Reset canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    useEffect(() => {
        // Draw initial preview on canvas when loaded
        if (file && !analyzing && canvasRef.current) {
            const img = new Image();
            img.src = preview;
            img.onload = () => {
                if (canvasRef.current) {
                    canvasRef.current.width = img.width;
                    canvasRef.current.height = img.height;
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                }
            }
        }
    }, [preview, file, analyzing]);

    const analyzeImage = async () => {
        if (!imageRef.current) return;
        setAnalyzing(true);

        const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
            drawResults(results);
            setAnalyzing(false);
        });

        await pose.send({ image: imageRef.current });
    };

    const drawResults = (results) => {
        if (!canvasRef.current) return;
        const canvasCtx = canvasRef.current.getContext('2d');
        const width = isVideo ? videoRef.current.videoWidth : imageRef.current.naturalWidth;
        const height = isVideo ? videoRef.current.videoHeight : imageRef.current.naturalHeight;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        // Draw original image/frame
        canvasCtx.drawImage(results.image, 0, 0, width, height);

        if (results.poseLandmarks) {
            // Glow Effect
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = '#00f3ff'; // Neon Cyan

            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00f3ff', lineWidth: 4 });

            canvasCtx.shadowColor = '#ff00ff'; // Neon Pink
            drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#ff00ff', lineWidth: 2, radius: 4 });

            canvasCtx.shadowBlur = 0;

            const currentScore = mode === 'rula'
                ? calculateRULAScore(results.poseLandmarks, side)
                : calculateREBAScore(results.poseLandmarks, side);
            setScore(currentScore);
        }
        canvasCtx.restore();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            {!file ? (
                <div
                    className="glass p-12 border-2 border-dashed border-gray-500 rounded-xl text-center cursor-pointer hover:border-cyan-400 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">Drag & Drop or Click to Upload</h3>
                    <p className="text-gray-400">Supports Images and Videos</p>
                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-full max-h-[60vh] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                        {isVideo ? (
                            <video ref={videoRef} src={preview} className="hidden" controls />
                        ) : (
                            <img ref={imageRef} src={preview} className="hidden" alt="Upload" />
                        )}
                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            <button className="btn btn-glass" onClick={() => setFile(null)}>
                                <X size={18} /> Clear
                            </button>
                            {!isVideo && (
                                <button className="btn btn-primary" onClick={analyzeImage} disabled={analyzing}>
                                    {analyzing ? 'Analyzing...' : 'Analyze Image'}
                                </button>
                            )}
                            {isVideo && (
                                <button className="btn btn-primary" onClick={() => alert('Video analysis coming soon')}>
                                    Analyze Video
                                </button>
                            )}
                        </div>
                    </div>

                    {score && (
                        <div className="glass p-6 w-full max-w-md animate-fade-in">
                            <h3 className="font-bold text-xl mb-2 text-neon-blue">{mode.toUpperCase()} Score</h3>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl font-bold text-neon-pink">{score.score}</span>
                                <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: score.color, color: '#000' }}>
                                    {score.level}
                                </span>
                            </div>
                            <div className="text-sm text-gray-300 border-t border-gray-600 pt-4">
                                <p className="font-bold text-cyan-400 mb-1">Action Level: {score.actionLevel}</p>
                                <p>{score.recommendation}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
