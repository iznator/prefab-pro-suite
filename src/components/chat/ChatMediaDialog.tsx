import { useMemo, useState } from "react";
import { Image as ImageIcon, FileText, Link as LinkIcon, Mic, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageLightbox, type LightboxImage } from "./ImageLightbox";
import type { ChatMessage } from "@/hooks/useChat";

interface ChatMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
}

export function ChatMediaDialog({ open, onOpenChange, messages }: ChatMediaDialogProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = useMemo(() => messages.filter(m => m.type === "image" && m.file_url), [messages]);
  const files = useMemo(
    () => messages.filter(m => m.type === "file" && !m.file_type?.startsWith("audio/")),
    [messages]
  );
  const voices = useMemo(
    () => messages.filter(m => m.type === "file" && m.file_type?.startsWith("audio/")),
    [messages]
  );
  const links = useMemo(() => {
    const out: ChatMessage[] = messages.filter(m => m.type === "link");
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    messages.filter(m => m.type === "text").forEach(m => {
      const matches = m.content?.match(urlRegex);
      if (matches) {
        matches.forEach(url => out.push({ ...m, content: url, type: "link" }));
      }
    });
    return out;
  }, [messages]);

  const lightboxImages: LightboxImage[] = images.map(m => ({
    url: m.file_url || "",
    name: m.file_name || undefined,
    author: m.profile?.display_name || "Utilisateur",
    date: new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle className="text-base">Médias partagés</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="images" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0 px-3">
              <TabsTrigger value="images" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 shadow-none">
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Photos ({images.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 shadow-none">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Fichiers ({files.length})
              </TabsTrigger>
              <TabsTrigger value="voices" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 shadow-none">
                <Mic className="w-3.5 h-3.5 mr-1.5" /> Vocaux ({voices.length})
              </TabsTrigger>
              <TabsTrigger value="links" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-2.5 shadow-none">
                <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Liens ({links.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-3 m-0">
                {images.length === 0 && <p className="text-xs text-muted-foreground text-center py-12">Aucune photo</p>}
                <div className="grid grid-cols-4 gap-1.5">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-square rounded-lg overflow-hidden bg-muted group relative"
                    >
                      <img
                        src={img.file_url || ""}
                        alt={img.file_name || ""}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-3 m-0 space-y-1">
                {files.length === 0 && <p className="text-xs text-muted-foreground text-center py-12">Aucun fichier</p>}
                {files.map(f => (
                  <a key={f.id} href={f.file_url || "#"} download={f.file_name || undefined} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{f.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.profile?.display_name} · {new Date(f.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </a>
                ))}
              </TabsContent>

              <TabsContent value="voices" className="p-3 m-0 space-y-1">
                {voices.length === 0 && <p className="text-xs text-muted-foreground text-center py-12">Aucun message vocal</p>}
                {voices.map(v => (
                  <a key={v.id} href={v.file_url || "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">Message vocal</p>
                      <p className="text-[10px] text-muted-foreground">
                        {v.profile?.display_name} · {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </a>
                ))}
              </TabsContent>

              <TabsContent value="links" className="p-3 m-0 space-y-1">
                {links.length === 0 && <p className="text-xs text-muted-foreground text-center py-12">Aucun lien</p>}
                {links.map((l, i) => (
                  <a key={`${l.id}-${i}`} href={l.content || "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-primary truncate flex-1">{l.content}</p>
                  </a>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ImageLightbox
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
      />
    </>
  );
}
