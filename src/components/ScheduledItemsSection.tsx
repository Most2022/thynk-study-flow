
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';
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

    const { error: updateError } = await supabase
      .from('scheduled_items')
      .update({ is_completed: !item.is_completed })
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (updateError) {
      toast.error(`Failed to update item: ${updateError.message}`);
      return;
    }

    // Update the content item status in the content_items table
    const { error: contentUpdateError } = await supabase
      .from('content_items')
      .update({ status: !item.is_completed ? 'completed' : 'incomplete' })
      .eq('id', item.content_item_id)
      .eq('user_id', user.id);

    if (contentUpdateError) {
      toast.error(`Failed to update content status: ${contentUpdateError.message}`);
      return;
    }

    toast.success(`Item marked as ${!item.is_completed ? 'completed' : 'incomplete'}`);
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
    <Card key={item.id} className="bg-slate-800/50 border-slate-700/50 p-4 group relative">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          openDeleteDialog(item);
        }}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10"
        title="Delete scheduled item"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-white">{item.item_name}</h4>
          <p className="text-sm text-slate-400 capitalize">
            {item.item_type.slice(0, -1)} #{item.item_number}
          </p>
          <p className="text-xs text-slate-500">
            {item.subject_name} • {item.chapter_name}
          </p>
        </div>
        <Button
          onClick={() => handleToggleComplete(item)}
          variant="ghost"
          size="sm"
          className={`ml-2 ${
            item.is_completed
              ? 'text-green-400 hover:text-green-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {item.is_completed ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      <div className="text-xs text-slate-500">
        Scheduled: {formatDate(item.scheduled_date)}
      </div>
    </Card>
  );

  const todayItems = getTodayItems();
  const upcomingItems = getUpcomingItems();
  const overdueItems = getOverdueItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Today Scheduled</h2>
        </div>
        <Button 
          onClick={() => setShowScheduleModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Item
        </Button>
      </div>

      {isLoadingItems && (
        <div className="text-center py-10 text-white">Loading scheduled items...</div>
      )}

      {!isLoadingItems && scheduledItems.length === 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8 text-center">
          <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No scheduled items yet</h3>
          <p className="text-slate-400 mb-6">Start by scheduling some tasks from your batches</p>
          <Button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Item
          </Button>
        </Card>
      )}

      {!isLoadingItems && scheduledItems.length > 0 && (
        <div className="space-y-6">
          {/* Overdue Items */}
          {overdueItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Overdue ({overdueItems.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Today's Items */}
          {todayItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today ({todayItems.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Upcoming Items */}
          {upcomingItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming ({upcomingItems.length})
              </h3>
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
