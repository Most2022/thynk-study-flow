
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, RotateCcw, Play, MoreVertical } from 'lucide-react';

interface ContentItem {
  id: string;
  name: string;
  status: 'completed' | 'incomplete' | 'revision';
  revisionCount?: number;
}

interface ContentSectionProps {
  items: ContentItem[];
  type: string;
  onStatusChange: (type: string, itemId: string, newStatus: string) => void;
}

const ContentSection = ({ items, type, onStatusChange }: ContentSectionProps) => {
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

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No {type} added yet</p>
        <p className="text-white/40 text-sm">Click "Create new" to add {type}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <h3 className="text-white font-medium mb-2">{item.name}</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-sm ${getStatusColor(item.status)}`}>
                status - {item.status}
              </span>
              {item.revisionCount && (
                <span className="text-xs text-slate-500">
                  (revision {item.revisionCount}/4)
                </span>
              )}
            </div>

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
  );
};

export default ContentSection;
