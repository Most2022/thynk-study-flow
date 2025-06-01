import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BookOpen } from 'lucide-react';
import BatchCard from '@/components/BatchCard';
import SubjectDashboard from '@/components/SubjectDashboard';
import ChapterSelectionDashboard from '@/components/ChapterSelectionDashboard';
import ChapterDashboard from '@/components/ChapterDashboard';
import CreateBatchModal from '@/components/CreateBatchModal';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'batches' | 'subjects' | 'chapters' | 'chapter-detail'>('batches');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Fetch batches from Supabase
  useEffect(() => {
    if (!user) {
      setBatches([]);
      setIsLoadingBatches(false);
      return;
    }

    const fetchBatches = async () => {
      setIsLoadingBatches(true);
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(`Failed to fetch batches: ${error.message}`);
        setBatches([]);
      } else {
        setBatches(data || []);
      }
      setIsLoadingBatches(false);
    };

    fetchBatches();
  }, [user]);

  const createBatch = async (name: string, date: string) => {
    if (!user) {
      toast.error("You must be logged in to create a batch.");
      return;
    }

    const { data, error } = await supabase
      .from('batches')
      .insert({
        name,
        date,
        sources: 0,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Failed to create batch: ${error.message}`);
    } else {
      setBatches(prev => [data, ...prev]);
      setShowCreateModal(false);
      toast.success("Batch created successfully!");
    }
  };

  const handleCreateBatch = (name: string) => {
    // Use current date if only name is provided
    const currentDate = new Date().toISOString().split('T')[0];
    createBatch(name, currentDate);
  };

  const handleStudyBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentView('subjects');
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView('chapters');
  };

  const handleSelectChapter = (chapter: string) => {
    setSelectedChapter(chapter);
    setCurrentView('chapter-detail');
  };

  const handleBack = () => {
    if (currentView === 'chapter-detail') {
      setCurrentView('chapters');
      setSelectedChapter('');
    } else if (currentView === 'chapters') {
      setCurrentView('subjects');
      setSelectedSubject('');
    } else if (currentView === 'subjects') {
      setCurrentView('batches');
      setSelectedBatch(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('batches');
    setSelectedBatch(null);
    setSelectedSubject('');
    setSelectedChapter('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (currentView === 'subjects' && selectedBatch) {
    return (
      <SubjectDashboard
        batch={selectedBatch}
        onBack={handleBack}
        onSelectSubject={handleSelectSubject}
      />
    );
  }

  if (currentView === 'chapters' && selectedBatch) {
    return (
      <ChapterSelectionDashboard
        batch={selectedBatch}
        subject={selectedSubject}
        onBack={handleBack}
        onSelectChapter={handleSelectChapter}
      />
    );
  }

  if (currentView === 'chapter-detail' && selectedBatch) {
    return (
      <ChapterDashboard
        batch={selectedBatch}
        subject={selectedSubject}
        chapter={selectedChapter}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Thynk</h1>
              <p className="text-slate-400">Manage your study materials efficiently</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Welcome, {user.email}</span>
            <Button onClick={handleSignOut} variant="outline" className="text-white border-white/20 hover:bg-white/10">
              Sign Out
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new batch
            </Button>
          </div>
        </div>

        {isLoadingBatches && (
          <div className="text-center py-10 text-white">Loading batches...</div>
        )}

        {!isLoadingBatches && batches.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No batches yet</h2>
            <p className="text-slate-400 mb-8">Create your first batch to get started</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first batch
            </Button>
          </div>
        )}

        {!isLoadingBatches && batches.length > 0 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {batches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onStudy={() => handleStudyBatch(batch)}
                />
              ))}
            </div>
          </Card>
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
