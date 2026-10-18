import React, { useState } from 'react';
import { Lock, Mail, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      onAuthSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication request failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 mb-3">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-xl text-slate-900">
            {isSignUp ? 'Create Staff Account' : 'Sign In to BrightPath'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access academy counselling and admissions pipeline
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Counsellor Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="counsellor@brightpath.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all mt-2"
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New counsellor? Create an account'}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
