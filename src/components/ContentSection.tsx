import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, RotateCcw, Play, Trash2, Pencil } from 'lucide-react';

interface ContentItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'revision';
  revisionCount?: number;
  number: number;
}

interface ContentSectionProps {
  items: ContentItem[];
  type: string;
  onStatusChange: (type: string, itemId: string, newStatus: string) => void;
  onDeleteItem: (type: string, itemId: string) => void;
  onEditItem: (item: ContentItem, type: string) => void;
}

const ContentSection = ({ items, type, onStatusChange, onDeleteItem, onEditItem }: ContentSectionProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'revision':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'revision':
        return <RotateCcw className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  const getCompletionStats = () => {
    const completed = items.filter(item => item.status === 'completed').length;
    const total = items.length;
    return { completed, total };
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No {type} added yet</p>
        <p className="text-white/40 text-sm">Click "Create new" to add {type}</p>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium capitalize">{type} Progress</h3>
          <div className="text-sm text-slate-300">
            <span className="text-green-400">{stats.completed}</span>
            <span className="text-slate-500"> / </span>
            <span>{stats.total}</span>
            <span className="text-slate-500"> completed</span>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all group">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => onEditItem(item, type)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
                    title="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDeleteItem(type, item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Heading */}
              <h3 className="text-white font-medium mb-2 text-sm leading-tight">{item.name}</h3>
              
              {/* Lecture Number */}
              <div className="mb-2">
                <span className="text-xs text-slate-400">
                  {type.slice(0, -1)} no. {item.number}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-sm capitalize ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.revisionCount && (
                  <span className="text-xs text-slate-500">
                    (revision {item.revisionCount}/4)
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {item.status !== 'completed' && (
                  <Button 
                    size="sm"
                    onClick={() => onStatusChange(type, item.id, 'completed')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                )}
                
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(type, item.id, 'revision')}
                  className="flex-1 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Revise
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentSection;
