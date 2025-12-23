import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../services/supabaseClient';
import useAuthModal from '../../hooks/useAuthModal';
import { X } from 'lucide-react';

const AuthModal = () => {
  const { onClose, isOpen } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [variant, setVariant] = useState('LOGIN'); // Bisa 'LOGIN' atau 'REGISTER'

  const { register, handleSubmit, reset } = useForm();

  const toggleVariant = () => {
    setVariant(variant === 'LOGIN' ? 'REGISTER' : 'LOGIN');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (variant === 'REGISTER') {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        alert('Cek email Anda untuk verifikasi!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        // Login berhasil, modal tertutup otomatis
        window.location.reload(); // Refresh sederhana untuk update state
      }
      onClose();
      reset();
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
      </div>
    </div>
  );
};

export default AuthModal;