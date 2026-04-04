import { Mail, Phone, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface QuickActionsProps {
  phone: string;
  email: string;
  name: string;
}

export function QuickActions({ phone, email, name }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-md hover:bg-tag-won/10 flex items-center justify-center transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-tag-won" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Appeler {name}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`mailto:${email}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-md hover:bg-primary/10 flex items-center justify-center transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-primary" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Email</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`sms:${phone.replace(/\s/g, '')}`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-md hover:bg-tag-contacted/10 flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-tag-contacted" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">SMS</TooltipContent>
      </Tooltip>
    </div>
  );
}
