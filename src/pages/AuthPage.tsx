
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Settings, ChromeIcon } from 'lucide-react'; // Using ChromeIcon as a placeholder for Google icon

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Logged in successfully!" });
      navigate('/'); // onAuthStateChange in AuthContext will also handle this
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // emailRedirectTo: `${window.location.origin}/` // Optional: if email confirmation is on
        }
      });
      if (error) throw error;
      toast({ title: "Sign up successful!", description: "Please check your email to verify your account if email confirmation is enabled." });
      // User will typically be redirected or see a message based on AuthContext's onAuthStateChange
      // or if email confirmation is required.
    } catch (error: any) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`, // Important: Supabase redirects here after Google auth
        },
      });
      if (error) throw error;
      // Supabase handles the redirect to Google and then back to your app.
      // onAuthStateChange will pick up the session.
    } catch (error: any) {
      toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
      setOauthLoading(false);
    }
    // No finally setLoading(false) here because successful OAuth navigates away.
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/70 border-slate-700 text-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-slate-900" />
            </div>
            <CardTitle className="text-3xl font-bold">Thynk Unlimited</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Sign in or create an account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border-slate-600">
              <TabsTrigger value="signin" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6 space-y-4">
              <Input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-slate-700 border-slate-600 placeholder-slate-400 text-white focus:ring-indigo-500"
              />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-slate-700 border-slate-600 placeholder-slate-400 text-white focus:ring-indigo-500"
              />
              <Button onClick={handleLogin} disabled={loading || oauthLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-6 space-y-4">
              <Input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-slate-700 border-slate-600 placeholder-slate-400 text-white focus:ring-indigo-500"
              />
              <Input 
                type="password" 
                placeholder="Password (min. 6 characters)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-slate-700 border-slate-600 placeholder-slate-400 text-white focus:ring-indigo-500"
              />
              <Button onClick={handleSignUp} disabled={loading || oauthLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {loading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleGoogleSignIn} 
              disabled={oauthLoading || loading}
              className="w-full mt-4 bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-white"
            >
              <ChromeIcon className="mr-2 h-4 w-4" /> {/* Placeholder icon, replace with actual Google icon if available */}
              {oauthLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

