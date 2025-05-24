
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChapter: (chapterName: string) => void;
}

const CreateChapterModal = ({ isOpen, onClose, onCreateChapter }: CreateChapterModalProps) => {
  const [chapterName, setChapterName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chapterName.trim()) {
      onCreateChapter(chapterName.trim());
      setChapterName('');
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-slate-900 border-slate-700 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Create New Chapter</SheetTitle>
          <SheetDescription className="text-slate-400">
            Add a new chapter to organize your study content
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="chapterName" className="text-white">
              Chapter Name
            </Label>
            <Input
              id="chapterName"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="e.g., Ch 01: Basic Mathematics"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={!chapterName.trim()}
            >
              Create Chapter
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateChapterModal;
