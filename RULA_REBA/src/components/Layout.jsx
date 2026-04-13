import React from 'react';
import { Activity, Camera, Upload, Home } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <nav className="glass sticky top-0 z-50 m-4 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
                    <Activity color="var(--primary-color)" size={28} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                        Ergo<span style={{ color: 'var(--primary-color)' }}>Analyze</span>
                    </h1>
                </div>

                <div className="flex gap-4">
                    <button
                        className={`btn ${activeTab === 'home' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('home')}
                    >
                        <Home size={18} /> Home
                    </button>
                    <button
                        className={`btn ${activeTab === 'live' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('live')}
                    >
                        <Camera size={18} /> Live Analysis
                    </button>
                    <button
                        className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-glass'}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload size={18} /> Upload
                    </button>
                </div>
            </nav>

            <main className="container flex-1 p-4 pb-24">
                {children}
            </main>

            {activeTab !== 'live' && (
                <footer className="fixed bottom-0 left-0 w-full p-4 text-center text-xs md:text-sm glass border-t border-white/10 z-50 backdrop-blur-md bg-black/50">
                    <p className="text-neon-blue font-bold tracking-wide" style={{ textShadow: '0 0 10px rgba(0, 243, 255, 0.5)' }}>Developed by: Dr. Arkaprabha Sau, MBBS, MD (Gold Medalist), PhD (Computer Science & Engineering), DPH, Dip. Geriatric Medicine, Certificate in Diabetes Management</p>
                </footer>
            )}
        </div>
    );
};

export default Layout;
