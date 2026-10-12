import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { adminDataContext } from '../context/AdminContext';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function AdminProtectWrapper({ children }) {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { setAdmin } = useContext(adminDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get(`${API_URL}/adminProfile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setAdmin(response.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [token, navigate, setAdmin]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
