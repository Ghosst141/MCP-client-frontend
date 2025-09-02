import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';


export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_DATABASE_BE_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
      <div className='separator'>
        <span className='separator-text'>OR</span>
      </div>
      <div className="social-logins">
        <button onClick={() => window.location.href = `${baseURL}/api/auth/google`}>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="none" viewBox="0 0 24 24" className="m"><g id="google"><g id="google-vector" fill-rule="evenodd" clip-rule="evenodd"><path id="Shape" fill="#4285F4" d="M20.64 12.205q-.002-.957-.164-1.84H12v3.48h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615"></path><path id="Shape_2" fill="#34A853" d="M12 21c2.43 0 4.468-.806 5.957-2.18L15.05 16.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H3.958v2.332A9 9 0 0 0 12.001 21"></path><path id="Shape_3" fill="#FBBC05" d="M6.964 13.712a5.4 5.4 0 0 1-.282-1.71c0-.593.102-1.17.282-1.71V7.96H3.957A9 9 0 0 0 3 12.002c0 1.452.348 2.827.957 4.042z"></path><path id="Shape_4" fill="#EA4335" d="M12 6.58c1.322 0 2.508.455 3.441 1.346l2.582-2.58C16.463 3.892 14.427 3 12 3a9 9 0 0 0-8.043 4.958l3.007 2.332c.708-2.127 2.692-3.71 5.036-3.71"></path></g></g></svg>
          </span>Login with Google</button>
        <button onClick={() => window.location.href = `${baseURL}/api/auth/github`}>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="none"><path fill="currentColor" d="M12 0a12 12 0 0 0-3.84 23.399c.608.112.832-.256.832-.576v-2.015c-3.395.736-4.115-1.632-4.115-1.632a3.241 3.241 0 0 0-1.359-1.792c-1.104-.736.064-.736.064-.736a2.566 2.566 0 0 1 1.824 1.216a2.638 2.638 0 0 0 3.616 1.024a2.607 2.607 0 0 1 .768-1.6c-2.688-.32-5.504-1.344-5.504-5.984a4.677 4.677 0 0 1 1.216-3.168a4.383 4.383 0 0 1 .128-3.136s1.024-.32 3.36 1.216a11.66 11.66 0 0 1 6.112 0c2.336-1.536 3.36-1.216 3.36-1.216a4.354 4.354 0 0 1 .128 3.136a4.628 4.628 0 0 1 1.216 3.168c0 4.672-2.848 5.664-5.536 5.952a2.881 2.881 0 0 1 .832 2.24v3.36c0 .32.224.672.832.576A12 12 0 0 0 12 0z"></path></svg>
          </span>
          Login with GitHub</button>
      </div>
    </div>
  );
}


