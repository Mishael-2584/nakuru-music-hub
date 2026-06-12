import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Fragment } from "react";

interface AuthFormProps {
  onSuccess: () => void;
  role?: 'admin' | 'student' | 'teacher';
}

const AuthForm = ({ onSuccess, role = 'admin' }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          console.log('User signed in:', data.user.id);
          console.log('User email:', data.user.email);
          
          // Fetch the user's actual role from their profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, id')
            .eq('id', data.user.id)
            .single();

          console.log('Profile data:', profileData);
          console.log('Profile error:', profileError);
          console.log('Querying profiles table with user ID:', data.user.id);

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Generic fallback if profile fetch fails
            toast({
              title: "Welcome Back!",
              description: "Successfully signed in to Damon Music Academy.",
            });
          } else {
            // Use the actual role from the profile
            const actualRole = (profileData && 'role' in profileData && (profileData as any).role) ? (profileData as any).role : 'user';
            console.log('Actual role from profile:', actualRole);
            console.log('Profile ID:', profileData && 'id' in profileData ? (profileData as any).id : undefined);
            
            const panelName = actualRole === 'admin' ? 'admin panel' : actualRole === 'student' ? 'student panel' : actualRole === 'teacher' ? 'teacher panel' : 'portal';
            console.log('Panel name for toast:', panelName);
            
            toast({
              title: "Welcome Back!",
              description: `Successfully signed in to Damon Music Academy ${panelName}.`,
            });
          }
          onSuccess();
        }
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }

        // Check admin count limit before allowing registration
        const { data: adminCount, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'admin');

        if (countError) {
          console.error("Error checking admin count:", countError);
          toast({
            title: "Registration Failed",
            description: "Unable to verify admin count. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (adminCount && adminCount.length >= 3) {
          toast({
            title: "Registration Not Allowed",
            description: "Maximum number of admin accounts (3) has been reached.",
            variant: "destructive",
          });
          return;
        }

        // Use the actual site URL for email redirect
        const siteUrl = window.location.origin;
        const redirectUrl = `${siteUrl}/admin`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              role: 'admin'
            }
          },
        });

        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user && !data.session) {
          toast({
            title: "Registration Successful",
            description: "Please check your email from Damon Music Academy to confirm your account.",
          });
        } else if (data.session) {
          toast({
            title: "Welcome to Damon Music Academy!",
            description: "Your admin account has been created successfully.",
          });
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getResetRedirectUrl = () => {
    const envUrl = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL;
    if (envUrl) {
      return `${envUrl.replace(/\/$/, '')}/reset-password`;
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/reset-password`;
    }

    return "https://damonmusicacademy.co.ke/reset-password";
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: getResetRedirectUrl(),
      });
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for a password reset link.",
        });
        setShowForgot(false);
        setResetEmail("");
      }
    } catch (err) {
      toast({
        title: "Reset Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xs">
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isLogin
              ? role === 'admin'
                ? 'Admin Sign In'
                : role === 'student'
                ? 'Student Sign In'
                : 'Teacher Sign In'
              : role === 'admin'
                ? 'Create Admin Account'
                : role === 'student'
                ? 'Student Registration'
                : 'Teacher Registration'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Enter your email to reset password</Label>
                                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                  />
              </div>
                              <Button type="submit" className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Please wait...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" type="button" onClick={() => setShowForgot(false)} className="w-full text-sm text-blue-600 hover:text-blue-700">Back to Sign In</Button>
            </form>
          ) : (
            <Fragment>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••"
                      className="h-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••••"
                        className="h-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button type="submit" className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
                {role === 'teacher' && isLogin && (
                  <div className="text-center mt-3">
                    <a href="/teacher-signup" className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors duration-200">
                      Don't have an account? Sign up as a teacher
                    </a>
                  </div>
                )}
              </form>
              
              {role !== 'teacher' && (
                <div className="text-center">
                  <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200">
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </Button>
                </div>
              )}
              {isLogin && (
                <div className="text-center mt-3">
                  <Button variant="link" type="button" className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200" onClick={() => setShowForgot(true)}>
                    Forgot Password?
                  </Button>
                </div>
              )}
            </Fragment>
          )}
        </CardContent>
      </Card>
      {!isLogin && (
        <p className="text-xs text-gray-500 text-center mt-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
          Maximum of 3 admin accounts allowed. Registration requires email confirmation.
        </p>
      )}
    </div>
  );
};

export default AuthForm;
