import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Music } from 'lucide-react';

const VerifySuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex items-center justify-center bg-black p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 md:p-10 flex flex-col items-center text-center max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Dekorasi Background Glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sc-orange to-purple-600"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sc-orange/10 rounded-full blur-2xl"></div>

        {/* Icon Sukses */}
        <div className="mb-6 bg-green-500/10 p-4 rounded-full">
          <CheckCircle size={64} className="text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
        
        <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
          Your email has been successfully verified. You now have full access to upload songs, create playlists, and build your library.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="w-full bg-sc-orange text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition shadow-[0_4px_14px_0_rgba(255,85,0,0.39)] flex items-center justify-center gap-2"
        >
          <Music size={20} /> Start Listening
        </button>
        
      </div>
    </div>
  );
};

export default VerifySuccess;