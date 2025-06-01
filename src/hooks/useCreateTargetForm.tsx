
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { targetFormSchema, TargetFormValues } from '@/schemas/targetSchema';

interface UseCreateTargetFormProps {
  chapterId: string | null;
  onTargetCreated: () => void;
  onCloseModal: () => void;
}

export const useCreateTargetForm = ({
  chapterId,
  onTargetCreated,
  onCloseModal,
}: UseCreateTargetFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      name: '',
      category: 'primary',
      deadline: undefined,
      start_time: '',
      end_time: '',
    },
  });

  const onSubmit = async (values: TargetFormValues) => {
    if (!user || !chapterId) {
      toast.error('User must be logged in and chapter must be selected');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('targets')
        .insert({
          name: values.name,
          category: values.category,
          chapter_id: chapterId,
          user_id: user.id,
          deadline: values.deadline?.toISOString().split('T')[0] || null,
          start_time: values.start_time || null,
          end_time: values.end_time || null,
        });

      if (error) {
        toast.error(`Failed to create target: ${error.message}`);
      } else {
        toast.success('Target created successfully!');
        onTargetCreated();
        onCloseModal();
        form.reset();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
  };
};
