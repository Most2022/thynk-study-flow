import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, TargetIcon, Trash2, Edit3, CheckCircle, Clock, RefreshCcw } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import ContentSection from '@/components/ContentSection';
import CreateContentModal from '@/components/CreateContentModal';
import EditContentItemModal from '@/components/EditContentItemModal';
import CreateTargetModal from '@/components/CreateTargetModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface ChapterDashboardProps {
  batch: Batch;
  subject: string; // This is subject name
  chapter: string; // This is chapter name
  onBack: () => void;
}

interface ContentItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'revision';
  revisionCount?: number;
  number: number;
}

interface ChapterContent {
  lectures: ContentItem[];
  notes: ContentItem[];
  dpps: ContentItem[];
  homework: ContentItem[];
}

type ChapterContentType = keyof ChapterContent;

interface Target {
  id: string;
  name: string;
  category: "preprimary" | "primary" | "secondary" | "higher_secondary";
  deadline: string | null;
  start_time: string | null;
  end_time: string | null;
  progress: number;
  chapter_id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

const ChapterDashboard = ({ batch, subject, chapter, onBack }: ChapterDashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ChapterContentType | 'targets'>('lectures'); // Added 'targets' tab
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState<ChapterContent>({
    lectures: [],
    notes: [],
    dpps: [],
    homework: []
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: ChapterContentType } | null>(null);

  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [showCreateTargetModal, setShowCreateTargetModal] = useState(false);
  const [showDeleteTargetDialog, setShowDeleteTargetDialog] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);

  const storageKey = `thynk-${batch.id}-${subject.toLowerCase()}-${chapter.toLowerCase().replace(/\s+/g, '-')}-content`;

  // Fetch Chapter ID
  useEffect(() => {
    const fetchChapterId = async () => {
      if (!user || !batch?.id || !subject || !chapter) return;
      // console.log("Fetching chapter ID for:", { batchId: batch.id, subjectName: subject, chapterName: chapter, userId: user.id });
      try {
        // First, get subject_id
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('id')
          .eq('name', subject)
          .eq('batch_id', batch.id)
          .eq('user_id', user.id)
          .single();

        if (subjectError || !subjectData) {
          // console.error("Error fetching subject ID:", subjectError);
          toast.error(`Failed to find subject "${subject}" for batch "${batch.name}".`);
          setCurrentChapterId(null);
          return;
        }
        // console.log("Fetched subject ID:", subjectData.id);

        // Then, get chapter_id
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('id')
          .eq('name', chapter)
          .eq('subject_id', subjectData.id)
          .eq('user_id', user.id)
          .single();
        
        if (chapterError || !chapterData) {
          // console.error("Error fetching chapter ID:", chapterError);
          // toast.error(`Failed to find chapter "${chapter}" under subject "${subject}". Ensure it exists.`);
          setCurrentChapterId(null); // This might indicate the chapter doesn't exist for this user/subject/batch combination
          return;
        }
        // console.log("Fetched chapter ID:", chapterData.id);
        setCurrentChapterId(chapterData.id);
      } catch (e) {
        // console.error("Exception in fetchChapterId:", e);
        toast.error("An error occurred while identifying the chapter.");
        setCurrentChapterId(null);
      }
    };
    fetchChapterId();
  }, [batch, subject, chapter, user]);

  // Fetch Targets when chapterId is available
  const fetchTargets = async () => {
    if (!user || !currentChapterId) {
      setTargets([]);
      setIsLoadingTargets(false);
      return;
    }
    setIsLoadingTargets(true);
    // console.log("Fetching targets for chapter ID:", currentChapterId);
    const { data, error } = await supabase
      .from('targets')
      .select('*')
      .eq('chapter_id', currentChapterId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      // console.error("Error fetching targets:", error);
      toast.error(`Failed to fetch targets: ${error.message}`);
      setTargets([]);
    } else {
      // console.log("Fetched targets:", data);
      setTargets(data || []);
    }
    setIsLoadingTargets(false);
  };
  
  useEffect(() => {
    fetchTargets();
  }, [currentChapterId, user]);

  useEffect(() => {
    const savedContent = localStorage.getItem(storageKey);
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    } else {
      // Initialize with empty arrays if nothing in storage
      setContent({
        lectures: [],
        notes: [],
        dpps: [],
        homework: []
      });
    }
  }, [storageKey]);

  const saveContent = (newContent: ChapterContent) => {
    setContent(newContent);
    localStorage.setItem(storageKey, JSON.stringify(newContent));
  };

  const calculateProgress = () => {
    const allItems = [...content.lectures, ...content.notes, ...content.dpps, ...content.homework];
    if (allItems.length === 0) return 0;
    const completed = allItems.filter(item => item.status === 'completed').length;
    return Math.round((completed / allItems.length) * 100);
  };

  const handleCreateContent = (type: string, count: number, namePrefix: string) => {
    const itemType = type as ChapterContentType;
    const existingItems = content[itemType] || [];
    const lastNumber = existingItems.length > 0 ? Math.max(0, ...existingItems.map(item => item.number)) : 0;
    
    const newItems: ContentItem[] = Array.from({ length: count }, (_, i) => ({
      id: `${itemType}-${Date.now()}-${i}`,
      name: `${namePrefix}`,
      status: 'incomplete',
      number: lastNumber + i + 1
    }));

    const updatedContent = {
      ...content,
      [itemType]: [...existingItems, ...newItems]
    };

    saveContent(updatedContent);
    setShowCreateModal(false);
  };

  const handleStatusChange = (type: string, itemId: string, newStatus: string) => {
    const itemType = type as ChapterContentType;
    const updatedContent = {
      ...content,
      [itemType]: content[itemType].map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: newStatus as 'completed' | 'incomplete' | 'revision',
              revisionCount: newStatus === 'revision' ? (item.revisionCount || 0) + 1 : item.revisionCount
            }
          : item
      )
    };
    saveContent(updatedContent);
  };

  const handleDeleteItem = (type: string, itemId: string) => {
    const itemType = type as ChapterContentType;
    const updatedContent = {
      ...content,
      [itemType]: content[itemType].filter(item => item.id !== itemId)
    };
    saveContent(updatedContent);
  };

  const handleOpenEditModal = (itemToEdit: ContentItem, type: string) => {
    setEditingItem({ id: itemToEdit.id, name: itemToEdit.name, type: type as ChapterContentType });
    setShowEditModal(true);
  };

  const handleSaveEditedItem = (newName: string) => {
    if (!editingItem) return;

    const { id, type } = editingItem;
    const updatedContent = {
      ...content,
      [type]: content[type].map(item =>
        item.id === id ? { ...item, name: newName } : item
      )
    };
    saveContent(updatedContent);
    setShowEditModal(false);
    setEditingItem(null);
  };

  const getItemTypeSingular = (type: ChapterContentType | null): string => {
    if (!type) return "Item";
    return type.endsWith('s') ? type.slice(0, -1) : type;
  };

  const openDeleteTargetDialog = (target: Target) => {
    setTargetToDelete(target);
    setShowDeleteTargetDialog(true);
  };

  const confirmDeleteTarget = async () => {
    if (!targetToDelete || !user) return;
    const { error } = await supabase
      .from('targets')
      .delete()
      .eq('id', targetToDelete.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete target: ${error.message}`);
    } else {
      toast.success(`Target "${targetToDelete.name}" deleted.`);
      setTargets(prev => prev.filter(t => t.id !== targetToDelete.id));
    }
    setShowDeleteTargetDialog(false);
    setTargetToDelete(null);
  };
  
  const handleUpdateTargetProgress = async (targetId: string, newProgress: number) => {
    if (!user) return;
    const progress = Math.max(0, Math.min(100, newProgress)); // Ensure progress is between 0 and 100

    const { error } = await supabase
      .from('targets')
      .update({ progress })
      .eq('id', targetId)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to update target progress: ${error.message}`);
    } else {
      // toast.success("Target progress updated!");
      setTargets(prevTargets => 
        prevTargets.map(t => t.id === targetId ? { ...t, progress } : t)
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              onClick={onBack}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10 p-2 sm:p-auto"
            >
              <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{chapter}</h1>
              <p className="text-sm sm:text-base text-slate-400">{subject}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              if (activeTab === 'targets') {
                if (!currentChapterId) {
                  toast.error("Chapter information not loaded yet. Please wait or try refreshing.");
                  return;
                }
                setShowCreateTargetModal(true);
              } else {
                setShowCreateModal(true);
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            variant="outline"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {activeTab === 'targets' ? 'Create Target' : 'Create New'}
          </Button>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-start mb-8">
          <ProgressRing progress={calculateProgress()} />
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChapterContentType | 'targets')} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border-slate-700 min-w-[500px] sm:min-w-full">
              <TabsTrigger value="lectures" className="text-white data-[state=active]:bg-slate-700 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                Lectures
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-white data-[state=active]:bg-slate-700 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                Notes
              </TabsTrigger>
              <TabsTrigger value="dpps" className="text-white data-[state=active]:bg-slate-700 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                DPPs
              </TabsTrigger>
              <TabsTrigger value="homework" className="text-white data-[state=active]:bg-slate-700 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                Homework
              </TabsTrigger>
              <TabsTrigger value="targets" className="text-white data-[state=active]:bg-slate-700 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <TargetIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Targets
              </TabsTrigger>
            </TabsList>
          </div>

          {(['lectures', 'notes', 'dpps', 'homework'] as ChapterContentType[]).map((contentType) => (
            <TabsContent key={contentType} value={contentType} className="mt-6">
              <ContentSection 
                items={content[contentType]}
                type={contentType}
                onStatusChange={handleStatusChange}
                onDeleteItem={handleDeleteItem}
                onEditItem={handleOpenEditModal}
              />
            </TabsContent>
          ))}

          <TabsContent value="targets" className="mt-6">
            {!currentChapterId && <p className="text-center text-slate-400 py-4 text-sm sm:text-base">Identifying chapter to load targets...</p>}
            {currentChapterId && isLoadingTargets && <p className="text-center text-slate-400 py-4 text-sm sm:text-base">Loading targets...</p>}
            {currentChapterId && !isLoadingTargets && targets.length === 0 && (
              <div className="text-center py-10 text-white">
                <TargetIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No Targets Yet</h3>
                <p className="text-slate-400 mb-4 text-sm sm:text-base">Create targets to track your progress for this chapter.</p>
                <Button onClick={() => setShowCreateTargetModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Create First Target
                </Button>
              </div>
            )}
            {currentChapterId && !isLoadingTargets && targets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {targets.map(target => (
                  <Card key={target.id} className="bg-slate-800/70 border-slate-700 text-white">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base sm:text-lg">{target.name}</CardTitle>
                          <CardDescription className="text-slate-400 capitalize text-xs sm:text-sm">{target.category}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteTargetDialog(target)} className="text-slate-400 hover:text-red-500 h-8 w-8 sm:h-auto sm:w-auto sm:px-2">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                        <span>Progress:</span>
                        <span>{target.progress}%</span>
                      </div>
                      <Progress value={target.progress} className="h-1.5 sm:h-2 bg-slate-700 [&>div]:bg-indigo-500" />
                       <div className="flex justify-between items-center mt-2">
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 sm:px-3" onClick={() => handleUpdateTargetProgress(target.id, target.progress - 10)}> -10% </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 sm:px-3" onClick={() => handleUpdateTargetProgress(target.id, target.progress + 10)}> +10% </Button>
                      </div>
                      {target.deadline && (
                        <p className="text-xs sm:text-sm text-slate-400">
                          Deadline: {new Date(target.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {(target.start_time || target.end_time) && (
                        <p className="text-xs sm:text-sm text-slate-400">
                          Time: {target.start_time || '--:--'} - {target.end_time || '--:--'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateContentModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateContent={handleCreateContent}
          activeTab={activeTab === 'targets' ? 'lectures' : activeTab} // Pass a default content type if targets tab is active
        />

        {editingItem && (
          <EditContentItemModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingItem(null);
            }}
            onSave={handleSaveEditedItem}
            currentName={editingItem.name}
            itemTypeSingular={getItemTypeSingular(editingItem.type)}
          />
        )}

        {currentChapterId && (
          <CreateTargetModal
            isOpen={showCreateTargetModal}
            onClose={() => setShowCreateTargetModal(false)}
            chapterId={currentChapterId}
            onTargetCreated={fetchTargets} // Refresh targets list after creation
          />
        )}

        {targetToDelete && (
          <AlertDialog open={showDeleteTargetDialog} onOpenChange={setShowDeleteTargetDialog}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Target?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to delete the target "{targetToDelete.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => setTargetToDelete(null)}
                  className="bg-transparent hover:bg-white/10 text-white border-white/20"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteTarget}
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

export default ChapterDashboard;
