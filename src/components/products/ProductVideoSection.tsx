import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, X, Video, Youtube, Link, Play, FileVideo } from "lucide-react";

interface ProductVideoSectionProps {
  videoFile: string | null;
  youtubeUrl: string;
  onVideoFileChange: (file: string | null) => void;
  onYoutubeUrlChange: (url: string) => void;
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function ProductVideoSection({
  videoFile,
  youtubeUrl,
  onVideoFileChange,
  onYoutubeUrlChange,
}: ProductVideoSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [videoFileName, setVideoFileName] = useState<string>("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  const youtubeId = extractYoutubeId(youtubeUrl);

  const handleVideoUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) return;
      if (file.size > 100 * 1024 * 1024) {
        return; // 100MB limit
      }
      setVideoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        onVideoFileChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onVideoFileChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVideoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleVideoUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-1.5">
        <Video className="h-4 w-4" />
        Product Videos
      </Label>

      {/* Video Upload - Drag & Drop */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Upload Video</p>
        {videoFile ? (
          <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
            <video
              src={videoFile}
              controls
              className="w-full max-h-48 object-contain bg-black"
            />
            <div className="flex items-center justify-between p-2 bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <FileVideo className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {videoFileName || "Uploaded video"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => {
                  onVideoFileChange(null);
                  setVideoFileName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => videoInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border bg-muted/30 hover:border-muted-foreground hover:bg-muted/50"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag & drop video here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse • MP4, WebM, MOV • Max 100MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* YouTube Link */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Youtube className="h-3.5 w-3.5 text-red-500" />
          YouTube Video Link
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={youtubeUrl}
              onChange={(e) => onYoutubeUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              className="pl-9"
            />
          </div>
          {youtubeUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => onYoutubeUrlChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* YouTube Preview */}
        {youtubeId && (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="flex items-center gap-2 p-2 bg-card">
              <Youtube className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                YouTube Video
              </span>
              <Badge variant="outline" className="text-xs ml-auto">
                <Play className="h-3 w-3 mr-1" />
                Preview
              </Badge>
            </div>
          </div>
        )}
        {youtubeUrl && !youtubeId && (
          <p className="text-xs text-destructive">Invalid YouTube URL</p>
        )}
      </div>
    </div>
  );
}
