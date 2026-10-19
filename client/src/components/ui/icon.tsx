import {
  ClipboardList,
  Code,
  Hammer,
  Layers,
  MessagesSquare,
  MonitorSmartphone,
  PenTool,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/types/type";
import { cn } from "@/lib/utils";

/**
 * Content modules store icon *names* as plain strings, so content stays free of
 * React imports and can move to the database later. This map is the only place
 * where a name becomes a component.
 */
const ICONS: Record<IconName, LucideIcon> = {
  code: Code,
  workflow: Workflow,
  sparkles: Sparkles,
  search: Search,
  planning: ClipboardList,
  design: PenTool,
  build: Hammer,
  quality: ShieldCheck,
  launch: Rocket,
  target: Target,
  layers: Layers,
  communication: MessagesSquare,
  responsive: MonitorSmartphone,
  maintenance: Wrench,
  automation: Workflow,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Component = ICONS[name];

  return (
    <Component aria-hidden="true" strokeWidth={1.6} className={cn(className)} />
  );
}
