
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BookOpen, Settings } from 'lucide-react';
import BatchCard from '@/components/BatchCard';
import CreateBatchModal from '@/components/CreateBatchModal';
import SubjectDashboard from '@/components/SubjectDashboard';
import ChapterDashboard from '@/components/ChapterDashboard';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'subjects' | 'chapter'>('dashboard');
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentSubject, setCurrentSubject] = useState<string>('');

  useEffect(() => {
    const savedBatches = localStorage.getItem('thynk-batches');
    if (savedBatches) {
      setBatches(JSON.parse(savedBatches));
    }
  }, []);

  const handleCreateBatch = (name: string) => {
    const newBatch: Batch = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      sources: 1
    };
    
    const updatedBatches = [...batches, newBatch];
    setBatches(updatedBatches);
    localStorage.setItem('thynk-batches', JSON.stringify(updatedBatches));
    setShowCreateModal(false);
  };

  const handleStudyBatch = (batch: Batch) => {
    setCurrentBatch(batch);
    setCurrentView('subjects');
  };

  const handleSelectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentView('chapter');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentBatch(null);
  };

  const handleBackToSubjects = () => {
    setCurrentView('subjects');
    setCurrentSubject('');
  };

  if (currentView === 'chapter' && currentBatch && currentSubject) {
    return (
      <ChapterDashboard 
        batch={currentBatch}
        subject={currentSubject}
        onBack={handleBackToSubjects}
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
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new
          </Button>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batches.map((batch) => (
            <BatchCard 
              key={batch.id} 
              batch={batch} 
              onStudy={() => handleStudyBatch(batch)}
            />
          ))}
        </div>

        {batches.length === 0 && (
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
