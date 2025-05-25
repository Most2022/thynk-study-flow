import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import ContentSection from '@/components/ContentSection';
import CreateContentModal from '@/components/CreateContentModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Batch interface from Index.tsx (or a shared types file)
interface Batch {
  id: string; 
  user_id: string;
  name: string;
  created_at: string;
  sources: number;
  // If Index.tsx's Batch has a 'date' field, add it here too for consistency if needed.
  // For now, ChapterDashboard only uses batch.id and batch.name from the prop.
}

interface ChapterDashboardProps {
  batch: Batch; // Full batch object
  subject: string; // TODO: Should be subjectId (UUID)
  chapter: string; // TODO: Should be chapterId (UUID) or name to be resolved to ID
  onBack: () => void;
}

// Align with Supabase content_items table, but use 'number' for local state/props
interface ContentItem {
  id: string; // UUID
  user_id: string; // UUID
  chapter_id: string; // UUID
  item_type: 'lectures' | 'notes' | 'dpps' | 'homework';
  name: string;
  status: 'completed' | 'incomplete' | 'revision';
  revision_count?: number;
  number: number; // Changed from item_number to match what ContentSection expects
  created_at?: string;
  updated_at?: string;
  // item_number?: number; // Keep if needed for direct DB field reference, but prefer mapping
}

interface ChapterContent {
  lectures: ContentItem[];
  notes: ContentItem[];
  dpps: ContentItem[];
  homework: ContentItem[];
}

// Placeholder function to get chapterId from name - THIS IS A TEMPORARY WORKAROUND
// In a real scenario, chapterId would be passed as a prop or fetched based on name and subjectId.
async function getChapterIdByName(chapterName: string, subjectId: string, userId: string): Promise<string | null> {
  // This is a mock. Ideally, you'd query your 'chapters' table.
  // For now, we'll assume the chapterName IS the ID if it's a UUID, or try to find/create it.
  // This part needs proper implementation when SubjectDashboard and ChapterSelectionDashboard are integrated with Supabase.
  console.warn("Using placeholder getChapterIdByName. Subject ID:", subjectId);
  
  // Attempt to find by name (and subjectId, userId if available)
  const { data, error } = await supabase
    .from('chapters')
    .select('id')
    .eq('name', chapterName)
    // .eq('subject_id', subjectId) // Add this if subjectId is available and reliable
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    toast({ title: "Error fetching chapter ID", description: error.message, variant: "destructive" });
    return null;
  }
  if (data) return data.id;

  // If not found, and if we had a subjectId, we could create it.
  // For now, returning null. This will prevent content from loading/saving correctly.
  toast({ title: "Chapter not found", description: `Chapter "${chapterName}" could not be found for the current subject/user. Content will not be saved.`, variant: "destructive"});
  return null; 
}


const ChapterDashboard = ({ batch, subject, chapter: chapterName, onBack }: ChapterDashboardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lectures');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState<ChapterContent>({
    lectures: [],
    notes: [],
    dpps: [],
    homework: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);

  // Effect to resolve chapterName to chapterId
  useEffect(() => {
    if (user && chapterName && batch.id) { // Assuming batch.id can act as a proxy for subjectId context for now
      // TODO: This needs a proper subjectId. For now, using batch.id as a placeholder if subject is also a name.
      // The actual subjectId should come from SubjectDashboard -> ChapterSelectionDashboard flow.
      // If `subject` prop is already an ID, use that.
      const effectiveSubjectId = subject; // This is WRONG if subject is a name.
                                           // It highlights the need for Subject/ChapterSelection Dashboards to pass IDs.

      getChapterIdByName(chapterName, effectiveSubjectId, user.id).then(id => {
        setCurrentChapterId(id);
      });
    }
  }, [user, chapterName, subject, batch.id]);


  useEffect(() => {
    const fetchContent = async () => {
      if (!user || !currentChapterId) {
        setContent({ lectures: [], notes: [], dpps: [], homework: [] });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch item_number from DB, it will be mapped to 'number' locally
        const { data, error } = await supabase
          .from('content_items')
          .select('id, user_id, chapter_id, item_type, name, status, revision_count, item_number, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('chapter_id', currentChapterId)
          .order('item_number', { ascending: true });

        if (error) throw error;

        const newContent: ChapterContent = { lectures: [], notes: [], dpps: [], homework: [] };
        if (data) {
          data.forEach(dbItem => {
            // Map item_number from DB to number for local state
            const typedItem: ContentItem = {
              id: dbItem.id,
              user_id: dbItem.user_id,
              chapter_id: dbItem.chapter_id,
              item_type: dbItem.item_type as ContentItem['item_type'],
              name: dbItem.name,
              status: dbItem.status as ContentItem['status'],
              revision_count: dbItem.revision_count,
              number: dbItem.item_number, // Map here
              created_at: dbItem.created_at,
              updated_at: dbItem.updated_at,
            };
            if (newContent[typedItem.item_type as keyof ChapterContent]) {
              newContent[typedItem.item_type as keyof ChapterContent].push(typedItem);
            }
          });
        }
        setContent(newContent);
      } catch (error: any) {
        toast({ title: "Error fetching content", description: error.message, variant: "destructive" });
        setContent({ lectures: [], notes: [], dpps: [], homework: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [user, currentChapterId]);

  const calculateProgress = () => {
    const allItems = [...content.lectures, ...content.notes, ...content.dpps, ...content.homework];
    const completed = allItems.filter(item => item.status === 'completed').length;
    return allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;
  };

  const handleCreateContent = async (type: string, count: number, namePrefix: string) => {
    if (!user || !currentChapterId) {
      toast({ title: "Error", description: "Cannot create content without user or chapter information.", variant: "destructive" });
      return;
    }

    const existingItems = content[type as keyof ChapterContent] || [];
    // Use 'number' from local state for calculation
    const lastItemNumberInState = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.number)) : 0;
    
    // Prepare items for DB insertion using 'item_number'
    const itemsToInsertForDb: Omit<any, 'id' | 'created_at' | 'updated_at'>[] = Array.from({ length: count }, (_, i) => ({
      user_id: user.id,
      chapter_id: currentChapterId,
      item_type: type as ContentItem['item_type'],
      name: `${namePrefix}`,
      status: 'incomplete',
      item_number: lastItemNumberInState + i + 1, // Use item_number for DB field
      revision_count: 0,
    }));

    try {
      const { data: newItemsDataFromDb, error } = await supabase
        .from('content_items')
        .insert(itemsToInsertForDb)
        .select('id, user_id, chapter_id, item_type, name, status, revision_count, item_number, created_at, updated_at'); // Ensure item_number is selected

      if (error) throw error;

      if (newItemsDataFromDb) {
        // Map item_number from DB response to number for local state
        const typedNewItemsForState: ContentItem[] = newItemsDataFromDb.map(dbItem => ({
          id: dbItem.id,
          user_id: dbItem.user_id,
          chapter_id: dbItem.chapter_id,
          item_type: dbItem.item_type as ContentItem['item_type'],
          name: dbItem.name,
          status: dbItem.status as ContentItem['status'],
          revision_count: dbItem.revision_count,
          number: dbItem.item_number, // Map here
          created_at: dbItem.created_at,
          updated_at: dbItem.updated_at,
        }));

        setContent(prevContent => ({
          ...prevContent,
          [type]: [...existingItems, ...typedNewItemsForState].sort((a, b) => a.number - b.number) // Sort by 'number'
        }));
        toast({title: "Content created successfully!"});
      }
    } catch (error: any) {
      toast({ title: "Error creating content", description: error.message, variant: "destructive" });
    } finally {
      setShowCreateModal(false);
    }
  };

  const handleStatusChange = async (type: string, itemId: string, newStatus: ContentItem['status']) => {
    if (!user) return;
    
    const itemToUpdate = content[type as keyof ChapterContent].find(item => item.id === itemId);
    if (!itemToUpdate) return;

    const newRevisionCount = newStatus === 'revision' ? (itemToUpdate.revision_count || 0) + 1 : itemToUpdate.revision_count;

    try {
      const { data, error } = await supabase
        .from('content_items')
        .update({ status: newStatus, revision_count: newRevisionCount, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select('id, user_id, chapter_id, item_type, name, status, revision_count, item_number, created_at, updated_at') // Ensure item_number is selected
        .single();
      
      if (error) throw error;

      if (data) {
        // Map item_number from DB to number for local state
        const updatedItem: ContentItem = {
            id: data.id,
            user_id: data.user_id,
            chapter_id: data.chapter_id,
            item_type: data.item_type as ContentItem['item_type'],
            name: data.name,
            status: data.status as ContentItem['status'],
            revision_count: data.revision_count,
            number: data.item_number, // Map here
            created_at: data.created_at,
            updated_at: data.updated_at,
        };
        setContent(prevContent => ({
          ...prevContent,
          [type]: prevContent[type as keyof ChapterContent].map(item =>
            item.id === itemId ? updatedItem : item
          )
        }));
        toast({title: "Status updated!"});
      }
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteItem = async (type: string, itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setContent(prevContent => ({
        ...prevContent,
        [type]: prevContent[type as keyof ChapterContent].filter(item => item.id !== itemId)
      }));
      toast({title: "Item deleted."});
    } catch (error: any) {
      toast({ title: "Error deleting item", description: error.message, variant: "destructive" });
    }
  };
  
  if (isLoading || !currentChapterId && chapterName) { // Show loading if chapterId is being resolved
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading chapter content...</p>
      </div>
    );
  }
  
  if (!currentChapterId && !isLoading) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button onClick={onBack} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              {/* Display chapterName which was originally passed as chapter prop */}
              <h1 className="text-2xl font-bold text-white">{chapterName}</h1> 
              {/* Display subject which was originally passed as subject prop */}
              <p className="text-slate-400">{subject}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
            disabled={!currentChapterId} // Disable if chapterId is not resolved
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new
          </Button>
        </div>
      </div>
    );
  }


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
            <div>
              {/* Display chapterName which was originally passed as chapter prop */}
              <h1 className="text-2xl font-bold text-white">{chapterName}</h1> 
              {/* Display subject which was originally passed as subject prop */}
              <p className="text-slate-400">{subject}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
            disabled={!currentChapterId} // Disable if chapterId is not resolved
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new
          </Button>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-start mb-8">
          <ProgressRing progress={calculateProgress()} />
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="lectures" className="text-white data-[state=active]:bg-slate-700">
              Lectures
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-white data-[state=active]:bg-slate-700">
              Notes
            </TabsTrigger>
            <TabsTrigger value="dpps" className="text-white data-[state=active]:bg-slate-700">
              DPPs
            </TabsTrigger>
            <TabsTrigger value="homework" className="text-white data-[state=active]:bg-slate-700">
              Homework
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lectures" className="mt-6">
            <ContentSection 
              items={content.lectures}
              type="lectures"
              onStatusChange={handleStatusChange}
              onDeleteItem={handleDeleteItem}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <ContentSection 
              items={content.notes}
              type="notes"
              onStatusChange={handleStatusChange}
              onDeleteItem={handleDeleteItem}
            />
          </TabsContent>

          <TabsContent value="dpps" className="mt-6">
            <ContentSection 
              items={content.dpps}
              type="dpps"
              onStatusChange={handleStatusChange}
              onDeleteItem={handleDeleteItem}
            />
          </TabsContent>

          <TabsContent value="homework" className="mt-6">
            <ContentSection 
              items={content.homework}
              type="homework"
              onStatusChange={handleStatusChange}
              onDeleteItem={handleDeleteItem}
            />
          </TabsContent>
        </Tabs>

        <CreateContentModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateContent={handleCreateContent}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
};

export default ChapterDashboard;
