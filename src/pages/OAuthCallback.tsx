import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setToken } from '../services/Auth';

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setToken(token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [location.search]);

  return <div />;
}







