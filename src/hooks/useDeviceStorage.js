import { useState, useEffect } from 'react';

export function useDeviceStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { 
      const item = window.localStorage.getItem(key); 
      return item ? JSON.parse(item) : initialValue; 
    } catch (error) { 
      return initialValue; 
    }
  });

  useEffect(() => { 
    try { 
      window.localStorage.setItem(key, JSON.stringify(value)); 
    } catch(e) {} 
  }, [key, value]);

  return [value, setValue];
}

