
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, BookOpen } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

interface BatchCardProps {
  batch: Batch;
  onStudy: () => void;
}

const BatchCard = ({ batch, onStudy }: BatchCardProps) => {
  return (
    <div className="group">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>
          
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
            {batch.name}
          </h3>
          
          <p className="text-slate-400 text-sm mb-6">
            {batch.date} • {batch.sources} source{batch.sources !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="p-6 pt-0">
          <Button 
            onClick={onStudy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            Study
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BatchCard;
