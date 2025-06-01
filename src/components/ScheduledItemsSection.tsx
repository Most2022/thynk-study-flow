
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Plus, CheckCircle, Clock, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ScheduleItemModal from './ScheduleItemModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledItem {
  id: string;
  batch_id: string;
  subject_name: string;
  chapter_name: string;
  content_item_id: string;
  item_type: string;
  item_name: string;
  item_number: number;
  is_completed: boolean;
  scheduled_date: string;
  created_at: string;
}

const ScheduledItemsSection = () => {
  const { user } = useAuth();
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScheduledItem | null>(null);

  useEffect(() => {
    if (user) {
      fetchScheduledItems();
    }
  }, [user]);

  const fetchScheduledItems = async () => {
    if (!user) return;
    setIsLoadingItems(true);
    
    const { data, error } = await supabase
      .from('scheduled_items')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`Failed to fetch scheduled items: ${error.message}`);
    } else {
      setScheduledItems(data || []);
    }
    setIsLoadingItems(false);
  };

  const handleToggleComplete = async (item: ScheduledItem) => {
    if (!user) return;

    const newCompletedStatus = !item.is_completed;

    // Update scheduled item
    const { error: updateError } = await supabase
      .from('scheduled_items')
      .update({ is_completed: newCompletedStatus })
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (updateError) {
      toast.error(`Failed to update item: ${updateError.message}`);
      return;
    }

    // Update content item status
    const { error: contentUpdateError } = await supabase
      .from('content_items')
      .update({ status: newCompletedStatus ? 'completed' : 'incomplete' })
      .eq('id', item.content_item_id)
      .eq('user_id', user.id);

    if (contentUpdateError) {
      toast.error(`Failed to update content status: ${contentUpdateError.message}`);
      return;
    }

    const action = newCompletedStatus ? 'completed' : 'marked as incomplete';
    toast.success(`Task ${action} successfully! ✅`, {
      description: `"${item.item_name}" has been updated in your batch content.`
    });
    
    fetchScheduledItems();
  };

  const openDeleteDialog = (item: ScheduledItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !user) return;

    const { error } = await supabase
      .from('scheduled_items')
      .delete()
      .eq('id', itemToDelete.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error(`Failed to delete item: ${error.message}`);
    } else {
      toast.success("Scheduled item deleted successfully");
      fetchScheduledItems();
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const getTodayItems = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduledItems.filter(item => item.scheduled_date === today);
  };

  const getUpcomingItems = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduledItems.filter(item => item.scheduled_date > today);
  };

  const getOverdueItems = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduledItems.filter(item => item.scheduled_date < today && !item.is_completed);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItemCard = (item: ScheduledItem) => (
    <Card 
      key={item.id} 
      className={`group relative transition-all duration-300 hover:scale-[1.02] ${
        item.is_completed 
          ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30' 
          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
      }`}
    >
      {/* Delete Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          openDeleteDialog(item);
        }}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10 z-10"
        title="Delete scheduled item"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-lg ${item.is_completed ? 'text-green-300 line-through' : 'text-white'}`}>
                {item.item_name}
              </h4>
              {item.is_completed && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-700/50">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 capitalize font-medium">
              {item.item_type.slice(0, -1)} #{item.item_number}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              📚 {item.subject_name} • 📖 {item.chapter_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            📅 {formatDate(item.scheduled_date)}
          </div>
          
          <Button
            onClick={() => handleToggleComplete(item)}
            variant="ghost"
            size="sm"
            className={`transition-all duration-200 ${
              item.is_completed
                ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={item.is_completed ? "Mark as incomplete" : "Mark as complete"}
          >
            {item.is_completed ? (
              <RotateCcw className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className={`mt-3 h-1 rounded-full ${
          item.is_completed ? 'bg-green-500' : 'bg-slate-600'
        }`} />
      </div>
    </Card>
  );

  const todayItems = getTodayItems();
  const upcomingItems = getUpcomingItems();
  const overdueItems = getOverdueItems();

  const completedCount = scheduledItems.filter(item => item.is_completed).length;
  const totalCount = scheduledItems.length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Today Scheduled</h2>
              {totalCount > 0 && (
                <p className="text-sm text-slate-400">
                  {completedCount} of {totalCount} tasks completed ({Math.round((completedCount / totalCount) * 100)}%)
                </p>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowScheduleModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Item
        </Button>
      </div>

      {isLoadingItems && (
        <div className="text-center py-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
            Loading scheduled items...
          </div>
        </div>
      )}

      {!isLoadingItems && scheduledItems.length === 0 && (
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-sm p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No scheduled items yet</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Start organizing your study schedule by adding tasks from your batches and chapters
          </p>
          <Button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Your First Item
          </Button>
        </Card>
      )}

      {!isLoadingItems && scheduledItems.length > 0 && (
        <div className="space-y-8">
          {/* Overdue Items */}
          {overdueItems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400">
                  Overdue ({overdueItems.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Today's Items */}
          {todayItems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-400">
                  Today ({todayItems.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Upcoming Items */}
          {upcomingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-blue-400">
                  Upcoming ({upcomingItems.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingItems.map(renderItemCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <ScheduleItemModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onScheduleItem={fetchScheduledItems}
      />

      {itemToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scheduled Item?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Are you sure you want to delete "{itemToDelete.item_name}" from your schedule? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setItemToDelete(null)}
                className="bg-transparent hover:bg-white/10 text-white border-white/20"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteItem}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ScheduledItemsSection;
