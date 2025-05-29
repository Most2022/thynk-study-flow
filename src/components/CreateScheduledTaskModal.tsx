import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
}

interface ContentItem {
  id: string;
  name: string;
  item_type: string;
  item_number: number;
}

type TaskType = 'lectures' | 'notes' | 'dpps' | 'homework';

interface CreateScheduledTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const CreateScheduledTaskModal = ({ isOpen, onClose, onTaskCreated }: CreateScheduledTaskModalProps) => {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | ''>('');
  const [selectedContentItem, setSelectedContentItem] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchBatches();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedBatch) {
      fetchSubjects();
      setSelectedSubject('');
      setSelectedChapter('');
      setSelectedTaskType('');
      setSelectedContentItem('');
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters();
      setSelectedChapter('');
      setSelectedTaskType('');
      setSelectedContentItem('');
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter && selectedTaskType) {
      fetchContentItems();
      setSelectedContentItem('');
    }
  }, [selectedChapter, selectedTaskType]);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('id, name')
      .eq('user_id', user!.id)
      .order('name');

    if (error) {
      toast.error('Failed to fetch batches: ' + error.message);
    } else {
      setBatches(data || []);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('batch_id', selectedBatch)
      .eq('user_id', user!.id)
      .order('name');

    if (error) {
      toast.error('Failed to fetch subjects: ' + error.message);
    } else {
      setSubjects(data || []);
    }
  };

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', selectedSubject)
      .eq('user_id', user!.id)
      .order('name');

    if (error) {
      toast.error('Failed to fetch chapters: ' + error.message);
    } else {
      setChapters(data || []);
    }
  };

  const fetchContentItems = async () => {
    if (!selectedTaskType) return;
    
    const { data, error } = await supabase
      .from('content_items')
      .select('id, name, item_type, item_number')
      .eq('chapter_id', selectedChapter)
      .eq('item_type', selectedTaskType as TaskType)
      .eq('user_id', user!.id)
      .order('item_number');

    if (error) {
      toast.error('Failed to fetch content items: ' + error.message);
    } else {
      setContentItems(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBatch || !selectedSubject || !selectedChapter || !selectedTaskType || !selectedContentItem) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    // Get the selected content item details
    const selectedContent = contentItems.find(item => item.id === selectedContentItem);
    if (!selectedContent) {
      toast.error('Selected content item not found');
      setIsSubmitting(false);
      return;
    }

    const taskData = {
      user_id: user.id,
      batch_id: selectedBatch,
      subject_id: selectedSubject,
      chapter_id: selectedChapter,
      content_item_id: selectedContentItem,
      task_type: selectedTaskType,
      task_name: `${selectedContent.name} (${selectedTaskType})`,
      task_number: selectedContent.item_number,
      scheduled_date: scheduledDate,
      status: 'incomplete'
    };

    const { error } = await supabase
      .from('scheduled_tasks')
      .insert(taskData);

    if (error) {
      toast.error('Failed to create scheduled task: ' + error.message);
    } else {
      toast.success('Scheduled task created successfully!');
      handleClose();
      onTaskCreated();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setSelectedBatch('');
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedTaskType('');
    setSelectedContentItem('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setBatches([]);
    setSubjects([]);
    setChapters([]);
    setContentItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="batch">Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch} required>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select batch..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="text-white">
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} required disabled={!selectedBatch}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id} className="text-white">
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="chapter">Chapter</Label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter} required disabled={!selectedSubject}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select chapter..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id} className="text-white">
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="taskType">Task Type</Label>
            <Select value={selectedTaskType} onValueChange={(value: TaskType) => setSelectedTaskType(value)} required disabled={!selectedChapter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select task type..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="lectures" className="text-white">Lectures</SelectItem>
                <SelectItem value="notes" className="text-white">Notes</SelectItem>
                <SelectItem value="dpps" className="text-white">DPPs</SelectItem>
                <SelectItem value="homework" className="text-white">Homework</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedTaskType && (
            <div>
              <Label htmlFor="contentItem">Select {selectedTaskType}</Label>
              <Select value={selectedContentItem} onValueChange={setSelectedContentItem} required disabled={!selectedTaskType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder={`Select ${selectedTaskType}...`} />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {contentItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-white">
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-transparent hover:bg-white/10 text-white border-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScheduledTaskModal;
