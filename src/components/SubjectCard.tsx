
import { Card } from '@/components/ui/card';
import { Book } from 'lucide-react';

interface Subject {
  name: string;
  icon: string;
  chapters: number;
  color: string;
}

interface SubjectCardProps {
  subject: Subject;
  onSelect: () => void;
}

const SubjectCard = ({ subject, onSelect }: SubjectCardProps) => {
  return (
    <Card 
      onClick={onSelect}
      className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-all duration-300 group"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${subject.color} rounded-lg flex items-center justify-center text-2xl`}>
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
              {subject.name}
            </h3>
            <p className="text-slate-400 text-sm">
              {subject.chapters} Chapters
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SubjectCard;
