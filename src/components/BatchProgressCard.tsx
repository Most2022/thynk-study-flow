import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, TrendingUp, Calendar, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BatchTaskModal from './BatchTaskModal';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
  target_percentage?: number;
}

interface BatchTask {
  id: string;
  title: string;
  task_type: 'weekly' | 'monthly';
  is_completed: boolean;
}

interface BatchProgressCardProps {
  batch: Batch;
  onUpdateProgress: () => void;
}

const BatchProgressCard = ({ batch, onUpdateProgress }: BatchProgressCardProps) => {
  const { user } = useAuth();
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [completedItems, setCompletedItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState<BatchTask[]>([]);

  useEffect(() => {
    if (user && batch.id) {
      fetchBatchProgress();
      fetchTasks();
    }
  }, [user, batch.id]);

  const fetchBatchProgress = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all scheduled items for this batch
      const { data: scheduledItems, error } = await supabase
        .from('scheduled_items')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('batch_id', batch.id);

      if (error) {
        toast.error(`Failed to fetch batch progress: ${error.message}`);
        return;
      }

      const total = scheduledItems?.length || 0;
      const completed = scheduledItems?.filter(item => item.is_completed).length || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      setTotalItems(total);
      setCompletedItems(completed);
      setCurrentProgress(progress);
    } catch (error) {
      toast.error('Failed to fetch batch progress');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('batch_tasks')
      .select('id, title, task_type, is_completed')
      .eq('user_id', user.id)
      .eq('batch_id', batch.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
    } else {
      // Type assertion to ensure task_type is properly typed
      const typedTasks = (data || []).map(task => ({
        ...task,
        task_type: task.task_type as 'weekly' | 'monthly'
      }));
      setTasks(typedTasks);
    }
  };

  const updateTargetPercentage = async (newTarget: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('batches')
      .update({ target_percentage: newTarget })
      .eq('id', batch.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to update target: ${error.message}`);
    } else {
      toast.success(`Target updated to ${newTarget}%`);
      onUpdateProgress();
    }
  };

  const getProgressColor = () => {
    const target = batch.target_percentage || 0;
    if (currentProgress >= target) {
      return 'from-green-500 to-green-600';
    } else if (currentProgress >= target * 0.7) {
      return 'from-yellow-500 to-orange-500';
    } else {
      return 'from-red-500 to-red-600';
    }
  };

  const getStatusMessage = () => {
    const target = batch.target_percentage || 0;
    if (currentProgress >= target) {
      return 'Target achieved! 🎉';
    } else {
      const remaining = target - currentProgress;
      return `${remaining}% to reach target`;
    }
  };

  const getTaskSummary = () => {
    const weeklyTasks = tasks.filter(t => t.task_type === 'weekly');
    const monthlyTasks = tasks.filter(t => t.task_type === 'monthly');
    const completedWeekly = weeklyTasks.filter(t => t.is_completed).length;
    const completedMonthly = monthlyTasks.filter(t => t.is_completed).length;
    
    return { weeklyTasks, monthlyTasks, completedWeekly, completedMonthly };
  };

  const taskSummary = getTaskSummary();

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{batch.name}</h3>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {batch.date}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {completedItems}/{totalItems} completed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{currentProgress}%</div>
            <div className="text-sm text-slate-400">Progress</div>
          </div>
          <Button
            onClick={() => setShowTaskModal(true)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task Summary Display */}
      {tasks.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Your Tasks</h4>
          {taskSummary.weeklyTasks.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400 font-medium">Weekly Tasks</span>
              <span className="text-white">
                {taskSummary.completedWeekly}/{taskSummary.weeklyTasks.length} completed
              </span>
            </div>
          )}
          {taskSummary.monthlyTasks.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-400 font-medium">Monthly Tasks</span>
              <span className="text-white">
                {taskSummary.completedMonthly}/{taskSummary.monthlyTasks.length} completed
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Current Progress</span>
          <span className="text-white font-medium">{currentProgress}%</span>
        </div>
        <Progress 
          value={currentProgress} 
          className="h-3"
        />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Target</span>
          <span className="text-white font-medium">{batch.target_percentage || 0}%</span>
        </div>
        <Progress 
          value={batch.target_percentage || 0} 
          className="h-2 opacity-60"
        />
      </div>

      <div className={`p-3 rounded-lg bg-gradient-to-r ${getProgressColor()}/20 border border-current/20 mb-4`}>
        <p className="text-sm font-medium text-white">{getStatusMessage()}</p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => updateTargetPercentage(50)}
          variant="outline"
          size="sm"
          className="border-slate-600 hover:bg-slate-700 text-white flex-1"
        >
          50% Target
        </Button>
        <Button
          onClick={() => updateTargetPercentage(75)}
          variant="outline"
          size="sm"
          className="border-slate-600 hover:bg-slate-700 text-white flex-1"
        >
          75% Target
        </Button>
        <Button
          onClick={() => updateTargetPercentage(100)}
          variant="outline"
          size="sm"
          className="border-slate-600 hover:bg-slate-700 text-white flex-1"
        >
          100% Target
        </Button>
      </div>

      <BatchTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        batchId={batch.id}
        batchName={batch.name}
        onTaskCreated={() => {
          fetchTasks();
          onUpdateProgress();
        }}
      />
    </Card>
  );
};

export default BatchProgressCard;
