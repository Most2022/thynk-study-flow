import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchTarget {
  id: string;
  target_type: 'weekly' | 'monthly';
  target_value: number;
  start_date: string;
  end_date: string;
}

interface BatchTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchName: string;
  onTargetCreated: () => void;
}

const BatchTargetModal = ({ isOpen, onClose, batchId, batchName, onTargetCreated }: BatchTargetModalProps) => {
  const { user } = useAuth();
  const [targetType, setTargetType] = useState<'weekly' | 'monthly'>('weekly');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingTargets, setExistingTargets] = useState<BatchTarget[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchExistingTargets();
      setDefaultDates();
    }
  }, [isOpen, user, batchId]);

  const setDefaultDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    setStartDate(startOfWeek.toISOString().split('T')[0]);
  };

  const fetchExistingTargets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('batch_targets')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to fetch targets: ${error.message}`);
    } else {
      // Type assertion to ensure target_type is properly typed
      const typedTargets = (data || []).map(target => ({
        ...target,
        target_type: target.target_type as 'weekly' | 'monthly'
      }));
      setExistingTargets(typedTargets);
    }
  };

  const calculateEndDate = (start: string, type: 'weekly' | 'monthly') => {
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    
    if (type === 'weekly') {
      endDate.setDate(startDate.getDate() + 6);
    } else {
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
    }
    
    return endDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !targetValue || !startDate) return;

    const value = parseInt(targetValue);
    if (value < 0 || value > 100) {
      toast.error('Target value must be between 0 and 100');
      return;
    }

    setIsLoading(true);
    try {
      const endDate = calculateEndDate(startDate, targetType);

      const { error } = await supabase
        .from('batch_targets')
        .insert({
          user_id: user.id,
          batch_id: batchId,
          target_type: targetType,
          target_value: value,
          start_date: startDate,
          end_date: endDate,
        });

      if (error) {
        toast.error(`Failed to create target: ${error.message}`);
      } else {
        toast.success(`${targetType.charAt(0).toUpperCase() + targetType.slice(1)} target created successfully!`);
        setTargetValue('');
        fetchExistingTargets();
        onTargetCreated();
      }
    } catch (error) {
      toast.error('Failed to create target');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTarget = async (targetId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('batch_targets')
      .delete()
      .eq('id', targetId)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete target: ${error.message}`);
    } else {
      toast.success('Target deleted successfully!');
      fetchExistingTargets();
      onTargetCreated();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Set Target for {batchName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="target-type">Target Type</Label>
            <Select value={targetType} onValueChange={(value: 'weekly' | 'monthly') => setTargetType(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="weekly">Weekly Target</SelectItem>
                <SelectItem value="monthly">Monthly Target</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target-value">Target Percentage</Label>
            <Input
              id="target-value"
              type="number"
              min="0"
              max="100"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Enter target percentage (0-100)"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
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
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Creating...' : 'Create Target'}
            </Button>
          </div>
        </form>

        {existingTargets.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Existing Targets</h4>
            <div className="space-y-2">
              {existingTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                  <div className="text-sm">
                    <span className="font-medium">{target.target_value}%</span>
                    <span className="text-slate-400 ml-2">
                      {target.target_type} ({target.start_date} to {target.end_date})
                    </span>
                  </div>
                  <Button
                    onClick={() => deleteTarget(target.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchTargetModal;
