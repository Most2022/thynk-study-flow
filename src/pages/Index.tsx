import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BookOpen, Settings, LogOut, Trash2 } from 'lucide-react';
import BatchCard from '@/components/BatchCard';
import CreateBatchModal from '@/components/CreateBatchModal';
import SubjectDashboard from '@/components/SubjectDashboard';
import ChapterDashboard from '@/components/ChapterDashboard';
import ChapterSelectionDashboard from '@/components/ChapterSelectionDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Batch {
  id: string;
  name: string;
  date: string; 
  sources: number;
  user_id?: string; 
}

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'subjects' | 'chapters' | 'chapter'>('dashboard');
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  const [showDeleteBatchDialog, setShowDeleteBatchDialog] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  useEffect(() => {
    if (user) {
      const fetchBatches = async () => {
        setIsLoadingBatches(true);
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Failed to fetch batches: ' + error.message);
          setBatches([]);
        } else if (data) {
          const formattedBatches = data.map(batch => ({
            id: batch.id,
            name: batch.name,
            date: new Date(batch.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            sources: batch.sources || 1, 
            user_id: batch.user_id
          }));
          setBatches(formattedBatches);
        }
        setIsLoadingBatches(false);
      };
      fetchBatches();
    } else {
      setBatches([]);
      setIsLoadingBatches(false);
    }
  }, [user]);

  const handleCreateBatch = async (name: string) => {
    if (!user) {
      toast.error("You must be logged in to create a batch.");
      return;
    }

    const newBatchData = {
      name,
      user_id: user.id,
      sources: 1, 
    };
    
    const { data: insertedBatch, error } = await supabase
      .from('batches')
      .insert(newBatchData)
      .select()
      .single();

    if (error) {
      toast.error("Failed to create batch: " + error.message);
    } else if (insertedBatch) {
      const formattedNewBatch: Batch = {
        id: insertedBatch.id,
        name: insertedBatch.name,
        date: new Date(insertedBatch.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        sources: insertedBatch.sources || 1,
        user_id: insertedBatch.user_id
      };
      setBatches(prevBatches => [formattedNewBatch, ...prevBatches]);
      setShowCreateModal(false);
      toast.success("Batch created successfully!");
    }
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete || !user) {
      toast.error("Could not delete batch. Batch not found or user not logged in.");
      return;
    }
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', batchToDelete.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete batch: ${error.message}`);
    } else {
      setBatches(prevBatches => prevBatches.filter(b => b.id !== batchToDelete.id));
      toast.success(`Batch "${batchToDelete.name}" deleted successfully.`);
    }
    setShowDeleteBatchDialog(false);
    setBatchToDelete(null);
  };

  const openDeleteBatchDialog = (batch: Batch) => {
    setBatchToDelete(batch);
    setShowDeleteBatchDialog(true);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully.");
    navigate('/auth'); 
  };

  const handleStudyBatch = (batch: Batch) => {
    setCurrentBatch(batch);
    setCurrentView('subjects');
  };

  const handleSelectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentView('chapters');
  };

  const handleSelectChapter = (chapter: string) => {
    setCurrentChapter(chapter);
    setCurrentView('chapter');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentBatch(null);
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

  // Main dashboard view
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
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Batches Grid */}
        {isLoadingBatches && (
          <div className="text-center py-20 text-white">Loading batches...</div>
        )}
        {!isLoadingBatches && batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {batches.map((batch) => (
              <div key={batch.id} className="relative group">
                <BatchCard 
                  batch={batch} 
                  onStudy={() => handleStudyBatch(batch)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteBatchDialog(batch)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete batch"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isLoadingBatches && batches.length === 0 && (
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

        {batchToDelete && (
          <AlertDialog open={showDeleteBatchDialog} onOpenChange={setShowDeleteBatchDialog}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete the batch "{batchToDelete.name}" and all its associated subjects, chapters, and content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => setBatchToDelete(null)}
                  className="bg-transparent hover:bg-white/10 text-white border-white/20"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteBatch}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default Index;
