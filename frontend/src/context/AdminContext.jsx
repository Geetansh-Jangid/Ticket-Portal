import { useState, createContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const adminDataContext = createContext();

export default function AdminContext({ children }) {
  const [admin, setAdmin] = useState({ email: '', name: '', role: '' });

  return (
    <adminDataContext.Provider value={{ admin, setAdmin }}>
      {children}
    </adminDataContext.Provider>
  );
}
