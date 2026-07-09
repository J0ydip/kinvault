import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Vault, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      } else if (!isLogin) {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left side: High impact branding, stark black with electric blue accents */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black border-r border-white/10 items-center justify-center overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 px-20 flex flex-col items-start"
        >
          <div className="w-16 h-16 bg-primary flex items-center justify-center mb-8">
            <Vault className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-6xl font-bold tracking-tighter text-white mb-6">
            Private.<br/>
            Secure.<br/>
            <span className="text-primary">Yours.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-md">
            The minimalist, self-hosted vault for your personal media collection.
          </p>
        </motion.div>
      </div>

      {/* Right side: Minimalist stark form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden w-12 h-12 bg-primary flex items-center justify-center mb-8">
            <Vault className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-3xl font-bold mb-2">
            {isLogin ? 'Access Vault' : 'Initialize Vault'}
          </h2>
          <p className="text-white/50 mb-10 text-sm uppercase tracking-widest font-heading">
            {isLogin ? 'Enter your credentials' : 'Create new administrator'}
          </p>

          {error && (
            <div className={`p-4 mb-6 border ${error.includes('successful') ? 'border-primary text-primary' : 'border-red-500 text-red-500'} bg-black`}>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/50 font-heading">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/50 font-heading">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 flex justify-center uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Authenticate' : 'Establish')}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-white/50 hover:text-primary transition-colors focus:outline-none uppercase tracking-widest font-heading"
            >
              {isLogin ? 'Need an account? Initialize here.' : 'Already established? Authenticate here.'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
