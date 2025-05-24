
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBatch: (name: string) => void;
}

const CreateBatchModal = ({ isOpen, onClose, onCreateBatch }: CreateBatchModalProps) => {
  const [batchName, setBatchName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchName.trim()) {
      onCreateBatch(batchName.trim());
      setBatchName('');
    }
  };

  const handleClose = () => {
    setBatchName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Batch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="batchName" className="text-sm font-medium">
              Batch Name
            </Label>
            <Input
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Aakash Chemistry Modules 1 & 2"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              autoFocus
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
              disabled={!batchName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBatchModal;
