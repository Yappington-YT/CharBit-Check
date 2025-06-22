import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, CheckCircle } from "lucide-react";
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

interface Character {
  id: number;
  name: string;
  nickname?: string;
  about?: string;
  avatarUrl?: string;
  tags: string[];
  likesCount: number;
  favoritesCount: number;
  creator: {
    id: string;
    username?: string;
    firstName?: string;
    profileImageUrl?: string;
    isCreator: boolean;
    verifications?: Array<{
      platform: string;
      isVerified: boolean;
    }>;
  };
}

interface CharacterCardProps {
  character: Character;
  showCreator?: boolean;
}

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

export function CharacterCard({ character, showCreator = true }: CharacterCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get character interaction status
  const { data: status } = useQuery({
    queryKey: [`/api/characters/${character.id}/status`],
    enabled: isAuthenticated,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/characters/${character.id}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}/status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: data.liked ? "Character liked!" : "Character unliked",
        description: data.liked ? "Added to your liked characters" : "Removed from liked characters",
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

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/characters/${character.id}/favorite`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}/status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: data.favorited ? "Character favorited!" : "Character unfavorited",
        description: data.favorited ? "Added to your favorites" : "Removed from favorites",
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

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to like characters",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to favorite characters",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate();
  };

  const verifiedPlatforms = character.creator.verifications?.filter(v => v.isVerified) || [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/character/${character.id}`}>
        <div className="aspect-[4/3] bg-muted">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20">
              <span className="text-4xl font-bold text-muted-foreground">
                {character.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/character/${character.id}`} className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors truncate">
              {character.name}
            </h3>
            {character.nickname && (
              <p className="text-sm text-muted-foreground truncate">
                "{character.nickname}"
              </p>
            )}
          </Link>
          <div className="flex items-center space-x-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 ${status?.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
              onClick={handleLike}
              disabled={likeMutation.isPending}
            >
              <Heart className={`w-4 h-4 ${status?.liked ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-8 w-8 ${status?.favorited ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
              onClick={handleFavorite}
              disabled={favoriteMutation.isPending}
            >
              <Star className={`w-4 h-4 ${status?.favorited ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {character.about && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {character.about}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {character.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant={tag === "OC" ? "default" : "secondary"}
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
          {character.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{character.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{character.likesCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>{character.favoritesCount}</span>
            </span>
          </div>
        </div>

        {showCreator && (
          <>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarImage src={character.creator.profileImageUrl} />
                  <AvatarFallback className="text-xs">
                    {(character.creator.username || character.creator.firstName || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/user/${character.creator.username || character.creator.id}`}
                  className="hover:text-foreground transition-colors truncate"
                >
                  by @{character.creator.username || character.creator.firstName || "unknown"}
                </Link>
                <div className="flex items-center ml-1 space-x-1">
                  {verifiedPlatforms.slice(0, 2).map((verification) => {
                    const IconComponent = platformIcons[verification.platform as keyof typeof platformIcons];
                    return IconComponent ? (
                      <IconComponent
                        key={verification.platform}
                        className="w-3 h-3"
                      />
                    ) : null;
                  })}
                  {character.creator.isCreator && (
                    <CheckCircle className="w-3 h-3 text-primary" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
