import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useForm } from 'react-hook-form';
import { KeyRound, CheckCircle, AlertCircle, Lock } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const { register, handleSubmit, watch } = useForm();
  const newPassword = watch('newPassword');

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setCheckingSession(false);
    };

    // Listen for auth state changes (when user clicks reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setCheckingSession(false);
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      showMessage('error', 'Password tidak cocok!');
      return;
    }
    if (data.newPassword.length < 6) {
      showMessage('error', 'Password minimal 6 karakter!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      if (error) throw error;
      
      showMessage('success', 'Password berhasil diubah! Mengalihkan ke home...');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-orange"></div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 md:p-10 flex flex-col items-center text-center max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
          
          <div className="mb-6 bg-red-500/10 p-4 rounded-full">
            <AlertCircle size={64} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h1>
          
          <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
            Link reset password tidak valid atau sudah expired. Silakan request link baru.
          </p>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-sc-orange text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-black p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 md:p-10 flex flex-col items-center text-center max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sc-orange to-purple-600"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sc-orange/10 rounded-full blur-2xl"></div>

        {/* Icon */}
        <div className="mb-6 bg-sc-orange/10 p-4 rounded-full">
          <KeyRound size={48} className="text-sc-orange" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        
        <p className="text-neutral-400 mb-6 text-sm">
          Masukkan password baru untuk akun Anda.
        </p>

        {/* Message */}
        {message.text && (
          <div className={`w-full mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              {...register('newPassword', { required: true })}
              type="password"
              placeholder="New Password"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-500 transition"
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              {...register('confirmPassword', { required: true })}
              type="password"
              placeholder="Confirm New Password"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-500 transition"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sc-orange text-white font-bold py-3 px-6 rounded-full hover:opacity-90 transition disabled:opacity-50 shadow-[0_4px_14px_0_rgba(255,85,0,0.39)]"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;
