/**
 * Register Page — admin registration with glassmorphism
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FloatingOrbs from '../components/common/FloatingOrbs';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password)
      return toast.error('Please fill in all required fields');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to LearningHUB');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <FloatingOrbs />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(59,80,224,0.3)]">
            <HiOutlineAcademicCap className="text-white text-3xl" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create Admin Account</h1>
          <p className="text-dark-300 mt-2 text-sm">Set up your LearningHUB instance</p>
        </div>

        <div className="glass-medium rounded-2xl p-8 glow-sapphire">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  placeholder="John Doe" className="input-glass pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Username *</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)}
                  placeholder="admin" className="input-glass pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email *</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="admin@example.com" className="input-glass pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Password *</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 6 characters" className="input-glass pl-10" required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-400">
              Already have an account?{' '}
              <Link to="/login" className="text-sapphire-400 hover:text-sapphire-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
