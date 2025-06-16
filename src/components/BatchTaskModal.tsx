import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchTask {
  id: string;
  title: string;
  description: string | null;
  task_type: 'weekly' | 'monthly';
  is_completed: boolean;
  created_at: string;
}

interface BatchTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchName: string;
  onTaskCreated: () => void;
}

const BatchTaskModal = ({ isOpen, onClose, batchId, batchName, onTaskCreated }: BatchTaskModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [existingTasks, setExistingTasks] = useState<BatchTask[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchExistingTasks();
    }
  }, [isOpen, user, batchId]);

  const fetchExistingTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('batch_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to fetch tasks: ${error.message}`);
    } else {
      // Type assertion to ensure task_type is properly typed
      const typedTasks = (data || []).map(task => ({
        ...task,
        task_type: task.task_type as 'weekly' | 'monthly'
      }));
      setExistingTasks(typedTasks);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('batch_tasks')
        .insert({
          user_id: user.id,
          batch_id: batchId,
          title: title.trim(),
          description: description.trim() || null,
          task_type: taskType,
        });

      if (error) {
        toast.error(`Failed to create task: ${error.message}`);
      } else {
        toast.success(`${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task created successfully!`);
        setTitle('');
        setDescription('');
        fetchExistingTasks();
        onTaskCreated();
      }
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('batch_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to update task: ${error.message}`);
    } else {
      toast.success(`Task ${!currentStatus ? 'completed' : 'marked incomplete'}!`);
      fetchExistingTasks();
      onTaskCreated();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('batch_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete task: ${error.message}`);
    } else {
      toast.success('Task deleted successfully!');
      fetchExistingTasks();
      onTaskCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Tasks for {batchName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="task-type">Task Type</Label>
            <Select value={taskType} onValueChange={(value: 'weekly' | 'monthly') => setTaskType(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="weekly">Weekly Task</SelectItem>
                <SelectItem value="monthly">Monthly Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isLoading ? 'Creating...' : 'Add Task'}
            </Button>
          </div>
        </form>

        {existingTasks.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Your Tasks</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {existingTasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-700/50 rounded border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            task.is_completed 
                              ? 'bg-green-600 border-green-600' 
                              : 'border-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {task.is_completed && (
                            <CheckSquare className="w-3 h-3 text-white" />
                          )}
                        </button>
                        <span className={`font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.task_type === 'weekly' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-purple-600/20 text-purple-400'
                        }`}>
                          {task.task_type}
                        </span>
                      </div>
                      {task.description && (
                        <p className={`text-sm ${task.is_completed ? 'text-slate-500' : 'text-slate-300'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => deleteTask(task.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-2"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchTaskModal;
