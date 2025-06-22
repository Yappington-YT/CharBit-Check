import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, User, Star, Users, Zap, Shield, Crown } from "lucide-react";
import { SiYoutube, SiInstagram, SiX, SiTiktok, SiFacebook } from "react-icons/si";

export default function CreatorApplication() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: creatorStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["/api/creator/status"],
    enabled: isAuthenticated,
  });

  const [applicationType, setApplicationType] = useState<"youtube" | "email">("youtube");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [displayName, setDisplayName] = useState("");

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/creator/apply", {
        applicationType,
        youtubeHandle: applicationType === "youtube" ? youtubeHandle : undefined,
        displayName: displayName || undefined,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your creator application has been submitted successfully. We'll review it soon!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/status"] });
    },
    onError: (error) => {
      console.error("Creator application error:", error);
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
        title: "Application Failed",
        description: error.message || "Failed to submit creator application. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Creator
        </Badge>
      );
    }

    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="w-4 h-4 mr-1" />
            Regular User
          </Badge>
        );
    }
  };

  const canApply = creatorStatus?.status === "none" || creatorStatus?.status === "rejected";
  const isPending = creatorStatus?.status === "pending";
  const isCreator = creatorStatus?.isCreator;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Creator Application</h1>
        <p className="text-muted-foreground">
          Apply to become a verified creator on CharBit and get access to enhanced features.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Application Status
              {creatorStatus && getStatusBadge(creatorStatus.status, creatorStatus.isCreator)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCreator ? (
              <p className="text-green-600">
                Congratulations! You are now a verified creator on CharBit.
              </p>
            ) : isPending ? (
              <p className="text-blue-600">
                Your creator application is currently under review. We'll notify you once it's processed.
              </p>
            ) : creatorStatus?.status === "rejected" ? (
              <p className="text-red-600">
                Your previous application was rejected. You can submit a new application anytime.
              </p>
            ) : (
              <p className="text-muted-foreground">
                You haven't applied for creator status yet. Submit an application to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Creator Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>Creator Benefits</CardTitle>
            <CardDescription>
              What you get as a verified creator on CharBit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Verified creator badge on your profile and characters</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Social media verification system (YouTube, Instagram, X, TikTok, Facebook)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Featured creator opportunities</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Priority support and feedback</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Advanced character creation tools</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Application Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle>Application Requirements</CardTitle>
            <CardDescription>
              What we look for in creator applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span>Active participation in the CharBit community</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span>Quality character creations and profiles</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span>Respect for community guidelines and other users</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span>Commitment to creating original, high-quality content</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Application Form */}
        {canApply && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Creator Application</CardTitle>
              <CardDescription>
                Choose how you want to apply for creator status. Your username will be updated to match your choice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Application Type Selection */}
              <div className="space-y-3">
                <Label>Application Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={applicationType === "youtube" ? "default" : "outline"}
                    onClick={() => setApplicationType("youtube")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <SiYoutube className="w-6 h-6" />
                    <span>YouTube Creator</span>
                  </Button>
                  <Button
                    variant={applicationType === "email" ? "default" : "outline"}
                    onClick={() => setApplicationType("email")}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <User className="w-6 h-6" />
                    <span>Email Based</span>
                  </Button>
                </div>
              </div>

              {/* YouTube Handle Input */}
              {applicationType === "youtube" && (
                <div className="space-y-2">
                  <Label htmlFor="youtube-handle">YouTube Handle</Label>
                  <Input
                    id="youtube-handle"
                    placeholder="@yourchannelname"
                    value={youtubeHandle}
                    onChange={(e) => setYoutubeHandle(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your username will become your YouTube handle and your creator name will be your channel name.
                  </p>
                </div>
              )}

              {/* Email Application Info */}
              {applicationType === "email" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your username will become your email address and your creator name will be based on your email.
                  </p>
                </div>
              )}

              {/* Display Name Input */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name (Optional)</Label>
                <Input
                  id="display-name"
                  placeholder="How you want to be displayed to users"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  You can customize how your name appears to other users while keeping your username for login.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending || (applicationType === "youtube" && !youtubeHandle.trim())}
                size="lg"
                className="w-full"
              >
                {applyMutation.isPending ? "Submitting..." : "Apply for Creator Status"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}