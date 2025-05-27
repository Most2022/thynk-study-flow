import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { useState, useEffect } from 'react';
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

interface SubjectDashboardProps {
  batch: Batch;
  onBack: () => void;
  onSelectSubject: (subject: string) => void;
}

interface Subject {
  id: string; // Added ID for Supabase operations
  name: string;
  icon: string; // This might need to be stored in DB or be static
  chapters: number;
  color: string; // This might need to be stored in DB or be static
}

// Default subjects should ideally be fetched or handled more dynamically if user can create them.
// For now, keeping as is, but localStorage interaction will change to Supabase.
const defaultSubjectsPlaceholders: Omit<Subject, 'id' | 'chapters'>[] = [
  { name: 'Physics', icon: '🧪', color: 'from-blue-400 to-purple-500' },
  { name: 'Chemistry', icon: '⚗️', color: 'from-green-400 to-blue-500' },
  { name: 'Maths', icon: '🔢', color: 'from-orange-400 to-red-500' },
  { name: 'Biology', icon: '🧬', color: 'from-purple-400 to-pink-500' },
];


const SubjectDashboard = ({ batch, onBack, onSelectSubject }: SubjectDashboardProps) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Fetch subjects from Supabase
  useEffect(() => {
    if (!user || !batch?.id) return;

    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name') // Add other fields like icon, color if they are in db
        .eq('batch_id', batch.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error(`Failed to fetch subjects: ${error.message}`);
        setSubjects([]);
      } else {
        // If no subjects in DB for this batch, consider adding defaults
        if (data.length === 0) {
            const createdSubjects: Subject[] = [];
            for (const placeholder of defaultSubjectsPlaceholders) {
                const { data: newSubject, error: insertError } = await supabase
                    .from('subjects')
                    .insert({
                        batch_id: batch.id,
                        user_id: user.id,
                        name: placeholder.name,
                        // icon: placeholder.icon, // Store these in DB if needed
                        // color: placeholder.color,
                    })
                    .select('id, name')
                    .single();
                if (insertError) {
                    toast.error(`Failed to create default subject ${placeholder.name}: ${insertError.message}`);
                } else if (newSubject) {
                    createdSubjects.push({ 
                        ...newSubject, 
                        chapters: 0, // Will be fetched separately or with a join
                        icon: placeholder.icon, // Temp from placeholder
                        color: placeholder.color // Temp from placeholder
                    });
                }
            }
            setSubjects(createdSubjects);
        } else {
            // Map fetched data and add chapter counts (potentially async for each)
            const subjectsWithCounts = await Promise.all(data.map(async (s) => {
                const placeholder = defaultSubjectsPlaceholders.find(p => p.name === s.name) || { icon: '📚', color: 'from-gray-400 to-gray-500' };
                return {
                    ...s,
                    chapters: await getSubjectChapterCount(s.id),
                    icon: placeholder.icon, // Placeholder, ideally from DB
                    color: placeholder.color, // Placeholder, ideally from DB
                };
            }));
            setSubjects(subjectsWithCounts);
        }
      }
      setIsLoadingSubjects(false);
    };

    fetchSubjects();
  }, [batch, user]);


  const getSubjectChapterCount = async (subjectId: string) => {
    if (!user) return 0;
    const { count, error } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId)
      .eq('user_id', user.id);
    
    if (error) {
      // console.error(`Error fetching chapter count for subject ${subjectId}:`, error);
      return 0;
    }
    return count || 0;
  };

  const openDeleteSubjectDialog = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || !user) {
        toast.error("Could not delete subject. Subject not found or user not logged in.");
        return;
    }
    
    const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete.id)
        .eq('user_id', user.id);

    if (error) {
        toast.error(`Failed to delete subject: ${error.message}`);
    } else {
        setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
        toast.success(`Subject "${subjectToDelete.name}" deleted successfully.`);
        // Cascading delete should handle chapters in DB. LocalStorage for chapters might still be relevant if used for caching.
        // For now, assuming DB is source of truth.
        // localStorage.removeItem(`thynk-chapters-${batch.id}-${subjectToDelete.name}`); // This might be outdated if chapter IDs are used
    }
    setShowDeleteDialog(false);
    setSubjectToDelete(null);
  };

  // Placeholder for create new subject functionality
  const handleCreateNewSubject = () => {
    toast.info("Create new subject functionality not yet implemented.");
    // This would typically open a modal to input subject name, icon, color etc.
    // Then insert into 'subjects' table.
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* ... keep existing code (header back button and title) ... */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Subjects for {batch.name}</h1>
              <p className="text-slate-400">Select your subjects & start learning</p>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateNewSubject}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new subject
          </Button>
        </div>

        {isLoadingSubjects && <div className="text-center py-10 text-white">Loading subjects...</div>}
        
        {!isLoadingSubjects && subjects.length === 0 && (
            <div className="text-center py-20 text-white">
                <p className="text-xl mb-4">No subjects found for this batch.</p>
                <Button onClick={handleCreateNewSubject} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Default Subjects or Create New
                </Button>
            </div>
        )}

        {!isLoadingSubjects && subjects.length > 0 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id}
                  subject={subject} // ensure SubjectCard props match this Subject interface
                  onSelect={() => onSelectSubject(subject.name)} // This might need to pass subject.id or full object
                  onRemove={() => openDeleteSubjectDialog(subject)}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      {subjectToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will permanently delete the subject "{subjectToDelete.name}" and all its chapters and content. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setSubjectToDelete(null)}
                className="bg-transparent hover:bg-white/10 text-white border-white/20"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteSubject}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default SubjectDashboard;
