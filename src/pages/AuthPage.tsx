
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Settings } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Logged in successfully!" });
      navigate('/');
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
          // You can add emailRedirectTo or data here if needed
        }
      });
      if (error) throw error;
      toast({ title: "Sign up successful!", description: "Please check your email to verify your account." });
      // Optionally, navigate to login or show a message
    } catch (error: any) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
              <Button onClick={handleLogin} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
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
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-slate-700 border-slate-600 placeholder-slate-400 text-white focus:ring-indigo-500"
              />
              <Button onClick={handleSignUp} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {loading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

