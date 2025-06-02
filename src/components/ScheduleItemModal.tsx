import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Plus, BookOpen, FileText, Target, PenTool, GraduationCap, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ContentItemType = Database['public']['Enums']['content_item_type'];

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
  target_percentage?: number;
}

interface Subject {
  id: string;
  name: string;
  batch_id: string;
}

interface Chapter {
  id: string;
  name: string;
  subject_id: string;
}

interface ContentItem {
  id: string;
  name: string;
  number: number;
  item_type: string;
  chapter_id: string;
}

interface ScheduleItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleItem: () => void;
}

const contentTypes = [
  { value: 'lectures' as ContentItemType, label: 'Lectures', icon: GraduationCap, color: 'from-blue-500 to-blue-600', description: 'Video lectures and recorded sessions' },
  { value: 'notes' as ContentItemType, label: 'Notes', icon: FileText, color: 'from-green-500 to-green-600', description: 'Study notes and written materials' },
  { value: 'dpps' as ContentItemType, label: 'DPPs', icon: BookOpen, color: 'from-purple-500 to-purple-600', description: 'Daily Practice Problems' },
  { value: 'homework' as ContentItemType, label: 'Homework', icon: PenTool, color: 'from-orange-500 to-orange-600', description: 'Assignments and homework tasks' }
];

const ScheduleItemModal = ({ isOpen, onClose, onScheduleItem }: ScheduleItemModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'batch' | 'subject' | 'chapter' | 'contentType' | 'content'>('batch');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentItemType | ''>('');
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchBatches();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedBatch) {
      fetchSubjects();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter && selectedContentType) {
      fetchContentItems();
    }
  }, [selectedChapter, selectedContentType]);

  const fetchBatches = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to fetch batches: ${error.message}`);
    } else {
      setBatches(data || []);
    }
    setIsLoading(false);
  };

  const fetchSubjects = async () => {
    if (!user || !selectedBatch) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('batch_id', selectedBatch.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to fetch subjects: ${error.message}`);
    } else {
      setSubjects(data || []);
    }
    setIsLoading(false);
  };

  const fetchChapters = async () => {
    if (!user || !selectedSubject) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', selectedSubject.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to fetch chapters: ${error.message}`);
    } else {
      setChapters(data || []);
    }
    setIsLoading(false);
  };

  const fetchContentItems = async () => {
    if (!user || !selectedChapter || !selectedContentType) return;
    setIsLoading(true);
    console.log('Fetching content items with:', {
      chapter_id: selectedChapter.id,
      user_id: user.id,
      item_type: selectedContentType
    });
    
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('chapter_id', selectedChapter.id)
      .eq('user_id', user.id)
      .eq('item_type', selectedContentType as ContentItemType)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching content items:', error);
      toast.error(`Failed to fetch content items: ${error.message}`);
    } else {
      console.log('Fetched content items:', data);
      setContentItems(data || []);
    }
    setIsLoading(false);
  };

  const handleScheduleItems = async () => {
    if (!user || !selectedBatch || !selectedSubject || !selectedChapter || selectedContent.length === 0) {
      toast.error("Please select all required fields and at least one content item");
      return;
    }

    setIsLoading(true);
    
    try {
      // Schedule multiple items
      const schedulePromises = selectedContent.map(content => 
        supabase
          .from('scheduled_items')
          .insert({
            user_id: user.id,
            batch_id: selectedBatch.id,
            subject_name: selectedSubject.name,
            chapter_name: selectedChapter.name,
            content_item_id: content.id,
            item_type: content.item_type,
            item_name: content.name,
            item_number: content.number,
            scheduled_date: scheduledDate,
          })
      );

      const results = await Promise.all(schedulePromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        toast.error(`Failed to schedule ${errors.length} item(s)`);
      } else {
        toast.success(`Successfully scheduled ${selectedContent.length} item(s)!`);
        onScheduleItem();
        handleClose();
      }
    } catch (error) {
      toast.error("An error occurred while scheduling items");
    }
    
    setIsLoading(false);
  };

  const handleContentToggle = (content: ContentItem) => {
    setSelectedContent(prev => {
      const isSelected = prev.some(item => item.id === content.id);
      if (isSelected) {
        return prev.filter(item => item.id !== content.id);
      } else {
        return [...prev, content];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContent.length === contentItems.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent([...contentItems]);
    }
  };

  const handleClose = () => {
    setStep('batch');
    setSelectedBatch(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedContentType('');
    setSelectedContent([]);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const handleBack = () => {
    if (step === 'subject') {
      setStep('batch');
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedContentType('');
      setSelectedContent([]);
    } else if (step === 'chapter') {
      setStep('subject');
      setSelectedChapter(null);
      setSelectedContentType('');
      setSelectedContent([]);
    } else if (step === 'contentType') {
      setStep('chapter');
      setSelectedContentType('');
      setSelectedContent([]);
    } else if (step === 'content') {
      setStep('contentType');
      setSelectedContent([]);
    }
  };

  const handleNext = () => {
    if (step === 'batch' && selectedBatch) {
      setStep('subject');
    } else if (step === 'subject' && selectedSubject) {
      setStep('chapter');
    } else if (step === 'chapter' && selectedChapter) {
      setStep('contentType');
    } else if (step === 'contentType' && selectedContentType) {
      setStep('content');
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'batch': return 1;
      case 'subject': return 2;
      case 'chapter': return 3;
      case 'contentType': return 4;
      case 'content': return 5;
      default: return 1;
    }
  };

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(ct => ct.value === type);
    return contentType?.icon || FileText;
  };

  const getContentTypeColor = (type: string) => {
    const contentType = contentTypes.find(ct => ct.value === type);
    return contentType?.color || 'from-gray-500 to-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'batch' && (
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>
              Schedule Items - Step {getStepNumber()} of 5
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Step Content */}
          {step === 'batch' && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                Select Batch
              </h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {batches.map((batch) => (
                  <Card
                    key={batch.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      selectedBatch?.id === batch.id
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500 shadow-lg'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <h4 className="font-medium text-lg">{batch.name}</h4>
                    <p className="text-sm text-slate-400">{batch.date}</p>
                    <p className="text-xs text-slate-500 mt-1">{batch.sources} sources</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'subject' && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                Select Subject
              </h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {subjects.map((subject) => (
                  <Card
                    key={subject.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      selectedSubject?.id === subject.id
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500 shadow-lg'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <h4 className="font-medium text-lg">{subject.name}</h4>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'chapter' && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                Select Chapter
              </h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {chapters.map((chapter) => (
                  <Card
                    key={chapter.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500 shadow-lg'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <h4 className="font-medium text-lg">{chapter.name}</h4>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'contentType' && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                What would you like to schedule?
              </h3>
              <p className="text-slate-400 mb-6">Choose the type of content you want to add to your schedule</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className={`p-6 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        selectedContentType === type.value
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500 shadow-lg'
                          : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                      }`}
                      onClick={() => setSelectedContentType(type.value)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-white">{type.label}</h4>
                          <p className="text-sm text-slate-400 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  Select {contentTypes.find(ct => ct.value === selectedContentType)?.label}
                </h3>
                {contentItems.length > 0 && (
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-700 text-white"
                  >
                    {selectedContent.length === contentItems.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
              
              {selectedContent.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                  <p className="text-sm text-indigo-300">
                    {selectedContent.length} item(s) selected for scheduling
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {contentItems.length > 0 ? (
                  contentItems.map((item) => {
                    const Icon = getContentTypeIcon(item.item_type);
                    const colorClass = getContentTypeColor(item.item_type);
                    const isSelected = selectedContent.some(content => content.id === item.id);
                    
                    return (
                      <Card
                        key={item.id}
                        className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500 shadow-lg'
                            : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                        }`}
                        onClick={() => handleContentToggle(item)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{item.name}</h4>
                            <p className="text-sm text-slate-400 capitalize">
                              {item.item_type.slice(0, -1)} #{item.number}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400">No {selectedContentType} found for this chapter</p>
                    <p className="text-sm text-slate-500 mt-1">Try creating some content first</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-700">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700 text-white"
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              {step !== 'content' ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    !selectedBatch ||
                    (step === 'subject' && !selectedSubject) ||
                    (step === 'chapter' && !selectedChapter) ||
                    (step === 'contentType' && !selectedContentType)
                  }
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleScheduleItems}
                  disabled={selectedContent.length === 0 || isLoading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6"
                >
                  {isLoading ? 'Scheduling...' : `✓ Schedule ${selectedContent.length} Item(s)`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleItemModal;
