
import { Card } from '@/components/ui/card';
import { Book, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subject {
  name: string;
  icon: string;
  chapters: number;
  color: string;
}

interface SubjectCardProps {
  subject: Subject;
  onSelect: () => void;
  onRemove: () => void;
}

const SubjectCard = ({ subject, onSelect, onRemove }: SubjectCardProps) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <Card 
      onClick={onSelect}
      className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-all duration-300 group relative"
    >
      <Button
        onClick={handleRemove}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10 z-10"
      >
        <X className="w-4 h-4" />
      </Button>
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${subject.color} rounded-lg flex items-center justify-center text-2xl`}>
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
              {subject.name}
            </h3>
            {subject.chapters > 0 && (
              <p className="text-slate-400 text-sm">
                {subject.chapters} Chapters
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SubjectCard;
