import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import ContentSection from '@/components/ContentSection';
import CreateContentModal from '@/components/CreateContentModal';
import EditContentItemModal from '@/components/EditContentItemModal';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

interface ChapterDashboardProps {
  batch: Batch;
  subject: string;
  chapter: string;
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

const ChapterDashboard = ({ batch, subject, chapter, onBack }: ChapterDashboardProps) => {
  const [activeTab, setActiveTab] = useState<ChapterContentType>('lectures');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState<ChapterContent>({
    lectures: [],
    notes: [],
    dpps: [],
    homework: []
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: ChapterContentType } | null>(null);

  const storageKey = `thynk-${batch.id}-${subject.toLowerCase()}-${chapter.toLowerCase().replace(/\s+/g, '-')}-content`;

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
    // Simple singularization, might need refinement for irregular plurals
    return type.endsWith('s') ? type.slice(0, -1) : type;
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
            <div>
              <h1 className="text-2xl font-bold text-white">{chapter}</h1>
              <p className="text-slate-400">{subject}</p>
            </div>
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

        {/* Progress Ring */}
        <div className="flex justify-start mb-8">
          <ProgressRing progress={calculateProgress()} />
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChapterContentType)} className="w-full">
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
        </Tabs>

        <CreateContentModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateContent={handleCreateContent}
          activeTab={activeTab}
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
      </div>
    </div>
  );
};

export default ChapterDashboard;
