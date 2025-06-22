import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  Star, 
  Share2, 
  Flag, 
  Edit,
  UserPlus,
  CheckCircle,
  ArrowLeft,
  Eye,
  Calendar
} from "lucide-react";
import { 
  SiYoutube, 
  SiInstagram, 
  SiX, 
  SiTiktok, 
  SiFacebook 
} from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

export default function Character() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: character, isLoading, error } = useQuery({
    queryKey: [`/api/characters/${id}`],
  });

  const { data: status } = useQuery({
    queryKey: [`/api/characters/${id}/status`],
    enabled: isAuthenticated,
  });

  const { data: followStatus } = useQuery({
    queryKey: [`/api/users/${character?.creatorId}/follow-status`],
    enabled: isAuthenticated && character && user?.id !== character.creatorId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/characters/${id}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}`] });
      toast({
        title: data.liked ? "Character liked!" : "Character unliked",
        description: data.liked ? "Added to your liked characters" : "Removed from liked characters",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/characters/${id}/favorite`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}`] });
      toast({
        title: data.favorited ? "Character favorited!" : "Character unfavorited",
        description: data.favorited ? "Added to your favorites" : "Removed from favorites",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${character.creatorId}/follow`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${character.creatorId}/follow-status`] });
      toast({
        title: data.following ? "Following!" : "Unfollowed",
        description: data.following 
          ? `You are now following @${character.creator.username || character.creator.firstName}` 
          : `You unfollowed @${character.creator.username || character.creator.firstName}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Character Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This character doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => setLocation("/")}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const verifiedPlatforms = character.creator.verifications?.filter((v: any) => v.isVerified) || [];
  const isOwner = user?.id === character.creatorId;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: character.name,
          text: `Check out this amazing character: ${character.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Character URL copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Character Image */}
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted">
                {character.avatarUrl ? (
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20">
                    <span className="text-6xl font-bold text-muted-foreground">
                      {character.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Character Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
                    {character.nickname && (
                      <p className="text-xl text-muted-foreground mb-2">
                        "{character.nickname}"
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{character.likesCount} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{character.favoritesCount} favorites</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{character.viewsCount} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {formatDistanceToNow(new Date(character.createdAt))} ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {isAuthenticated && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={status?.liked ? "text-red-500 border-red-500" : ""}
                          onClick={() => likeMutation.mutate()}
                          disabled={likeMutation.isPending}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${status?.liked ? "fill-current" : ""}`} />
                          {status?.liked ? "Liked" : "Like"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={status?.favorited ? "text-yellow-500 border-yellow-500" : ""}
                          onClick={() => favoriteMutation.mutate()}
                          disabled={favoriteMutation.isPending}
                        >
                          <Star className={`w-4 h-4 mr-2 ${status?.favorited ? "fill-current" : ""}`} />
                          {status?.favorited ? "Favorited" : "Favorite"}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {isOwner && (
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {character.tags.map((tag: string) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                      <Badge
                        variant={tag === "OC" ? "default" : "secondary"}
                        className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>

                {/* Personality */}
                {character.personality && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Personality</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {character.personality}
                    </p>
                  </div>
                )}

                {/* About */}
                {character.about && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {character.about}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle>Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={character.creator.profileImageUrl} />
                    <AvatarFallback>
                      {(character.creator.username || character.creator.firstName || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/user/${character.creator.username || character.creator.id}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <div className="font-semibold flex items-center space-x-2 truncate">
                        <span>@{character.creator.username || character.creator.firstName || "unknown"}</span>
                        {character.creator.isCreator && (
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {character.creator.isCreator ? "Verified Creator" : "Character Creator"}
                    </div>
                  </div>
                </div>

                {/* Social Media Verifications */}
                {verifiedPlatforms.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm text-muted-foreground">Verified on:</span>
                    <div className="flex space-x-1">
                      {verifiedPlatforms.map((verification: any) => {
                        const IconComponent = platformIcons[verification.platform as keyof typeof platformIcons];
                        return IconComponent ? (
                          <IconComponent
                            key={verification.platform}
                            className="w-4 h-4 text-muted-foreground"
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Follow Button */}
                {isAuthenticated && !isOwner && (
                  <Button
                    className="w-full"
                    variant={followStatus?.following ? "secondary" : "default"}
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {followStatus?.following ? "Following" : "Follow"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Character Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-semibold">{character.likesCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Favorites</span>
                  <span className="font-semibold">{character.favoritesCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-semibold">{character.viewsCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility</span>
                  <span className="font-semibold capitalize">{character.visibility}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
