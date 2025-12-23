import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .maybeSingle();
          
        setIsAdmin(data?.is_admin || false);
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  return { isAdmin, loading };
};

export default useAdmin;