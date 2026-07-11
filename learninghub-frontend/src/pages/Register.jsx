/** Student registration with email OTP verification. */

import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineAcademicCap, HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlineMail, HiOutlineUser } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FloatingOrbs from '../components/common/FloatingOrbs';

const EMPTY_CODE = ['', '', '', '', '', ''];

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [step, setStep] = useState('register');
  const [code, setCode] = useState(EMPTY_CODE);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const { initiateRegistration, verifyRegistration, resendRegistrationCode } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const initiate = async (event) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.password) return toast.error('Please fill in every field');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await initiateRegistration(form);
      setStep('otp');
      setCode(EMPTY_CODE);
      toast.success('Verification code sent. Check your inbox and spam folder.');
      setTimeout(() => inputs.current[0]?.focus(), 0);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not initiate registration');
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    setCode([...digits, ...EMPTY_CODE].slice(0, 6));
    inputs.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const verify = async (event) => {
    event.preventDefault();
    const value = code.join('');
    if (value.length !== 6) return toast.error('Enter all 6 digits');

    setLoading(true);
    try {
      await verifyRegistration(form.email, value);
      setStep('success');
      toast.success('Email verified — welcome to LearningHUB!');
      setTimeout(() => navigate('/student'), 1400);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      await resendRegistrationCode(form.email);
      setCode(EMPTY_CODE);
      toast.success('New code sent. Please also check your spam folder.');
      inputs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not resend the code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <FloatingOrbs />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(59,80,224,0.3)]">
            <HiOutlineAcademicCap className="text-white text-3xl" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create Student Account</h1>
          <p className="text-dark-300 mt-2 text-sm">{step === 'otp' ? `We sent a code to ${form.email}` : step === 'success' ? 'Your account is ready' : 'Sign up to access your courses'}</p>
        </div>

        <div className="glass-medium rounded-2xl p-8 glow-sapphire">
          {step === 'register' && (
            <form onSubmit={initiate} className="space-y-4">
              <Field label="Name" icon={HiOutlineUser} type="text" value={form.fullName} onChange={(value) => update('fullName', value)} placeholder="John Doe" />
              <Field label="Email" icon={HiOutlineMail} type="email" value={form.email} onChange={(value) => update('email', value)} placeholder="john@example.com" />
              <Field label="Password" icon={HiOutlineLockClosed} type="password" value={form.password} onChange={(value) => update('password', value)} placeholder="Min 6 characters" />
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {loading ? <Spinner /> : 'INITIATE REGISTRATION'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verify}>
              <p className="text-center text-sm text-dark-300 mb-5">Enter the six-digit code. Check your spam folder if it is not in your inbox.</p>
              <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input key={index} ref={(element) => { inputs.current[index] = element; }} value={digit} inputMode="numeric" maxLength="1"
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus(); }}
                    className="h-12 w-full rounded-xl border border-white/10 bg-dark-900/60 text-center text-xl font-semibold text-white outline-none focus:border-sapphire-400" aria-label={`Verification digit ${index + 1}`} />
                ))}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center disabled:opacity-50">{loading ? <Spinner /> : 'VERIFY CODE'}</button>
              <button type="button" onClick={resend} disabled={loading} className="mt-5 w-full text-sm text-sapphire-400 hover:text-sapphire-300 disabled:opacity-50">Resend code</button>
            </form>
          )}

          {step === 'success' && (
            <div className="py-6 text-center">
              <HiOutlineCheckCircle className="mx-auto mb-4 text-6xl text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Registration successful</h2>
              <p className="mt-2 text-sm text-dark-300">Signing you in and redirecting to your courses…</p>
            </div>
          )}

          {step !== 'success' && <div className="mt-6 text-center"><p className="text-sm text-dark-400">Already have an account? <Link to="/login" className="text-sapphire-400 hover:text-sapphire-300 font-medium">Sign in</Link></p></div>}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, icon: Icon, type, value, onChange, placeholder }) {
  return <div><label className="block text-sm font-medium text-dark-200 mb-2">{label}</label><div className="relative"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-glass pl-10" required /></div></div>;
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
