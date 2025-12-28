import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Mail,
  Save,
  KeyRound,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Camera,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameLoading, setNameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    setValue: setNameValue,
  } = useForm();
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch,
  } = useForm();

  const newPassword = watch("newPassword");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      setNameValue("displayName", user.user_metadata?.display_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setLoading(false);
    };
    getUser();
  }, [navigate, setNameValue]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    alert(text); // Popup alert to be more visible
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Upload Avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage("error", "Maximum file size is 2MB!");
      return;
    }

    setAvatarLoading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage (bucket: avatars)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting parameter
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting parameter to force refresh
      const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrlWithCache }
      });

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrlWithCache);
      showMessage("success", "Profile photo changed successfully!");
    } catch (error) {
      showMessage("error", "Failed to upload photo: " + error.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Update Display Name
  const onNameSubmit = async (data) => {
    setNameLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: data.displayName },
      });
      if (error) throw error;
      showMessage("success", "Name changed successfully!");
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setNameLoading(false);
    }
  };

  // Change Password
  const onPasswordSubmit = async (data) => {
    if (!data.currentPassword) {
      showMessage("error", "Current password is required!");
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      showMessage("error", "New passwords do not match!");
      return;
    }
    if (data.newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters!");
      return;
    }

    setPasswordLoading(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });
      if (signInError) {
        showMessage("error", "Current password is incorrect!");
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) throw error;
      showMessage("success", "Password changed successfully!");
      resetPasswordForm();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Send Password Reset Email
  const handleResetPassword = async () => {
    if (!user?.email) return;

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showMessage(
        "success",
        "Password reset link has been sent to your email!"
      );
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-orange"></div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-20 border-b border-neutral-800 px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div
          className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/50 text-green-400"
              : "bg-red-500/20 border border-red-500/50 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <div className="p-6 space-y-8 max-w-2xl">
        {/* User Info Card */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-sc-orange to-purple-600 flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-white" />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-full">
                  {avatarLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user?.user_metadata?.display_name || "User"}
              </h2>
              <p className="text-neutral-400 text-sm flex items-center gap-2">
                <Mail size={14} /> {user?.email}
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                Click avatar to change photo
              </p>
            </div>
          </div>
          <p className="text-neutral-500 text-xs">
            Member since{" "}
            {new Date(user?.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Change Name Section */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-sc-orange" /> Change Display Name
          </h3>
          <form onSubmit={handleNameSubmit(onNameSubmit)} className="space-y-4">
            <input
              {...registerName("displayName")}
              placeholder="Display Name"
              className="w-full rounded-md bg-neutral-700 border border-neutral-600 px-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-400 transition"
            />
            <button
              type="submit"
              disabled={nameLoading}
              className="bg-sc-orange text-white font-bold py-3 px-6 rounded-full hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              {nameLoading ? "Saving..." : "Save Name"}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock size={20} className="text-sc-orange" /> Change Password
          </h3>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <input
              {...registerPassword("currentPassword", { required: true })}
              type="password"
              placeholder="Current Password"
              className="w-full rounded-md bg-neutral-700 border border-neutral-600 px-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-400 transition"
            />
            <input
              {...registerPassword("newPassword", { required: true })}
              type="password"
              placeholder="New Password"
              className="w-full rounded-md bg-neutral-700 border border-neutral-600 px-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-400 transition"
            />
            <input
              {...registerPassword("confirmPassword", { required: true })}
              type="password"
              placeholder="Confirm New Password"
              className="w-full rounded-md bg-neutral-700 border border-neutral-600 px-4 py-3 text-sm focus:outline-none focus:border-sc-orange text-white placeholder:text-neutral-400 transition"
            />
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-sc-orange text-white font-bold py-3 px-6 rounded-full hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Lock size={18} />
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Reset Password via Email Section */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <KeyRound size={20} className="text-sc-orange" /> Reset Password via
            Email
          </h3>
          <p className="text-neutral-400 text-sm mb-4">
            Send a password reset link to your email ({user?.email}). The link will
            be active for 24 hours.
          </p>
          <button
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="bg-neutral-700 text-white font-bold py-3 px-6 rounded-full hover:bg-neutral-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Mail size={18} />
            {resetLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
