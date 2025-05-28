import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import CreateScheduledTaskModal from './CreateScheduledTaskModal';

interface ScheduledTask {
  id: string;
  task_name: string;
  task_type: string;
  task_number: number;
  status: string;
  batch_id: string;
  subject_id: string;
  chapter_id: string;
  content_item_id?: string;
  scheduled_date: string;
  batch?: { name: string };
  subject?: { name: string };
  chapter?: { name: string };
  content_item?: { name: string };
}

interface TodayScheduledProps {
  onTaskComplete?: () => void;
}

const TodayScheduled = ({ onTaskComplete }: TodayScheduledProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayTasks();
    }
  }, [user]);

  const fetchTodayTasks = async () => {
    if (!user) return;

    setIsLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select(`
        *,
        batch:batches(name),
        subject:subjects(name),
        chapter:chapters(name),
        content_item:content_items(name)
      `)
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch scheduled tasks: ' + error.message);
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  };

  const handleTaskStatusToggle = async (task: ScheduledTask) => {
    const newStatus = task.status === 'completed' ? 'incomplete' : 'completed';
    
    // Update the scheduled task status
    const { error: taskError } = await supabase
      .from('scheduled_tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (taskError) {
      toast.error('Failed to update task status: ' + taskError.message);
      return;
    }

    // If task is being marked as completed and has a content item, update the content item status too
    if (newStatus === 'completed' && task.content_item_id) {
      const { error: contentError } = await supabase
        .from('content_items')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.content_item_id);

      if (contentError) {
        console.error('Failed to update content item status:', contentError.message);
        // Don't show error to user as the main task update succeeded
      }
    }

    // If task is being marked as incomplete and has a content item, update the content item status too
    if (newStatus === 'incomplete' && task.content_item_id) {
      const { error: contentError } = await supabase
        .from('content_items')
        .update({ 
          status: 'incomplete',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.content_item_id);

      if (contentError) {
        console.error('Failed to update content item status:', contentError.message);
      }
    }

    // Update local state
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      )
    );
    
    toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task marked as incomplete');
    
    if (newStatus === 'completed' && onTaskComplete) {
      onTaskComplete();
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'lectures': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'notes': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'dpps': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'homework': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">Loading scheduled tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today Scheduled
            </CardTitle>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 mb-4">No tasks scheduled for today</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule your first task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Button
                    onClick={() => handleTaskStatusToggle(task)}
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto hover:bg-transparent"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/40 hover:text-white/60" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${task.status === 'completed' ? 'text-white/60 line-through' : 'text-white'}`}>
                        {task.task_name}
                      </span>
                      <Badge className={getTaskTypeColor(task.task_type)}>
                        {task.task_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-white/60">
                      {task.batch?.name} → {task.subject?.name} → {task.chapter?.name}
                      {task.content_item?.name && ` → ${task.content_item.name}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateScheduledTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={fetchTodayTasks}
      />
    </>
  );
};

export default TodayScheduled;
