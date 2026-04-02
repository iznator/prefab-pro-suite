import { cn } from "@/lib/utils";

export function LeadScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-tag-won/15 text-tag-won";
    if (score >= 50) return "bg-tag-contacted/15 text-tag-contacted";
    return "bg-tag-lost/15 text-tag-lost";
  };

  return (
    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold", getColor())}>
      {score}
    </span>
  );
}
