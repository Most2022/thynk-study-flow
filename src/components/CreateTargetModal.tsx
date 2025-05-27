import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

const targetCategories = [
  "preprimary",
  "primary",
  "secondary",
  "higher_secondary",
] as const;

const targetFormSchema = z.object({
  name: z.string().min(3, "Target name must be at least 3 characters."),
  category: z.enum(targetCategories),
  deadline: z.date().optional(),
  start_time: z.string().optional(), // Expects "HH:MM"
  end_time: z.string().optional(),   // Expects "HH:MM"
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

interface CreateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string | null;
  onTargetCreated: () => void; // Callback to refresh targets list
}

const CreateTargetModal = ({
  isOpen,
  onClose,
  chapterId,
  onTargetCreated,
}: CreateTargetModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      name: "",
      category: "primary",
      start_time: "",
      end_time: "",
    },
  });

  const onSubmit = async (values: TargetFormValues) => {
    if (!user || !chapterId) {
      toast.error("User or chapter information is missing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("targets").insert({
        name: values.name,
        category: values.category,
        deadline: values.deadline ? values.deadline.toISOString() : null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        chapter_id: chapterId,
        user_id: user.id,
        progress: 0, // Default progress
      });

      if (error) {
        throw error;
      }
      toast.success("Target created successfully!");
      onTargetCreated();
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to create target: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Create New Target</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new target for this chapter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="name" className="text-slate-300">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="e.g., Complete Topic X"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category" className="text-slate-300">Category</Label>
            <Select
              onValueChange={(value) => form.setValue("category", value as typeof targetCategories[number])}
              defaultValue={form.getValues("category")}
            >
              <SelectTrigger className="w-full mt-1 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {targetCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="hover:bg-slate-600">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="deadline" className="text-slate-300">Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1 bg-slate-700 border-slate-600 hover:bg-slate-600 text-white",
                    !form.watch("deadline") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("deadline") ? format(form.watch("deadline")!, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
                <Calendar
                  mode="single"
                  selected={form.watch("deadline")}
                  onSelect={(date) => form.setValue("deadline", date)}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time" className="text-slate-300">Start Time (Optional)</Label>
              <Input
                id="start_time"
                type="time"
                {...form.register("start_time")}
                className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-slate-300">End Time (Optional)</Label>
              <Input
                id="end_time"
                type="time"
                {...form.register("end_time")}
                className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="text-white border-slate-600 hover:bg-slate-700">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Target
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTargetModal;
