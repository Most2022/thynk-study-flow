
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Video, FileText, Trash2 } from 'lucide-react';
import CreateChapterModal from '@/components/CreateChapterModal';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

interface ChapterSelectionDashboardProps {
  batch: Batch;
  subject: string;
  onBack: () => void;
  onSelectChapter: (chapter: string) => void;
}

interface Chapter {
  id: string;
  name: string;
  lectures: number;
  notes: number;
  dpps: number;
  homework: number;
}

const ChapterSelectionDashboard = ({ batch, subject, onBack, onSelectChapter }: ChapterSelectionDashboardProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const storageKey = `thynk-chapters-${batch.id}-${subject}`;

  useEffect(() => {
    const savedChapters = localStorage.getItem(storageKey);
    if (savedChapters) {
      setChapters(JSON.parse(savedChapters));
    }
  }, [storageKey]);

  const saveChapters = (newChapters: Chapter[]) => {
    setChapters(newChapters);
    localStorage.setItem(storageKey, JSON.stringify(newChapters));
  };

  const handleCreateChapter = (chapterName: string) => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      name: chapterName,
      lectures: 0,
      notes: 0,
      dpps: 0,
      homework: 0
    };

    const updatedChapters = [...chapters, newChapter];
    saveChapters(updatedChapters);
    setShowCreateModal(false);
  };

  const handleDeleteChapter = (chapterId: string, chapterName: string) => {
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId);
    saveChapters(updatedChapters);
    
    // Also remove the chapter content from localStorage
    const contentKey = `thynk-${batch.id}-${subject.toLowerCase()}-${chapterName.toLowerCase().replace(/\s+/g, '-')}-content`;
    localStorage.removeItem(contentKey);
  };

  const getChapterContentCounts = (chapterName: string) => {
    const contentKey = `thynk-${batch.id}-${subject.toLowerCase()}-${chapterName.toLowerCase().replace(/\s+/g, '-')}-content`;
    const savedContent = localStorage.getItem(contentKey);
    if (savedContent) {
      const content = JSON.parse(savedContent);
      const lectures = content.lectures || [];
      const notes = content.notes || [];
      const dpps = content.dpps || [];
      
      const completedLectures = lectures.filter((item: any) => item.status === 'completed').length;
      const completedNotes = notes.filter((item: any) => item.status === 'completed').length;
      const completedDpps = dpps.filter((item: any) => item.status === 'completed').length;
      
      return {
        lectures: { total: lectures.length, completed: completedLectures },
        notes: { total: notes.length, completed: completedNotes },
        dpps: { total: dpps.length, completed: completedDpps }
      };
    }
    return { 
      lectures: { total: 0, completed: 0 }, 
      notes: { total: 0, completed: 0 }, 
      dpps: { total: 0, completed: 0 } 
    };
  };

  const handleChapterClick = (chapterName: string) => {
    onSelectChapter(chapterName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">{subject}</h1>
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

        {/* Chapters Grid */}
        {chapters.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white/80 mb-2">No chapters yet</h2>
            <p className="text-white/60 mb-6">Create your first chapter to start studying</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new chapter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => {
              const counts = getChapterContentCounts(chapter.name);
              return (
                <Card 
                  key={chapter.id}
                  className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all p-6 group relative"
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(chapter.id, chapter.name);
                    }}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div 
                    onClick={() => handleChapterClick(chapter.name)}
                    className="cursor-pointer"
                  >
                    <h3 className="text-white font-semibold text-lg mb-4">{chapter.name}</h3>
                    
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>Lectures</span>
                        </div>
                        <span className="text-xs">
                          {counts.lectures.completed}/{counts.lectures.total} completed
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Notes</span>
                        </div>
                        <span className="text-xs">
                          {counts.notes.completed}/{counts.notes.total} completed
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>DPPs</span>
                        </div>
                        <span className="text-xs">
                          {counts.dpps.completed}/{counts.dpps.total} completed
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <CreateChapterModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateChapter={handleCreateChapter}
        />
      </div>
    </div>
  );
};

export default ChapterSelectionDashboard;
