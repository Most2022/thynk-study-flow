import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import ContentSection from '@/components/ContentSection';
import CreateContentModal from '@/components/CreateContentModal';

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
  number: number; // Added number property
}

interface ChapterContent {
  lectures: ContentItem[];
  notes: ContentItem[];
  dpps: ContentItem[];
  homework: ContentItem[];
}

const ChapterDashboard = ({ batch, subject, chapter, onBack }: ChapterDashboardProps) => {
  const [activeTab, setActiveTab] = useState('lectures');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState<ChapterContent>({
    lectures: [],
    notes: [],
    dpps: [],
    homework: []
  });

  const storageKey = `thynk-${batch.id}-${subject.toLowerCase()}-${chapter.toLowerCase().replace(/\s+/g, '-')}-content`;

  useEffect(() => {
    const savedContent = localStorage.getItem(storageKey);
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    }
  }, [storageKey]);

  const saveContent = (newContent: ChapterContent) => {
    setContent(newContent);
    localStorage.setItem(storageKey, JSON.stringify(newContent));
  };

  const calculateProgress = () => {
    const allItems = [...content.lectures, ...content.notes, ...content.dpps, ...content.homework];
    const completed = allItems.filter(item => item.status === 'completed').length;
    return allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;
  };

  const handleCreateContent = (type: string, count: number, namePrefix: string) => {
    const existingItems = content[type as keyof ChapterContent] || [];
    const lastNumber = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.number)) : 0;
    
    const newItems: ContentItem[] = Array.from({ length: count }, (_, i) => ({
      id: `${type}-${Date.now()}-${i}`,
      name: `${namePrefix}`,
      status: 'incomplete',
      number: lastNumber + i + 1
    }));

    const updatedContent = {
      ...content,
      [type]: [...existingItems, ...newItems]
    };

    saveContent(updatedContent);
    setShowCreateModal(false);
  };

  const handleStatusChange = (type: string, itemId: string, newStatus: string) => {
    const updatedContent = {
      ...content,
      [type]: content[type as keyof ChapterContent].map(item => 
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
    const updatedContent = {
      ...content,
      [type]: content[type as keyof ChapterContent].filter(item => item.id !== itemId)
    };

    saveContent(updatedContent);
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
