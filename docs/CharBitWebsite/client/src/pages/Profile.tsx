import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CharacterCard } from "@/components/CharacterCard";
import { 
  Settings, 
  UserPlus, 
  MessageCircle, 
  Shield,
  CheckCircle,
  Calendar,
  Heart,
  Star,
  Users,
  PlusCircle,
  Edit
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

interface ProfileProps {
  activeTab?: "characters" | "favorites" | "following" | "friends" | "messages" | "settings";
  username?: string;
}

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

export default function Profile({ activeTab = "characters", username: propUsername }: ProfileProps) {
  const { username: paramUsername } = useParams();
  const username = propUsername || paramUsername;
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(activeTab);

  // Determine if viewing own profile or another user's
  const isOwnProfile = !username || username === currentUser?.username || username === currentUser?.id;
  const profileUserId = isOwnProfile ? currentUser?.id : username;

  // Fetch profile data
  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: username ? [`/api/users/${username}`] : ["/api/auth/user"],
    enabled: !!profileUserId,
  });

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/characters`],
    enabled: !!profileUserId,
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/users/me/favorites"],
    enabled: isOwnProfile && selectedTab === "favorites",
  });

  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ["/api/users/me/following"],
    enabled: isOwnProfile && selectedTab === "following",
  });

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["/api/users/me/friends"],
    enabled: isOwnProfile && selectedTab === "friends",
  });

  const { data: friendRequests, isLoading: friendRequestsLoading } = useQuery({
    queryKey: ["/api/users/me/friend-requests"],
    enabled: isOwnProfile && selectedTab === "friends",
  });

  const { data: followStatus } = useQuery({
    queryKey: [`/api/users/${profileUserId}/follow-status`],
    enabled: !isOwnProfile && isAuthenticated,
  });

  // Mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${profileUserId}/follow`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUserId}/follow-status`] });
      toast({
        title: data.following ? "Following!" : "Unfollowed",
        description: data.following 
          ? `You are now following @${profileUser?.username || profileUser?.firstName}` 
          : `You unfollowed @${profileUser?.username || profileUser?.firstName}`,
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

  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${profileUserId}/friend-request`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: `Friend request sent to @${profileUser?.username || profileUser?.firstName}`,
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

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      await apiRequest("POST", `/api/friend-requests/${requesterId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/friends"] });
      toast({
        title: "Friend request accepted!",
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

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-6 mb-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This user doesn't exist or you don't have permission to view their profile.
              </p>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const verifiedPlatforms = profileUser.verifications?.filter((v: any) => v.isVerified) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6 mb-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profileUser.profileImageUrl} />
              <AvatarFallback className="text-2xl">
                {(profileUser.username || profileUser.firstName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    @{profileUser.username || profileUser.firstName || "Unknown"}
                  </h1>
                  {profileUser.isCreator && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <p className="text-muted-foreground">
                  {profileUser.isCreator ? "Verified Creator" : "Character Creator"}
                  {profileUser.firstName && profileUser.lastName && (
                    <span> • {profileUser.firstName} {profileUser.lastName}</span>
                  )}
                </p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Joined {formatDistanceToNow(new Date(profileUser.createdAt))} ago</span>
                </div>
              </div>

              {/* Social Media Verifications */}
              {verifiedPlatforms.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Verified on:</span>
                  <div className="flex space-x-2">
                    {verifiedPlatforms.map((verification: any) => {
                      const IconComponent = platformIcons[verification.platform as keyof typeof platformIcons];
                      return IconComponent ? (
                        <IconComponent
                          key={verification.platform}
                          className="w-5 h-5 text-muted-foreground"
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex space-x-6 text-sm">
                <div>
                  <span className="font-semibold">{characters?.length || 0}</span>
                  <span className="text-muted-foreground ml-1">Characters</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">0</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && isAuthenticated && (
                <div className="flex space-x-3">
                  <Button
                    variant={followStatus?.following ? "secondary" : "default"}
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {followStatus?.following ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendFriendRequestMutation.mutate()}
                    disabled={sendFriendRequestMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <div className="flex space-x-3">
                  <Link href="/create">
                    <Button>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Character
                    </Button>
                  </Link>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="characters">Characters</TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                  <TabsTrigger value="friends">Friends</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Characters Tab */}
            <TabsContent value="characters" className="mt-6">
              {charactersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
              ) : characters && characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {characters.map((character: any) => (
                    <CharacterCard
                      key={character.id}
                      character={{ ...character, creator: profileUser }}
                      showCreator={false}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile 
                        ? "Start creating your first original character!"
                        : "This user hasn't created any characters yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <Link href="/create">
                        <Button>Create Your First Character</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            {isOwnProfile && (
              <TabsContent value="favorites" className="mt-6">
                {favoritesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-80" />
                    ))}
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((character: any) => (
                      <CharacterCard key={character.id} character={character} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Characters you favorite will appear here.
                      </p>
                      <Link href="/">
                        <Button variant="outline">Explore Characters</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* Friends Tab */}
            {isOwnProfile && (
              <TabsContent value="friends" className="mt-6">
                <div className="space-y-6">
                  {/* Friend Requests */}
                  {friendRequests && friendRequests.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Friend Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {friendRequests.map((request: any) => (
                          <div key={request.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={request.requester.profileImageUrl} />
                                <AvatarFallback>
                                  {(request.requester.username || request.requester.firstName || "U").charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">
                                  @{request.requester.username || request.requester.firstName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Sent {formatDistanceToNow(new Date(request.createdAt))} ago
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => acceptFriendRequestMutation.mutate(request.requesterId)}
                                disabled={acceptFriendRequestMutation.isPending}
                              >
                                Accept
                              </Button>
                              <Button variant="outline" size="sm">
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Friends List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Friends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {friendsLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : friends && friends.length > 0 ? (
                        <div className="space-y-4">
                          {friends.map((friend: any) => (
                            <div key={friend.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={friend.profileImageUrl} />
                                  <AvatarFallback>
                                    {(friend.username || friend.firstName || "U").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/user/${friend.username || friend.id}`}>
                                    <p className="font-semibold hover:text-primary transition-colors">
                                      @{friend.username || friend.firstName}
                                    </p>
                                  </Link>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
                          <p className="text-muted-foreground">
                            Connect with other creators to build your network!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Settings Tab */}
            {isOwnProfile && (
              <TabsContent value="settings" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileUser.username || ""}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          className="min-h-24"
                        />
                      </div>
                      <Button>Save Changes</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Profile Visibility</p>
                          <p className="text-sm text-muted-foreground">
                            Control who can see your profile
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Shield className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Creator Application</p>
                          <p className="text-sm text-muted-foreground">
                            Apply to become a verified creator
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
