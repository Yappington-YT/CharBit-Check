import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  SiYoutube, 
  SiInstagram, 
  SiX, 
  SiTiktok, 
  SiFacebook 
} from "react-icons/si";

interface Artist {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isCreator: boolean;
  verifications?: Array<{
    platform: string;
    isVerified: boolean;
  }>;
}

interface ArtistCardProps {
  artist: Artist;
}

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

export function ArtistCard({ artist }: ArtistCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get follow status
  const { data: followStatus } = useQuery({
    queryKey: [`/api/users/${artist.id}/follow-status`],
    enabled: isAuthenticated && user?.id !== artist.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${artist.id}/follow`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${artist.id}/follow-status`] });
      toast({
        title: data.following ? "Following!" : "Unfollowed",
        description: data.following 
          ? `You are now following @${artist.username || artist.firstName}` 
          : `You unfollowed @${artist.username || artist.firstName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow artists",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate();
  };

  const verifiedPlatforms = artist.verifications?.filter(v => v.isVerified) || [];
  const displayName = artist.username || artist.firstName || "Unknown";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={artist.profileImageUrl} alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/user/${artist.username || artist.id}`}
              className="block hover:text-primary transition-colors"
            >
              <h3 className="font-bold text-lg flex items-center space-x-2 truncate">
                <span>@{displayName}</span>
                {artist.isCreator && (
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {artist.isCreator ? "Verified Creator" : "Character Creator"}
            </p>
            {verifiedPlatforms.length > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                {verifiedPlatforms.slice(0, 4).map((verification) => {
                  const IconComponent = platformIcons[verification.platform as keyof typeof platformIcons];
                  return IconComponent ? (
                    <IconComponent
                      key={verification.platform}
                      className="w-3 h-3 text-muted-foreground"
                    />
                  ) : null;
                })}
                {verifiedPlatforms.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{verifiedPlatforms.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {artist.isCreator 
            ? "Professional character designer and creator with years of experience crafting unique original characters."
            : "Creative character designer sharing original characters with the community."
          }
        </p>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span>0 Characters • 0 Followers</span>
          </div>
          {isAuthenticated && user?.id !== artist.id && (
            <Button
              onClick={handleFollow}
              disabled={followMutation.isPending}
              variant={followStatus?.following ? "secondary" : "default"}
              size="sm"
            >
              {followStatus?.following ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
