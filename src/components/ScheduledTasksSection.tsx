
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CreateScheduledTaskModal from './CreateScheduledTaskModal';

interface ScheduledTask {
  id: string;
  task_name: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  batch_name?: string;
  subject_name?: string;
  chapter_name?: string;
}

interface ScheduledTasksSectionProps {
  onRefresh?: () => void;
}

const ScheduledTasksSection = ({ onRefresh }: ScheduledTasksSectionProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodaysTasks();
    }
  }, [user]);

  const fetchTodaysTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select(`
        id,
        task_name,
        task_type,
        status,
        scheduled_date,
        batches!inner(name),
        subjects!inner(name),
        chapters!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch scheduled tasks: ${error.message}`);
      setTasks([]);
    } else {
      const formattedTasks = data.map(task => ({
        id: task.id,
        task_name: task.task_name,
        task_type: task.task_type,
        status: task.status,
        scheduled_date: task.scheduled_date,
        batch_name: task.batches.name,
        subject_name: task.subjects.name,
        chapter_name: task.chapters.name,
      }));
      setTasks(formattedTasks);
    }
    setIsLoading(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('scheduled_tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to complete task: ${error.message}`);
    } else {
      toast.success('Task completed!');
      fetchTodaysTasks();
      onRefresh?.();
    }
  };

  const handleTaskCreated = () => {
    fetchTodaysTasks();
    onRefresh?.();
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'lecture':
        return '🎥';
      case 'note':
        return '📝';
      case 'dpp':
        return '📋';
      case 'homework':
        return '📚';
      default:
        return '📄';
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'incomplete');

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
        <div className="text-center py-8 text-white">Loading today's schedule...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Today Scheduled</h2>
          <span className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
          <div className="text-center text-white/80">
            <Clock className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-semibold mb-2">No tasks scheduled for today</h3>
            <p className="text-white/60 mb-4">Start by scheduling some tasks to organize your study time</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Task
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getTaskTypeIcon(task.task_type)}</span>
                        <div>
                          <p className="text-white font-medium">{task.task_name}</p>
                          <p className="text-sm text-slate-400">
                            {task.batch_name} → {task.subject_name} → {task.chapter_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCompleteTask(task.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/30"
                    >
                      <span className="text-xl opacity-50">{getTaskTypeIcon(task.task_type)}</span>
                      <div className="flex-1">
                        <p className="text-white/70 font-medium line-through">{task.task_name}</p>
                        <p className="text-sm text-slate-500">
                          {task.batch_name} → {task.subject_name} → {task.chapter_name}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <CreateScheduledTaskModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default ScheduledTasksSection;
