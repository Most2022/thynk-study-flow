
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Settings } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  date: string;
  sources: number;
}

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);

  const handleCreateBatch = async (name: string) => {
    // Local storage implementation - will be replaced when Supabase is connected
    const newBatch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      sources: 1,
    };
    
    const updatedBatches = [newBatch, ...batches];
    setBatches(updatedBatches);
    localStorage.setItem('batches', JSON.stringify(updatedBatches));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">Thynk Unlimited</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => {
                const name = prompt('Enter batch name:');
                if (name) handleCreateBatch(name);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create new
            </Button>
          </div>
        </div>

        {/* Batches Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Batches</h2>
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/80 mb-2">No Supabase Connection</h2>
          <p className="text-white/60 mb-6">Connect to Supabase to start storing your data</p>
          <Button 
            onClick={() => {
              const name = prompt('Enter batch name:');
              if (name) handleCreateBatch(name);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create demo batch (local only)
          </Button>
        </div>

        {/* Show local batches if any */}
        {batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {batches.map((batch) => (
              <Card key={batch.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">{batch.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <span>{batch.date}</span>
                    <span>{batch.sources} source{batch.sources !== 1 ? 's' : ''}</span>
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Study
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
