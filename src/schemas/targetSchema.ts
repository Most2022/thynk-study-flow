
import * as z from "zod";
import { targetCategories } from "@/config/targetConstants";

export const targetFormSchema = z.object({
  name: z.string().min(3, "Target name must be at least 3 characters."),
  category: z.enum(targetCategories),
  deadline: z.date().optional(),
  start_time: z.string().optional(), // Expects "HH:MM"
  end_time: z.string().optional(),   // Expects "HH:MM"
});

export type TargetFormValues = z.infer<typeof targetFormSchema>;

