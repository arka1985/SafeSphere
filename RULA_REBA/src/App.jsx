import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import CameraInput from './components/CameraInput';
import FileUpload from './components/FileUpload';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [analysisMode, setAnalysisMode] = useState('rula');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && <Home onStart={(tab) => setActiveTab(tab)} />}
      {activeTab === 'live' && (
        <div className="animate-fade-in w-full">
          <div className="flex justify-center mb-6 gap-4">
            <button
              className={`btn ${analysisMode === 'rula' ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setAnalysisMode('rula')}
            >
              RULA Analysis
            </button>
            <button
              className={`btn ${analysisMode === 'reba' ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setAnalysisMode('reba')}
            >
              REBA Analysis
            </button>
          </div>
          <CameraInput mode={analysisMode} />
        </div>
      )}
      {activeTab === 'upload' && (
        <div className="animate-fade-in w-full">
          <div className="flex justify-center mb-6 gap-4">
            <button
              className={`btn ${analysisMode === 'rula' ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setAnalysisMode('rula')}
            >
              RULA Analysis
            </button>
            <button
              className={`btn ${analysisMode === 'reba' ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setAnalysisMode('reba')}
            >
              REBA Analysis
            </button>
          </div>
          <FileUpload mode={analysisMode} />
        </div>
      )}
    </Layout>
  );
}

export default App;
