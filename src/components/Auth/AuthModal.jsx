import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../services/supabaseClient';
import useAuthModal from '../../hooks/useAuthModal';
import { X, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const AuthModal = () => {
  const { onClose, isOpen } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [variant, setVariant] = useState('LOGIN'); // 'LOGIN', 'REGISTER', atau 'FORGOT'
  const [resetSent, setResetSent] = useState(false);

  const { register, handleSubmit, reset, getValues } = useForm();

  const toggleVariant = () => {
    setVariant(variant === 'LOGIN' ? 'REGISTER' : 'LOGIN');
    setResetSent(false);
  };

  const showForgotPassword = () => {
    setVariant('FORGOT');
    setResetSent(false);
  };

  const backToLogin = () => {
    setVariant('LOGIN');
    setResetSent(false);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (variant === 'FORGOT') {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setResetSent(true);
      } else if (variant === 'REGISTER') {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        alert('Cek email Anda untuk verifikasi!');
        onClose();
        reset();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        window.location.reload();
        onClose();
        reset();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-800 border border-neutral-700 w-full md:w-[450px] p-6 rounded-md shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-neutral-400 hover:text-white">
          <X size={20}/>
        </button>
        
        {/* Forgot Password View */}
        {variant === 'FORGOT' ? (
          <>
            <button 
              onClick={backToLogin} 
              className="flex items-center gap-1 text-neutral-400 hover:text-white text-sm mb-4"
            >
              <ArrowLeft size={16} /> Back to login
            </button>
            
            {resetSent ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-neutral-400 text-sm mb-4">
                  We've sent a password reset link to <span className="text-white">{getValues('email')}</span>
                </p>
                <p className="text-neutral-500 text-xs">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 bg-sc-orange/20 rounded-full flex items-center justify-center">
                    <Mail size={24} className="text-sc-orange" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Forgot password?</h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                  <input
                    {...register('email', { required: true })}
                    placeholder="Email address"
                    type="email"
                    className="w-full rounded-md bg-neutral-700 border-transparent px-3 py-3 text-sm focus:outline-none text-white placeholder:text-neutral-400"
                  />
                  <button 
                    disabled={isLoading} 
                    className="w-full rounded-full bg-sc-orange text-white font-bold py-3 hover:opacity-80 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          /* Login / Register View */
          <>
            <h2 className="text-3xl font-bold text-center mb-6 text-white">
              {variant === 'LOGIN' ? 'Welcome back' : 'Create an account'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
              <input
                {...register('email', { required: true })}
                placeholder="Email address"
                className="w-full rounded-md bg-neutral-700 border-transparent px-3 py-3 text-sm file:border-0 focus:outline-none text-white placeholder:text-neutral-400"
              />
              <input
                {...register('password', { required: true })}
                type="password"
                placeholder="Password"
                className="w-full rounded-md bg-neutral-700 border-transparent px-3 py-3 text-sm file:border-0 focus:outline-none text-white placeholder:text-neutral-400"
              />
              
              {/* Forgot Password Link - Only show on LOGIN */}
              {variant === 'LOGIN' && (
                <button 
                  type="button"
                  onClick={showForgotPassword}
                  className="text-neutral-400 hover:text-white text-sm text-right -mt-2"
                >
                  Forgot password?
                </button>
              )}
              
              <button 
                disabled={isLoading} 
                className="w-full rounded-full bg-sc-orange text-white font-bold py-3 hover:opacity-80 transition disabled:opacity-50"
              >
                {variant === 'LOGIN' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <div className="text-neutral-400 text-center mt-4 text-sm">
              {variant === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
              <span onClick={toggleVariant} className="text-white hover:underline cursor-pointer font-bold">
                {variant === 'LOGIN' ? "Sign up" : "Log in"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
