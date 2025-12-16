import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface PasswordChangePromptProps {
  onPasswordChanged: () => void;
}

const PasswordChangePrompt: React.FC<PasswordChangePromptProps> = ({ onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { toast } = useToast();

  // Handle password reset hash fragments on mount
  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initializeSession = async () => {
      try {
        // Check if there's a hash fragment in the URL (from password reset email)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'recovery') {
          // This is a password reset link - Supabase will automatically handle the session
          console.log('Password reset link detected, establishing session...');
          
          // Set up auth state listener to catch session when it's established
          const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
            
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
              if (session && mounted) {
                console.log('Session established via auth state change');
                setSessionReady(true);
                setInitializing(false);
                // Clear the hash from URL for security
                window.history.replaceState(null, '', window.location.pathname);
                if (authSubscription) {
                  authSubscription.unsubscribe();
                }
              }
            }
          });
          
          subscription = authSubscription;
          
          // Try to get session immediately (Supabase should parse hash automatically)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            if (mounted) {
              setError('Invalid or expired reset link. Please request a new password reset.');
              setInitializing(false);
            }
            if (subscription) {
              subscription.unsubscribe();
            }
            return;
          }
          
          if (session) {
            console.log('Session established successfully on first try');
            if (mounted) {
              setSessionReady(true);
              setInitializing(false);
              // Clear the hash from URL for security
              window.history.replaceState(null, '', window.location.pathname);
            }
            if (subscription) {
              subscription.unsubscribe();
            }
          } else {
            // Wait a bit for Supabase to process the hash fragments
            console.log('No session yet, waiting for hash processing...');
            setTimeout(async () => {
              if (mounted) {
                const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
                if (retrySession) {
                  console.log('Session established on retry');
                  setSessionReady(true);
                  window.history.replaceState(null, '', window.location.pathname);
                } else if (retryError) {
                  console.error('Retry session error:', retryError);
                  setError('Invalid or expired reset link. Please request a new password reset.');
                } else {
                  console.error('No session after retry');
                  setError('Invalid or expired reset link. Please request a new password reset.');
                }
                setInitializing(false);
                if (subscription) {
                  subscription.unsubscribe();
                }
              }
            }, 1500);
          }
        } else {
          // Not a recovery link - check if user is already logged in
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted) {
            if (session) {
              setSessionReady(true);
            } else {
              setError('Please use the password reset link from your email to change your password.');
            }
            setInitializing(false);
          }
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        if (mounted) {
          setError('An error occurred while processing your reset link. Please try again.');
          setInitializing(false);
        }
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    };

    initializeSession();
    
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`At least ${minLength} characters`);
    if (!hasUpperCase) errors.push('At least one uppercase letter');
    if (!hasLowerCase) errors.push('At least one lowercase letter');
    if (!hasNumbers) errors.push('At least one number');
    if (!hasSpecialChar) errors.push('At least one special character');

    return errors;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if session is ready
    if (!sessionReady) {
      setError('Session not ready. Please wait...');
      setLoading(false);
      return;
    }

    // Verify session is still valid
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Your session has expired. Please request a new password reset link.');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`Password requirements not met: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(updateError.message || 'Failed to update password. Please try again.');
        toast({
          title: "Error",
          description: updateError.message || "Failed to update password. Please try again.",
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Success",
          description: "Password updated successfully!",
        });
        
        // Call the callback after a short delay
        setTimeout(() => {
          onPasswordChanged();
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-4">
              Your password has been successfully changed. You will be redirected to login shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Reset Link...</h2>
            <p className="text-gray-600">
              Please wait while we verify your password reset link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it meets all the security requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!sessionReady && !error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please use the password reset link from your email to change your password.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• At least one uppercase letter (A-Z)</li>
                <li>• At least one lowercase letter (a-z)</li>
                <li>• At least one number (0-9)</li>
                <li>• At least one special character (!@#$%^&*)</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !newPassword || !confirmPassword || !sessionReady}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
            
            {!sessionReady && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Don't have a reset link?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/auth'}
                >
                  Go to Login
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordChangePrompt; 