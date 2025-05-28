
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateScheduledTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

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

const CreateScheduledTaskModal = ({ isOpen, onClose, onTaskCreated }: CreateScheduledTaskModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  
  // Data arrays
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  
  // Loading states
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Fetch batches on mount
  useEffect(() => {
    if (isOpen && user) {
      fetchBatches();
    }
  }, [isOpen, user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedBatchId('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedContentId('');
    setSubjects([]);
    setChapters([]);
    setContentItems([]);
    setSelectedDate(new Date());
  };

  const fetchBatches = async () => {
    if (!user) return;
    
    setIsLoadingBatches(true);
    const { data, error } = await supabase
      .from('batches')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to fetch batches: ${error.message}`);
      setBatches([]);
    } else {
      setBatches(data || []);
    }
    setIsLoadingBatches(false);
  };

  const fetchSubjects = async (batchId: string) => {
    if (!user) return;
    
    setIsLoadingSubjects(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('batch_id', batchId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch subjects: ${error.message}`);
      setSubjects([]);
    } else {
      setSubjects(data || []);
    }
    setIsLoadingSubjects(false);
  };

  const fetchChapters = async (subjectId: string) => {
    if (!user) return;
    
    setIsLoadingChapters(true);
    const { data, error } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch chapters: ${error.message}`);
      setChapters([]);
    } else {
      setChapters(data || []);
    }
    setIsLoadingChapters(false);
  };

  const fetchContentItems = async (chapterId: string) => {
    if (!user) return;
    
    setIsLoadingContent(true);
    const { data, error } = await supabase
      .from('content_items')
      .select('id, name, item_type, item_number')
      .eq('chapter_id', chapterId)
      .eq('user_id', user.id)
      .order('item_type', { ascending: true })
      .order('item_number', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch content items: ${error.message}`);
      setContentItems([]);
    } else {
      setContentItems(data || []);
    }
    setIsLoadingContent(false);
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedContentId('');
    setSubjects([]);
    setChapters([]);
    setContentItems([]);
    fetchSubjects(batchId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    setSelectedContentId('');
    setChapters([]);
    setContentItems([]);
    fetchChapters(subjectId);
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSelectedContentId('');
    setContentItems([]);
    fetchContentItems(chapterId);
  };

  const handleSubmit = async () => {
    if (!user || !selectedBatchId || !selectedSubjectId || !selectedChapterId || !selectedContentId || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Find the selected content item to get its details
    const contentItem = contentItems.find(item => item.id === selectedContentId);
    if (!contentItem) {
      toast.error('Selected content item not found');
      setIsSubmitting(false);
      return;
    }

    // Create task name based on content item
    const taskName = `${contentItem.name} (${contentItem.item_type.charAt(0).toUpperCase() + contentItem.item_type.slice(1)} #${contentItem.item_number})`;

    const { error } = await supabase
      .from('scheduled_tasks')
      .insert({
        user_id: user.id,
        batch_id: selectedBatchId,
        subject_id: selectedSubjectId,
        chapter_id: selectedChapterId,
        content_item_id: selectedContentId,
        task_name: taskName,
        task_type: contentItem.item_type,
        task_number: contentItem.item_number,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        status: 'incomplete'
      });

    if (error) {
      toast.error(`Failed to schedule task: ${error.message}`);
    } else {
      toast.success('Task scheduled successfully!');
      onTaskCreated();
      onClose();
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Schedule a Task</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select content from your batches to schedule for a specific date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div>
            <Label className="text-slate-300">Scheduled Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1 bg-slate-700 border-slate-600 hover:bg-slate-600 text-white",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Batch Selection */}
          <div>
            <Label className="text-slate-300">Batch</Label>
            <Select onValueChange={handleBatchChange} value={selectedBatchId}>
              <SelectTrigger className="w-full mt-1 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder={isLoadingBatches ? "Loading batches..." : "Select a batch"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="hover:bg-slate-600">
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          <div>
            <Label className="text-slate-300">Subject</Label>
            <Select onValueChange={handleSubjectChange} value={selectedSubjectId} disabled={!selectedBatchId}>
              <SelectTrigger className="w-full mt-1 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder={isLoadingSubjects ? "Loading subjects..." : "Select a subject"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id} className="hover:bg-slate-600">
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter Selection */}
          <div>
            <Label className="text-slate-300">Chapter</Label>
            <Select onValueChange={handleChapterChange} value={selectedChapterId} disabled={!selectedSubjectId}>
              <SelectTrigger className="w-full mt-1 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder={isLoadingChapters ? "Loading chapters..." : "Select a chapter"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id} className="hover:bg-slate-600">
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Item Selection */}
          <div>
            <Label className="text-slate-300">Content Item</Label>
            <Select onValueChange={setSelectedContentId} value={selectedContentId} disabled={!selectedChapterId}>
              <SelectTrigger className="w-full mt-1 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder={isLoadingContent ? "Loading content..." : "Select content to schedule"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {contentItems.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="hover:bg-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{item.item_type}</span>
                      <span>#{item.item_number}:</span>
                      <span>{item.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="text-white border-slate-600 hover:bg-slate-700">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white" 
            disabled={isSubmitting || !selectedContentId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScheduledTaskModal;
