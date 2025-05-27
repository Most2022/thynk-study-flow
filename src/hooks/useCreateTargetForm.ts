
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { TargetFormValues, targetFormSchema } from "@/schemas/targetSchema";

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
      name: "",
      category: "primary",
      start_time: "",
      end_time: "",
      deadline: undefined,
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
      onCloseModal();
    } catch (error: any) {
      toast.error(`Failed to create target: ${error.message}`);
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

