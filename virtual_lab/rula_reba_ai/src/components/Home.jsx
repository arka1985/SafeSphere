import React from 'react';
import { Camera, Upload } from 'lucide-react';

const Home = ({ onStart }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
            <div className="glass w-full max-w-6xl p-8 md:p-12 animate-fade-in flex flex-col gap-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{
                        background: 'linear-gradient(to right, #22d3ee, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Ergonomic Assessment AI
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Professional-grade RULA and REBA analysis powered by advanced computer vision.
                        Evaluate posture safety in real-time or from recorded media.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center my-4">
                    <button
                        className="btn btn-primary text-lg px-8 py-4 w-full sm:w-auto justify-center"
                        onClick={() => onStart('live')}
                    >
                        <Camera size={24} /> Start Live Analysis
                    </button>
                    <button
                        className="btn btn-glass text-lg px-8 py-4 w-full sm:w-auto justify-center"
                        onClick={() => onStart('upload')}
                    >
                        <Upload size={24} /> Upload Media
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-4">
                    <div className="glass-panel p-6 hover:bg-white/5 transition-colors">
                        <h3 className="text-cyan-400 font-bold text-xl mb-3">Real-time</h3>
                        <p className="text-gray-400 leading-relaxed">Instant feedback on posture with live webcam feed analysis. Detects risk levels immediately.</p>
                    </div>
                    <div className="glass-panel p-6 hover:bg-white/5 transition-colors">
                        <h3 className="text-violet-400 font-bold text-xl mb-3">RULA & REBA</h3>
                        <p className="text-gray-400 leading-relaxed">Comprehensive scoring for both upper limb (RULA) and entire body (REBA) assessment.</p>
                    </div>
                    <div className="glass-panel p-6 hover:bg-white/5 transition-colors">
                        <h3 className="text-pink-400 font-bold text-xl mb-3">Privacy First</h3>
                        <p className="text-gray-400 leading-relaxed">All processing happens locally on your device. No video is sent to the cloud.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
