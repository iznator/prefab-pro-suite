import { useMemo, useState } from "react";
import { Image, FileText, Link as LinkIcon, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatMediaPanelProps {
  messages: ChatMessage[];
  onClose: () => void;
}

export function ChatMediaPanel({ messages, onClose }: ChatMediaPanelProps) {
  const images = useMemo(() => messages.filter(m => m.type === "image"), [messages]);
  const files = useMemo(() => messages.filter(m => m.type === "file"), [messages]);
  const links = useMemo(() => {
    const linkMsgs = messages.filter(m => m.type === "link");
    // Also extract URLs from text messages
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    messages.filter(m => m.type === "text").forEach(m => {
      const matches = m.content.match(urlRegex);
      if (matches) {
        matches.forEach(url => {
          linkMsgs.push({ ...m, content: url, type: "link" });
        });
      }
    });
    return linkMsgs;
  }, [messages]);

  return (
    <div className="w-72 border-l bg-card flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Médias</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <Tabs defaultValue="images" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger value="images" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs py-2">
            <Image className="w-3.5 h-3.5 mr-1" /> Photos ({images.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs py-2">
            <FileText className="w-3.5 h-3.5 mr-1" /> Fichiers ({files.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs py-2">
            <LinkIcon className="w-3.5 h-3.5 mr-1" /> Liens ({links.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="images" className="p-2 m-0">
            {images.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Aucune photo</p>}
            <div className="grid grid-cols-3 gap-1">
              {images.map(img => (
                <a key={img.id} href={img.file_url || "#"} target="_blank" rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img.file_url || ""} alt={img.file_name || ""} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-2 m-0 space-y-1">
            {files.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Aucun fichier</p>}
            {files.map(f => (
              <a key={f.id} href={f.file_url || "#"} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{f.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </a>
            ))}
          </TabsContent>

          <TabsContent value="links" className="p-2 m-0 space-y-1">
            {links.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Aucun lien</p>}
            {links.map((l, i) => (
              <a key={`${l.id}-${i}`} href={l.content} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary truncate">{l.content}</p>
              </a>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
