import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BookOpen, Settings, LogOut } from 'lucide-react';
import BatchCard from '@/components/BatchCard';
import CreateBatchModal from '@/components/CreateBatchModal';
import SubjectDashboard from '@/components/SubjectDashboard';
import ChapterDashboard from '@/components/ChapterDashboard';
import ChapterSelectionDashboard from '@/components/ChapterSelectionDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Batch {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  sources: number;
}

const Index = () => {
  const { user, session, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'subjects' | 'chapters' | 'chapter'>('dashboard');
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    const fetchBatches = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          if (data) {
            const fetchedBatches = data.map(b => ({
                ...b,
                date: new Date(b.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
            })) as unknown as Batch[];
            setBatches(fetchedBatches);
          }
        } catch (error: any) {
          toast({ title: "Error fetching batches", description: error.message, variant: "destructive" });
          setBatches([]);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setBatches([]);
        setIsLoadingData(false);
      }
    };

    if (session && user) {
      fetchBatches();
    }
  }, [session, user]);

  const handleCreateBatch = async (name: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a batch.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('batches')
        .insert([{ name, user_id: user.id, sources: 1 }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const newBatch: Batch = {
            ...data,
            date: new Date(data.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
        } as unknown as Batch;
        setBatches(prevBatches => [newBatch, ...prevBatches]);
        toast({ title: "Batch created successfully!" });
      }
    } catch (error: any) {
      toast({ title: "Error creating batch", description: error.message, variant: "destructive" });
    } finally {
      setShowCreateModal(false);
    }
  };

  const handleStudyBatch = (batch: Batch) => {
    setCurrentBatch(batch);
    setCurrentView('subjects');
  };

  const handleSelectSubject = (subjectName: string) => {
    setCurrentSubject(subjectName);
    setCurrentView('chapters');
  };

  const handleSelectChapter = (chapterName: string) => {
    setCurrentChapter(chapterName);
    setCurrentView('chapter');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentBatch(null);
    setCurrentSubject('');
    setCurrentChapter('');
  };

  const handleBackToSubjects = () => {
    setCurrentView('subjects');
    setCurrentSubject('');
    setCurrentChapter('');
  };

  const handleBackToChapters = () => {
    setCurrentView('chapters');
    setCurrentChapter('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || (!session && !authLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (currentView === 'chapter' && currentBatch && currentSubject && currentChapter) {
    return (
      <ChapterDashboard 
        batch={currentBatch}
        subject={currentSubject}
        chapter={currentChapter}
        onBack={handleBackToChapters}
      />
    );
  }

  if (currentView === 'chapters' && currentBatch && currentSubject) {
    return (
      <ChapterSelectionDashboard 
        batch={currentBatch}
        subject={currentSubject}
        onBack={handleBackToSubjects}
        onSelectChapter={handleSelectChapter}
      />
    );
  }

  if (currentView === 'subjects' && currentBatch) {
    return (
      <SubjectDashboard 
        batch={currentBatch}
        onBack={handleBackToDashboard}
        onSelectSubject={handleSelectSubject}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">Thynk Unlimited</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new
            </Button>
            {user && (
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                className="text-white hover:bg-white/10"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Batches Grid */}
        {isLoadingData && <p className="text-white text-center">Loading batches...</p>}
        {!isLoadingData && batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {batches.map((batch) => (
              <BatchCard 
                key={batch.id} 
                batch={{...batch, date: new Date(batch.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}}
                onStudy={() => handleStudyBatch(batch)}
              />
            ))}
          </div>
        )}

        {!isLoadingData && batches.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white/80 mb-2">No batches yet</h2>
            <p className="text-white/60 mb-6">Create your first batch to start studying</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new batch
            </Button>
          </div>
        )}

        <CreateBatchModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateBatch={handleCreateBatch}
        />
      </div>
    </div>
  );
};

export default Index;
