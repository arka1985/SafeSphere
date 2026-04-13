import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { calculateRULAScore } from '../utils/rula';
import { calculateREBAScore } from '../utils/reba';

const CameraInput = ({ mode = 'rula' }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [score, setScore] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [side, setSide] = useState('right');
    const requestRef = useRef();
    const poseRef = useRef(null);

    const onResults = useCallback((results) => {
        if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) return;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

        // Draw video
        canvasCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

        if (results.poseLandmarks) {
            // Glow Effect
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = '#00f3ff'; // Neon Cyan Glow

            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                { color: '#00f3ff', lineWidth: 4 }); // Neon Blue Lines

            canvasCtx.shadowColor = '#ff00ff'; // Neon Pink Glow
            drawLandmarks(canvasCtx, results.poseLandmarks,
                { color: '#ff00ff', lineWidth: 2, radius: 4 }); // Neon Pink Points

            canvasCtx.shadowBlur = 0; // Reset shadow

            const currentScore = mode === 'rula'
                ? calculateRULAScore(results.poseLandmarks, side)
                : calculateREBAScore(results.poseLandmarks, side);

            setScore(currentScore);
        }
        canvasCtx.restore();
    }, [mode, side]);

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        return () => {
            if (poseRef.current) {
                poseRef.current.close();
                poseRef.current = null;
            }
        };
    }, [onResults]);

    const animate = useCallback(async () => {
        if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4 &&
            poseRef.current
        ) {
            await poseRef.current.send({ image: webcamRef.current.video });
        }
        requestRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        if (cameraReady) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [cameraReady, animate]);

    return (
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Loading Camera...
                    </div>
                )}
                <Webcam
                    ref={webcamRef}
                    className="hidden"
                    width={1280}
                    height={720}
                    onUserMedia={() => setCameraReady(true)}
                />
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                />

                {cameraReady && (
                    <>
                        {/* Score Display */}
                        <div className="fixed top-24 right-4 md:right-8 glass p-4 text-white min-w-[250px] max-w-[300px] animate-fade-in z-[100] border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <h3 className="font-bold text-xl mb-1 border-b border-gray-600 pb-1 text-neon-blue">{mode.toUpperCase()} Score</h3>
                            <div className="flex items-center justify-between mt-2 mb-2">
                                <span className="text-4xl font-bold text-neon-pink">{score ? score.score : '--'}</span>
                                <span className="px-3 py-1 rounded-full text-sm font-bold text-center" style={{ backgroundColor: score ? score.color : 'gray', color: '#000' }}>
                                    {score ? score.level : 'Detecting...'}
                                </span>
                            </div>
                            {score && (
                                <div className="mt-2 text-xs text-gray-300 border-t border-gray-600 pt-2">
                                    <p className="font-bold text-cyan-400 mb-1">Action Level: {score.actionLevel}</p>
                                    <p>{score.recommendation}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CameraInput;
