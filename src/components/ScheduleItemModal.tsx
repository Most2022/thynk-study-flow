
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
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

const ScheduleItemModal = ({ isOpen, onClose, onScheduleItem }: ScheduleItemModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'batch' | 'subject' | 'chapter' | 'content'>('batch');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
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
    if (selectedChapter) {
      fetchContentItems();
    }
  }, [selectedChapter]);

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
    if (!user || !selectedChapter) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('chapter_id', selectedChapter.id)
      .eq('user_id', user.id)
      .order('number', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch content items: ${error.message}`);
    } else {
      setContentItems(data || []);
    }
    setIsLoading(false);
  };

  const handleScheduleItem = async () => {
    if (!user || !selectedBatch || !selectedSubject || !selectedChapter || !selectedContent) {
      toast.error("Please select all required fields");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('scheduled_items')
      .insert({
        user_id: user.id,
        batch_id: selectedBatch.id,
        subject_name: selectedSubject.name,
        chapter_name: selectedChapter.name,
        content_item_id: selectedContent.id,
        item_type: selectedContent.item_type,
        item_name: selectedContent.name,
        item_number: selectedContent.number,
        scheduled_date: scheduledDate,
      });

    if (error) {
      toast.error(`Failed to schedule item: ${error.message}`);
    } else {
      toast.success("Item scheduled successfully!");
      onScheduleItem();
      handleClose();
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setStep('batch');
    setSelectedBatch(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedContent(null);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const handleBack = () => {
    if (step === 'subject') {
      setStep('batch');
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedContent(null);
    } else if (step === 'chapter') {
      setStep('subject');
      setSelectedChapter(null);
      setSelectedContent(null);
    } else if (step === 'content') {
      setStep('chapter');
      setSelectedContent(null);
    }
  };

  const handleNext = () => {
    if (step === 'batch' && selectedBatch) {
      setStep('subject');
    } else if (step === 'subject' && selectedSubject) {
      setStep('chapter');
    } else if (step === 'chapter' && selectedChapter) {
      setStep('content');
    }
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
              Schedule Item - Step {step === 'batch' ? '1' : step === 'subject' ? '2' : step === 'chapter' ? '3' : '4'} of 4
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Scheduled Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          {/* Step Content */}
          {step === 'batch' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Batch</h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {batches.map((batch) => (
                  <Card
                    key={batch.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedBatch?.id === batch.id
                        ? 'bg-indigo-600/20 border-indigo-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <h4 className="font-medium">{batch.name}</h4>
                    <p className="text-sm text-slate-400">{batch.date}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'subject' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Subject</h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {subjects.map((subject) => (
                  <Card
                    key={subject.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedSubject?.id === subject.id
                        ? 'bg-indigo-600/20 border-indigo-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <h4 className="font-medium">{subject.name}</h4>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'chapter' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Chapter</h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {chapters.map((chapter) => (
                  <Card
                    key={chapter.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-indigo-600/20 border-indigo-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <h4 className="font-medium">{chapter.name}</h4>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'content' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Content Item</h3>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {contentItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedContent?.id === item.id
                        ? 'bg-indigo-600/20 border-indigo-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600'
                    }`}
                    onClick={() => setSelectedContent(item)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-slate-400 capitalize">
                          {item.item_type.slice(0, -1)} #{item.number}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {step !== 'content' ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    !selectedBatch ||
                    (step === 'subject' && !selectedSubject) ||
                    (step === 'chapter' && !selectedChapter)
                  }
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleScheduleItem}
                  disabled={!selectedContent || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Scheduling...' : 'Schedule Item'}
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
