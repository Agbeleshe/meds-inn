import type { ComponentType } from "react";
import {
  Apple,
  Baby,
  BookOpen,
  Calendar,
  Droplets,
  Heart,
  Pill,
  ShieldAlert,
} from "lucide-react";

export const CARE_PLAN_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  heart: Heart,
  apple: Apple,
  droplets: Droplets,
  pill: Pill,
  calendar: Calendar,
  "book-open": BookOpen,
  "shield-alert": ShieldAlert,
  baby: Baby,
};

export function carePlanIcon(iconId: string) {
  return CARE_PLAN_ICON_MAP[iconId] ?? Heart;
}
