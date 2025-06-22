import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCharacterSchema, updateCharacterSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's social media verifications
      const verifications = await storage.getUserVerifications(userId);
      
      res.json({ ...user, verifications });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Creator application endpoints
  app.post('/api/creator/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { applicationType, youtubeHandle, displayName } = req.body;
      console.log("Applying for creator:", userId, { applicationType, youtubeHandle, displayName });
      
      // Check if user already has pending or approved status
      const user = await storage.getUser(userId);
      if (user?.creatorApplicationStatus === "pending") {
        return res.status(400).json({ message: "Application already pending" });
      }
      if (user?.isCreator) {
        return res.status(400).json({ message: "Already a creator" });
      }

      // Validate YouTube handle if required
      if (applicationType === "youtube" && !youtubeHandle?.trim()) {
        return res.status(400).json({ message: "YouTube handle is required for YouTube applications" });
      }
      
      await storage.applyForCreator(userId, applicationType, youtubeHandle, displayName);
      res.json({ success: true, message: "Creator application submitted successfully" });
    } catch (error) {
      console.error("Error applying for creator:", error);
      res.status(500).json({ message: "Failed to submit creator application" });
    }
  });

  app.get('/api/creator/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json({ 
        status: user?.creatorApplicationStatus || "none",
        isCreator: user?.isCreator || false 
      });
    } catch (error) {
      console.error("Error fetching creator status:", error);
      res.status(500).json({ message: "Failed to fetch creator status" });
    }
  });

  // User settings endpoints
  app.patch('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { theme } = req.body;
      
      if (!theme || !['black', 'white', 'midnight', 'neon', 'pinky', 'bob'].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme" });
      }
      
      await storage.updateUserTheme(userId, theme);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  app.patch('/api/user/profile-visibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { visibility } = req.body;
      
      if (!["public", "private", "restricted"].includes(visibility)) {
        return res.status(400).json({ message: "Invalid visibility setting" });
      }
      
      await storage.updateUserProfileVisibility(userId, visibility);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      res.status(500).json({ message: "Failed to update profile visibility" });
    }
  });

  // Character routes
  app.post('/api/characters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const characterData = insertCharacterSchema.parse(req.body);
      
      const character = await storage.createCharacter({
        ...characterData,
        creatorId: userId,
      });
      
      res.json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(500).json({ message: "Failed to create character" });
    }
  });

  app.get('/api/characters/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      const character = await storage.getCharacterWithCreator(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Add recently viewed if user is authenticated
      if (req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
        if (userId && userId !== character.creatorId) {
          await storage.addRecentlyViewed(userId, id);
        }
      }
      
      res.json(character);
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  app.patch('/api/characters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      const updates = updateCharacterSchema.parse(req.body);
      
      // Verify ownership
      const character = await storage.getCharacter(id);
      if (!character || character.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedCharacter = await storage.updateCharacter(id, updates);
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ message: "Failed to update character" });
    }
  });

  app.delete('/api/characters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      
      await storage.deleteCharacter(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting character:", error);
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  // Character discovery routes
  app.get('/api/characters', async (req, res) => {
    try {
      const { type = 'public', limit = 20, tags, query } = req.query;
      const parsedLimit = Math.min(parseInt(limit as string) || 20, 100);
      
      let characters;
      
      if (query) {
        characters = await storage.searchCharacters(query as string, parsedLimit);
      } else if (tags) {
        const tagArray = (tags as string).split(',').map(t => t.trim());
        characters = await storage.getCharactersByTags(tagArray, parsedLimit);
      } else if (type === 'featured') {
        characters = await storage.getFeaturedCharacters(parsedLimit);
      } else {
        characters = await storage.getPublicCharacters(parsedLimit);
      }
      
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.get('/api/characters/following/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      
      const characters = await storage.getFollowingCharacters(userId, limit);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching following feed:", error);
      res.status(500).json({ message: "Failed to fetch following feed" });
    }
  });

  app.get('/api/characters/recently-viewed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      
      const characters = await storage.getRecentlyViewed(userId, limit);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching recently viewed:", error);
      res.status(500).json({ message: "Failed to fetch recently viewed" });
    }
  });

  // Character interactions
  app.post('/api/characters/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const characterId = parseInt(req.params.id);
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      
      const isLiked = await storage.isCharacterLiked(userId, characterId);
      
      if (isLiked) {
        await storage.unlikeCharacter(userId, characterId);
      } else {
        await storage.likeCharacter(userId, characterId);
      }
      
      res.json({ liked: !isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/characters/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const characterId = parseInt(req.params.id);
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      
      const isFavorited = await storage.isCharacterFavorited(userId, characterId);
      
      if (isFavorited) {
        await storage.unfavoriteCharacter(userId, characterId);
      } else {
        await storage.favoriteCharacter(userId, characterId);
      }
      
      res.json({ favorited: !isFavorited });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.get('/api/characters/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const characterId = parseInt(req.params.id);
      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid character ID" });
      }
      
      const [liked, favorited] = await Promise.all([
        storage.isCharacterLiked(userId, characterId),
        storage.isCharacterFavorited(userId, characterId),
      ]);
      
      res.json({ liked, favorited });
    } catch (error) {
      console.error("Error fetching character status:", error);
      res.status(500).json({ message: "Failed to fetch character status" });
    }
  });

  // User routes
  app.get('/api/users/:username', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const verifications = await storage.getUserVerifications(user.id);
      res.json({ ...user, verifications });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:userId/characters', async (req, res) => {
    try {
      const { userId } = req.params;
      const viewerId = req.isAuthenticated && req.isAuthenticated() 
        ? (req.user as any)?.claims?.sub || (req.user as any)?.id 
        : undefined;
      
      const characters = await storage.getUserCharacters(userId, viewerId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "Failed to fetch user characters" });
    }
  });

  app.get('/api/users/me/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Social routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims?.sub || req.user.id;
      const { userId: followingId } = req.params;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Check if blocked
      if (await storage.isBlocked(followerId, followingId)) {
        return res.status(403).json({ message: "User is blocked" });
      }
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      
      if (isFollowing) {
        await storage.unfollowUser(followerId, followingId);
      } else {
        await storage.followUser(followerId, followingId);
      }
      
      res.json({ following: !isFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  app.get('/api/users/:userId/follow-status', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims?.sub || req.user.id;
      const { userId: followingId } = req.params;
      
      const following = await storage.isFollowing(followerId, followingId);
      res.json({ following });
    } catch (error) {
      console.error("Error fetching follow status:", error);
      res.status(500).json({ message: "Failed to fetch follow status" });
    }
  });

  // Friend routes
  app.post('/api/users/:userId/friend-request', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims?.sub || req.user.id;
      const { userId: addresseeId } = req.params;
      
      if (requesterId === addresseeId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }
      
      // Check if blocked
      if (await storage.isBlocked(requesterId, addresseeId)) {
        return res.status(403).json({ message: "User is blocked" });
      }
      
      await storage.sendFriendRequest(requesterId, addresseeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.post('/api/friend-requests/:requesterId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const addresseeId = req.user.claims?.sub || req.user.id;
      const { requesterId } = req.params;
      
      await storage.acceptFriendRequest(requesterId, addresseeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friend-requests/:requesterId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const addresseeId = req.user.claims?.sub || req.user.id;
      const { requesterId } = req.params;
      
      await storage.rejectFriendRequest(requesterId, addresseeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  app.get('/api/users/me/friend-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get('/api/users/me/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // Block routes
  app.post('/api/users/:userId/block', isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims?.sub || req.user.id;
      const { userId: blockedId } = req.params;
      
      if (blockerId === blockedId) {
        return res.status(400).json({ message: "Cannot block yourself" });
      }
      
      await storage.blockUser(blockerId, blockedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.post('/api/users/:userId/unblock', isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims?.sub || req.user.id;
      const { userId: blockedId } = req.params;
      
      await storage.unblockUser(blockerId, blockedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Messaging routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims?.sub || req.user.id;
      const { receiverId, content } = req.body;
      
      // Check if users are friends
      const areFriends = await storage.areFriends(senderId, receiverId);
      if (!areFriends) {
        return res.status(403).json({ message: "Can only message friends" });
      }
      
      // Check if blocked
      if (await storage.isBlocked(senderId, receiverId)) {
        return res.status(403).json({ message: "User is blocked" });
      }
      
      const message = await storage.sendMessage(senderId, receiverId, content);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId1 = req.user.claims?.sub || req.user.id;
      const { userId: userId2 } = req.params;
      
      // Check if users are friends
      const areFriends = await storage.areFriends(userId1, userId2);
      if (!areFriends) {
        return res.status(403).json({ message: "Can only view messages with friends" });
      }
      
      const messages = await storage.getConversation(userId1, userId2);
      
      // Mark messages as read
      await storage.markMessagesAsRead(userId1, userId2);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Creator routes
  app.post('/api/creator/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      await storage.applyForCreator(userId, applicationType, youtubeHandle, displayName);
      res.json({ success: true });
    } catch (error) {
      console.error("Error applying for creator:", error);
      res.status(500).json({ message: "Failed to apply for creator" });
    }
  });

  app.get('/api/creators/featured', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const creators = await storage.getFeaturedCreators(limit);
      
      // Add verification info for each creator
      const creatorsWithVerifications = await Promise.all(
        creators.map(async (creator) => {
          const verifications = await storage.getUserVerifications(creator.id);
          return { ...creator, verifications };
        })
      );
      
      res.json(creatorsWithVerifications);
    } catch (error) {
      console.error("Error fetching featured creators:", error);
      res.status(500).json({ message: "Failed to fetch featured creators" });
    }
  });

  // Social media verification routes
  app.post('/api/social-verification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { platform, username } = req.body;
      
      const validPlatforms = ['youtube', 'instagram', 'x', 'tiktok', 'facebook'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ message: "Invalid platform" });
      }
      
      await storage.addSocialMediaVerification(userId, platform, username);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding social media verification:", error);
      res.status(500).json({ message: "Failed to add social media verification" });
    }
  });

  // Tags routes
  app.get('/api/tags/trending', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const tags = await storage.getTrendingTags(limit);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching trending tags:", error);
      res.status(500).json({ message: "Failed to fetch trending tags" });
    }
  });

  app.get('/api/tags', async (req, res) => {
    try {
      const { getAvailableTags } = await import('./tags');
      const predefinedTags = getAvailableTags();
      const customTags = await storage.getAllTags();
      
      // Combine predefined tags with custom user tags, removing duplicates
      const allTags = Array.from(new Set([...predefinedTags, ...customTags]));
      res.json(allTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
