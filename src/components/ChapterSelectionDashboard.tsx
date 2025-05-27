import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Video, FileText, Trash2 } from 'lucide-react';
import CreateChapterModal from '@/components/CreateChapterModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
}

interface ChapterSelectionDashboardProps {
  batch: Batch; // Batch might not be directly needed if subjectId is available
  subject: string; // This should ideally be subjectId or a Subject object
  onBack: () => void;
  onSelectChapter: (chapterNameOrId: string) => void; // Changed to pass chapter ID or name
}

interface Chapter {
  id: string;
  name: string;
  // The following counts will be derived or fetched
  lectures_total?: number;
  lectures_completed?: number;
  notes_total?: number;
  notes_completed?: number;
  dpps_total?: number;
  dpps_completed?: number;
  subject_id?: string; // For Supabase queries
}

const ChapterSelectionDashboard = ({ batch, subject: subjectName, onBack, onSelectChapter }: ChapterSelectionDashboardProps) => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);

  // Fetch Subject ID first, then chapters
  useEffect(() => {
    const fetchSubjectIdAndChapters = async () => {
      if (!user || !batch?.id || !subjectName) return;
      setIsLoadingChapters(true);

      // 1. Fetch subject_id based on batch.id and subjectName
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('batch_id', batch.id)
        .eq('name', subjectName)
        .eq('user_id', user.id)
        .single();

      if (subjectError || !subjectData) {
        toast.error(`Failed to find subject "${subjectName}": ${subjectError?.message || 'Not found'}`);
        setSubjectId(null);
        setChapters([]);
        setIsLoadingChapters(false);
        return;
      }
      
      const currentSubjectId = subjectData.id;
      setSubjectId(currentSubjectId);

      // 2. Fetch chapters for this subject_id
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('id, name')
        .eq('subject_id', currentSubjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (chapterError) {
        toast.error(`Failed to fetch chapters: ${chapterError.message}`);
        setChapters([]);
      } else {
        const chaptersWithContentCounts = await Promise.all(
          chapterData.map(async (chap) => {
            const counts = await getChapterContentCounts(chap.id); // Use chapter ID
            return { ...chap, ...counts };
          })
        );
        setChapters(chaptersWithContentCounts);
      }
      setIsLoadingChapters(false);
    };

    fetchSubjectIdAndChapters();
  }, [batch, subjectName, user]);


  const getChapterContentCounts = async (chapterId: string) => {
    // Fetches counts of lectures, notes, dpps for a given chapterId
    if (!user) return { lectures_total: 0, lectures_completed: 0, notes_total: 0, notes_completed: 0, dpps_total: 0, dpps_completed: 0 };

    const contentTypes = ['lectures', 'notes', 'dpps'] as const;
    let counts = {
      lectures_total: 0, lectures_completed: 0,
      notes_total: 0, notes_completed: 0,
      dpps_total: 0, dpps_completed: 0,
    };

    for (const type of contentTypes) {
        const { data, error, count: totalCount } = await supabase
            .from('content_items')
            .select('id', { count: 'exact' })
            .eq('chapter_id', chapterId)
            .eq('user_id', user.id)
            .eq('item_type', type);

        if (error) {
            // console.error(`Error fetching total ${type} for chapter ${chapterId}:`, error);
            continue;
        }
        
        const { count: completedCount, error: completedError } = await supabase
            .from('content_items')
            .select('id', { count: 'exact' })
            .eq('chapter_id', chapterId)
            .eq('user_id', user.id)
            .eq('item_type', type)
            .eq('status', 'completed');

        if (completedError) {
            // console.error(`Error fetching completed ${type} for chapter ${chapterId}:`, completedError);
            continue;
        }
        
        counts[`${type}_total`] = totalCount || 0;
        counts[`${type}_completed`] = completedCount || 0;
    }
    return counts;
  };

  const handleCreateChapter = async (chapterName: string) => {
    if (!user || !subjectId) {
      toast.error("Cannot create chapter: User or subject information missing.");
      return;
    }

    const { data: newChapterData, error } = await supabase
      .from('chapters')
      .insert({ name: chapterName, subject_id: subjectId, user_id: user.id })
      .select('id, name')
      .single();

    if (error) {
      toast.error(`Failed to create chapter: ${error.message}`);
    } else if (newChapterData) {
      const newChapterWithCounts = { 
        ...newChapterData, 
        ...(await getChapterContentCounts(newChapterData.id)) 
      };
      setChapters(prev => [...prev, newChapterWithCounts]);
      setShowCreateModal(false);
      toast.success("Chapter created successfully!");
    }
  };

  const openDeleteChapterDialog = (chapter: Chapter) => {
    setChapterToDelete(chapter);
    setShowDeleteDialog(true);
  };

  const confirmDeleteChapter = async () => {
    if (!chapterToDelete || !user) {
      toast.error("Could not delete chapter. Chapter not found or user not logged in.");
      return;
    }

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterToDelete.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete chapter: ${error.message}`);
    } else {
      setChapters(prev => prev.filter(c => c.id !== chapterToDelete.id));
      toast.success(`Chapter "${chapterToDelete.name}" deleted successfully.`);
      // Cascading delete should handle content_items. 
      // Targets associated with this chapter will also be deleted by cascade.
    }
    setShowDeleteDialog(false);
    setChapterToDelete(null);
  };

  const handleChapterClick = (chapter: Chapter) => {
    // Pass chapter name for now, or chapter.id if ChapterDashboard expects ID
    onSelectChapter(chapter.name); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        {/* ... keep existing code (header: back button, title, create new button) ... */}
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
            <h1 className="text-2xl font-bold text-white">{subjectName}</h1>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
            disabled={!subjectId} // Disable if subjectId is not yet loaded
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new chapter
          </Button>
        </div>

        {isLoadingChapters && <div className="text-center py-10 text-white">Loading chapters...</div>}

        {!isLoadingChapters && chapters.length === 0 && (
          // ... keep existing code (empty state JSX) ...
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white/80 mb-2">No chapters yet</h2>
            <p className="text-white/60 mb-6">Create your first chapter for {subjectName}</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!subjectId}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new chapter
            </Button>
          </div>
        )}

        {!isLoadingChapters && chapters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => (
              <Card 
                key={chapter.id}
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all p-6 group relative"
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteChapterDialog(chapter);
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                  title="Delete chapter"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div 
                  onClick={() => handleChapterClick(chapter)}
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
                        {chapter.lectures_completed || 0}/{chapter.lectures_total || 0} completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Notes</span>
                      </div>
                      <span className="text-xs">
                        {chapter.notes_completed || 0}/{chapter.notes_total || 0} completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>DPPs</span>
                      </div>
                      <span className="text-xs">
                        {chapter.dpps_completed || 0}/{chapter.dpps_total || 0} completed
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <CreateChapterModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateChapter={handleCreateChapter}
        />

        {chapterToDelete && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete the chapter "{chapterToDelete.name}" and all its content (lectures, notes, DPPs, homework, targets). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => setChapterToDelete(null)}
                  className="bg-transparent hover:bg-white/10 text-white border-white/20"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteChapter}
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

export default ChapterSelectionDashboard;
