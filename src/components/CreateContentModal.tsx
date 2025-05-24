
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateContent: (type: string, count: number, namePrefix: string) => void;
  activeTab: string;
}

const CreateContentModal = ({ isOpen, onClose, onCreateContent, activeTab }: CreateContentModalProps) => {
  const [count, setCount] = useState('');
  const [namePrefix, setNamePrefix] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(count);
    if (countNum > 0 && namePrefix.trim()) {
      onCreateContent(activeTab, countNum, namePrefix.trim());
      setCount('');
      setNamePrefix('');
    }
  };

  const handleClose = () => {
    setCount('');
    setNamePrefix('');
    onClose();
  };

  const getDefaultPrefix = () => {
    switch (activeTab) {
      case 'lectures':
        return 'Basic math lecture';
      case 'notes':
        return 'Notes';
      case 'dpps':
        return 'DPP';
      case 'homework':
        return 'Homework';
      default:
        return 'Item';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="count" className="text-sm font-medium">
              Number of {activeTab}
            </Label>
            <Input
              id="count"
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g., 20"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              min="1"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="namePrefix" className="text-sm font-medium">
              Name prefix
            </Label>
            <Input
              id="namePrefix"
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
              placeholder={getDefaultPrefix()}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!count || !namePrefix.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create {activeTab}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal;
