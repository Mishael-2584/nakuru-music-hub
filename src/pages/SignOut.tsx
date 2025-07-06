import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const SignOut = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
        console.log('Successfully signed out');
        navigate('/auth', { replace: true });
      } catch (error) {
        console.error('Error signing out:', error);
        // Force redirect anyway
        navigate('/auth', { replace: true });
      }
    };

    performSignOut();
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-lg text-muted-foreground font-semibold">
          Signing you out...
        </div>
      </div>
    </div>
  );
};

export default SignOut; 