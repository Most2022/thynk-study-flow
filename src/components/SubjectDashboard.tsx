
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import SubjectCard from '@/components/SubjectCard';
import { useState, useEffect } from 'react';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

interface SubjectDashboardProps {
  batch: Batch;
  onBack: () => void;
  onSelectSubject: (subject: string) => void;
}

interface Subject {
  name: string;
  icon: string;
  chapters: number;
  color: string;
}

const defaultSubjects: Subject[] = [
  { name: 'Physics', icon: '🧪', chapters: 0, color: 'from-blue-400 to-purple-500' },
  { name: 'Chemistry', icon: '⚗️', chapters: 0, color: 'from-green-400 to-blue-500' },
  { name: 'Maths', icon: '🔢', chapters: 0, color: 'from-orange-400 to-red-500' },
  { name: 'Biology', icon: '🧬', chapters: 0, color: 'from-purple-400 to-pink-500' },
];

const SubjectDashboard = ({ batch, onBack, onSelectSubject }: SubjectDashboardProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const savedSubjects = localStorage.getItem(`thynk-subjects-${batch.id}`);
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    } else {
      setSubjects(defaultSubjects);
      localStorage.setItem(`thynk-subjects-${batch.id}`, JSON.stringify(defaultSubjects));
    }
  }, [batch.id]);

  const handleRemoveSubject = (subjectName: string) => {
    const updatedSubjects = subjects.filter(subject => subject.name !== subjectName);
    setSubjects(updatedSubjects);
    localStorage.setItem(`thynk-subjects-${batch.id}`, JSON.stringify(updatedSubjects));
    
    // Also remove any chapters data for this subject
    localStorage.removeItem(`thynk-chapters-${batch.id}-${subjectName}`);
  };

  const updateSubjectChapterCount = (subjectName: string) => {
    const chaptersKey = `thynk-chapters-${batch.id}-${subjectName}`;
    const savedChapters = localStorage.getItem(chaptersKey);
    const chapterCount = savedChapters ? JSON.parse(savedChapters).length : 0;
    
    const updatedSubjects = subjects.map(subject => 
      subject.name === subjectName 
        ? { ...subject, chapters: chapterCount }
        : subject
    );
    
    setSubjects(updatedSubjects);
    localStorage.setItem(`thynk-subjects-${batch.id}`, JSON.stringify(updatedSubjects));
  };

  useEffect(() => {
    // Update chapter counts for all subjects
    subjects.forEach(subject => {
      const chaptersKey = `thynk-chapters-${batch.id}-${subject.name}`;
      const savedChapters = localStorage.getItem(chaptersKey);
      const chapterCount = savedChapters ? JSON.parse(savedChapters).length : 0;
      
      if (subject.chapters !== chapterCount) {
        updateSubjectChapterCount(subject.name);
      }
    });
  }, [batch.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Subjects</h1>
              <p className="text-slate-400">Select your subjects & start learning</p>
            </div>
          </div>
          
          <Button 
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new
          </Button>
        </div>

        {/* Subjects Grid */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <SubjectCard 
                key={subject.name}
                subject={subject}
                onSelect={() => onSelectSubject(subject.name)}
                onRemove={() => handleRemoveSubject(subject.name)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubjectDashboard;
