import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";
import type { Video } from "@shared/schema";

// Extract YouTube ID from various URL formats or use as-is if it's already an ID
const extractYouTubeId = (input: string): string => {
  // If it's already a clean ID (11 characters, alphanumeric), use it
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no pattern matches, return the input as-is (fallback)
  return input;
};

export default function Videos() {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["/api/videos"],
  }) as { data: Video[] | undefined; isLoading: boolean };

  const openYouTube = (youtubeIdOrUrl: string) => {
    const videoId = extractYouTubeId(youtubeIdOrUrl);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    window.open(youtubeUrl, '_blank');
  };

  const getYouTubeThumbnail = (youtubeIdOrUrl: string) => {
    const videoId = extractYouTubeId(youtubeIdOrUrl);
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">סרטוני הרבנות</h1>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-police-blue mx-auto mb-4"></div>
          <p className="text-gray-600">טוען סרטונים...</p>
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start space-x-reverse space-x-3">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail || getYouTubeThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getYouTubeThumbnail(video.youtubeId);
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-70 rounded-full p-2">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {video.publishedAt && new Date(video.publishedAt).toLocaleDateString('he-IL')}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => openYouTube(video.youtubeId)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <ExternalLink className="h-3 w-3 ml-1" />
                        צפה
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין סרטונים זמינים</h3>
          <p className="text-gray-500">סרטונים יתווספו בקרוב</p>
        </div>
      )}
    </div>
  );
}
