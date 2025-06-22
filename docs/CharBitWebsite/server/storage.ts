import {
  users,
  characters,
  characterLikes,
  characterFavorites,
  recentlyViewed,
  userFollows,
  userFriendships,
  userBlocks,
  privateMessages,
  socialMediaVerifications,
  userProfiles,
  type User,
  type UpsertUser,
  type Character,
  type InsertCharacter,
  type UpdateCharacter,
  type UserFollow,
  type UserFriendship,
  type PrivateMessage,
  type SocialMediaVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, inArray, like, count, not } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTheme(userId: string, theme: string): Promise<void>;
  updateUserProfileVisibility(userId: string, visibility: "public" | "private" | "restricted"): Promise<void>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  // Character operations
  createCharacter(character: InsertCharacter & { creatorId: string }): Promise<Character>;
  updateCharacter(id: number, updates: UpdateCharacter): Promise<Character>;
  deleteCharacter(id: number, userId: string): Promise<void>;
  getCharacter(id: number): Promise<Character | undefined>;
  getCharacterWithCreator(id: number): Promise<(Character & { creator: User }) | undefined>;
  getUserCharacters(userId: string, viewerId?: string): Promise<Character[]>;
  getPublicCharacters(limit?: number): Promise<(Character & { creator: User })[]>;
  getFeaturedCharacters(limit?: number): Promise<(Character & { creator: User })[]>;
  getFollowingCharacters(userId: string, limit?: number): Promise<(Character & { creator: User })[]>;
  searchCharacters(query: string, limit?: number): Promise<(Character & { creator: User })[]>;
  getCharactersByTags(tags: string[], limit?: number): Promise<(Character & { creator: User })[]>;
  
  // Character interactions
  likeCharacter(userId: string, characterId: number): Promise<void>;
  unlikeCharacter(userId: string, characterId: number): Promise<void>;
  favoriteCharacter(userId: string, characterId: number): Promise<void>;
  unfavoriteCharacter(userId: string, characterId: number): Promise<void>;
  addRecentlyViewed(userId: string, characterId: number): Promise<void>;
  getRecentlyViewed(userId: string, limit?: number): Promise<(Character & { creator: User })[]>;
  getUserFavorites(userId: string): Promise<(Character & { creator: User })[]>;
  isCharacterLiked(userId: string, characterId: number): Promise<boolean>;
  isCharacterFavorited(userId: string, characterId: number): Promise<boolean>;
  
  // Social operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  
  // Friend operations
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<void>;
  acceptFriendRequest(requesterId: string, addresseeId: string): Promise<void>;
  rejectFriendRequest(requesterId: string, addresseeId: string): Promise<void>;
  removeFriend(userId1: string, userId2: string): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string): Promise<(UserFriendship & { requester: User })[]>;
  areFriends(userId1: string, userId2: string): Promise<boolean>;
  
  // Block operations
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(userId1: string, userId2: string): Promise<boolean>;
  getBlockedUsers(userId: string): Promise<User[]>;
  
  // Message operations
  sendMessage(senderId: string, receiverId: string, content: string): Promise<PrivateMessage>;
  getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  
  // Creator operations
  applyForCreator(userId: string, applicationType: "youtube" | "email", youtubeHandle?: string, displayName?: string): Promise<void>;
  approveCreatorApplication(userId: string): Promise<void>;
  rejectCreatorApplication(userId: string): Promise<void>;
  getFeaturedCreators(limit?: number): Promise<User[]>;
  
  // Social media verification
  addSocialMediaVerification(userId: string, platform: string, username: string): Promise<void>;
  verifySocialMedia(userId: string, platform: string): Promise<void>;
  getUserVerifications(userId: string): Promise<SocialMediaVerification[]>;
  
  // Tags and discovery
  getTrendingTags(limit?: number): Promise<{ tag: string; count: number }[]>;
  getAllTags(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserTheme(userId: string, theme: string): Promise<void> {
    await db
      .update(users)
      .set({ theme, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserProfileVisibility(userId: string, visibility: "public" | "private" | "restricted"): Promise<void> {
    await db
      .insert(userProfiles)
      .values({ userId, profileVisibility: visibility, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { profileVisibility: visibility, updatedAt: new Date() }
      });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Character operations
  async createCharacter(character: InsertCharacter & { creatorId: string }): Promise<Character> {
    // Ensure OC tag is always included
    const tags = character.tags || [];
    if (!tags.includes("OC")) {
      tags.unshift("OC");
    }

    const [newCharacter] = await db
      .insert(characters)
      .values({ ...character, tags })
      .returning();
    return newCharacter;
  }

  async updateCharacter(id: number, updates: UpdateCharacter): Promise<Character> {
    // Ensure OC tag is preserved if tags are being updated
    if (updates.tags) {
      if (!updates.tags.includes("OC")) {
        updates.tags.unshift("OC");
      }
    }

    const [updatedCharacter] = await db
      .update(characters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return updatedCharacter;
  }

  async deleteCharacter(id: number, userId: string): Promise<void> {
    await db
      .delete(characters)
      .where(and(eq(characters.id, id), eq(characters.creatorId, userId)));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async getCharacterWithCreator(id: number): Promise<(Character & { creator: User }) | undefined> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(eq(characters.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].characters,
      creator: result[0].users,
    };
  }

  async getUserCharacters(userId: string, viewerId?: string): Promise<Character[]> {
    const baseQuery = db.select().from(characters).where(eq(characters.creatorId, userId));
    
    // If viewer is not the owner, only show public characters
    if (viewerId !== userId) {
      const publicQuery = db.select().from(characters)
        .where(and(eq(characters.creatorId, userId), eq(characters.visibility, "public")))
        .orderBy(desc(characters.createdAt));
      return await publicQuery;
    }
    
    return await baseQuery.orderBy(desc(characters.createdAt));
  }

  async getPublicCharacters(limit = 20): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(eq(characters.visibility, "public"))
      .orderBy(desc(characters.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async getFeaturedCharacters(limit = 20): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(eq(characters.visibility, "public"))
      .orderBy(desc(characters.likesCount))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async getFollowingCharacters(userId: string, limit = 20): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .innerJoin(userFollows, eq(userFollows.followingId, characters.creatorId))
      .where(
        and(
          eq(userFollows.followerId, userId),
          eq(characters.visibility, "public")
        )
      )
      .orderBy(desc(characters.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async searchCharacters(query: string, limit = 20): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(
        and(
          eq(characters.visibility, "public"),
          or(
            like(characters.name, `%${query}%`),
            like(characters.about, `%${query}%`),
            sql`${characters.tags} && ARRAY[${query}]::text[]`
          )
        )
      )
      .orderBy(desc(characters.likesCount))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async getCharactersByTags(tags: string[], limit = 20): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characters)
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(
        and(
          eq(characters.visibility, "public"),
          sql`${characters.tags} && ARRAY[${tags.join(',')}]::text[]`
        )
      )
      .orderBy(desc(characters.likesCount))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  // Character interactions
  async likeCharacter(userId: string, characterId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .insert(characterLikes)
        .values({ userId, characterId })
        .onConflictDoNothing();
      
      await tx
        .update(characters)
        .set({ likesCount: sql`${characters.likesCount} + 1` })
        .where(eq(characters.id, characterId));
    });
  }

  async unlikeCharacter(userId: string, characterId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(characterLikes)
        .where(and(eq(characterLikes.userId, userId), eq(characterLikes.characterId, characterId)));
      
      await tx
        .update(characters)
        .set({ likesCount: sql`${characters.likesCount} - 1` })
        .where(eq(characters.id, characterId));
    });
  }

  async favoriteCharacter(userId: string, characterId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .insert(characterFavorites)
        .values({ userId, characterId })
        .onConflictDoNothing();
      
      await tx
        .update(characters)
        .set({ favoritesCount: sql`${characters.favoritesCount} + 1` })
        .where(eq(characters.id, characterId));
    });
  }

  async unfavoriteCharacter(userId: string, characterId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(characterFavorites)
        .where(and(eq(characterFavorites.userId, userId), eq(characterFavorites.characterId, characterId)));
      
      await tx
        .update(characters)
        .set({ favoritesCount: sql`${characters.favoritesCount} - 1` })
        .where(eq(characters.id, characterId));
    });
  }

  async addRecentlyViewed(userId: string, characterId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove existing entry if it exists
      await tx
        .delete(recentlyViewed)
        .where(and(eq(recentlyViewed.userId, userId), eq(recentlyViewed.characterId, characterId)));
      
      // Add new entry
      await tx
        .insert(recentlyViewed)
        .values({ userId, characterId });
      
      // Update view count
      await tx
        .update(characters)
        .set({ viewsCount: sql`${characters.viewsCount} + 1` })
        .where(eq(characters.id, characterId));
    });
  }

  async getRecentlyViewed(userId: string, limit = 10): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(recentlyViewed)
      .innerJoin(characters, eq(recentlyViewed.characterId, characters.id))
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(eq(recentlyViewed.userId, userId))
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(limit);

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async getUserFavorites(userId: string): Promise<(Character & { creator: User })[]> {
    const result = await db
      .select()
      .from(characterFavorites)
      .innerJoin(characters, eq(characterFavorites.characterId, characters.id))
      .innerJoin(users, eq(characters.creatorId, users.id))
      .where(eq(characterFavorites.userId, userId))
      .orderBy(desc(characterFavorites.createdAt));

    return result.map(row => ({
      ...row.characters,
      creator: row.users,
    }));
  }

  async isCharacterLiked(userId: string, characterId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(characterLikes)
      .where(and(eq(characterLikes.userId, userId), eq(characterLikes.characterId, characterId)));
    return !!like;
  }

  async isCharacterFavorited(userId: string, characterId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(characterFavorites)
      .where(and(eq(characterFavorites.userId, userId), eq(characterFavorites.characterId, characterId)));
    return !!favorite;
  }

  // Social operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db
      .insert(userFollows)
      .values({ followerId, followingId })
      .onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
    return !!follow;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));

    return result.map(row => row.users);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));

    return result.map(row => row.users);
  }

  // Friend operations
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
    await db
      .insert(userFriendships)
      .values({ requesterId, addresseeId, status: "pending" })
      .onConflictDoNothing();
  }

  async acceptFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
    await db
      .update(userFriendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(and(eq(userFriendships.requesterId, requesterId), eq(userFriendships.addresseeId, addresseeId)));
  }

  async rejectFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
    await db
      .update(userFriendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(and(eq(userFriendships.requesterId, requesterId), eq(userFriendships.addresseeId, addresseeId)));
  }

  async removeFriend(userId1: string, userId2: string): Promise<void> {
    await db
      .delete(userFriendships)
      .where(
        or(
          and(eq(userFriendships.requesterId, userId1), eq(userFriendships.addresseeId, userId2)),
          and(eq(userFriendships.requesterId, userId2), eq(userFriendships.addresseeId, userId1))
        )
      );
  }

  async getFriends(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(userFriendships)
      .innerJoin(users, 
        or(
          and(eq(userFriendships.requesterId, userId), eq(users.id, userFriendships.addresseeId)),
          and(eq(userFriendships.addresseeId, userId), eq(users.id, userFriendships.requesterId))
        )
      )
      .where(
        and(
          eq(userFriendships.status, "accepted"),
          or(eq(userFriendships.requesterId, userId), eq(userFriendships.addresseeId, userId))
        )
      );

    return result.map(row => row.users);
  }

  async getFriendRequests(userId: string): Promise<(UserFriendship & { requester: User })[]> {
    const result = await db
      .select()
      .from(userFriendships)
      .innerJoin(users, eq(userFriendships.requesterId, users.id))
      .where(and(eq(userFriendships.addresseeId, userId), eq(userFriendships.status, "pending")));

    return result.map(row => ({
      ...row.user_friendships,
      requester: row.users,
    }));
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(userFriendships)
      .where(
        and(
          eq(userFriendships.status, "accepted"),
          or(
            and(eq(userFriendships.requesterId, userId1), eq(userFriendships.addresseeId, userId2)),
            and(eq(userFriendships.requesterId, userId2), eq(userFriendships.addresseeId, userId1))
          )
        )
      );
    return !!friendship;
  }

  // Block operations
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Add block
      await tx
        .insert(userBlocks)
        .values({ blockerId, blockedId })
        .onConflictDoNothing();
      
      // Remove any existing friendship
      await tx
        .delete(userFriendships)
        .where(
          or(
            and(eq(userFriendships.requesterId, blockerId), eq(userFriendships.addresseeId, blockedId)),
            and(eq(userFriendships.requesterId, blockedId), eq(userFriendships.addresseeId, blockerId))
          )
        );
      
      // Remove any follows
      await tx
        .delete(userFollows)
        .where(
          or(
            and(eq(userFollows.followerId, blockerId), eq(userFollows.followingId, blockedId)),
            and(eq(userFollows.followerId, blockedId), eq(userFollows.followingId, blockerId))
          )
        );
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const [block] = await db
      .select()
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blockerId, userId1), eq(userBlocks.blockedId, userId2)),
          and(eq(userBlocks.blockerId, userId2), eq(userBlocks.blockedId, userId1))
        )
      );
    return !!block;
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(userBlocks)
      .innerJoin(users, eq(userBlocks.blockedId, users.id))
      .where(eq(userBlocks.blockerId, userId));

    return result.map(row => row.users);
  }

  // Message operations
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<PrivateMessage> {
    const [message] = await db
      .insert(privateMessages)
      .values({ senderId, receiverId, content })
      .returning();
    return message;
  }

  async getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]> {
    return await db
      .select()
      .from(privateMessages)
      .where(
        or(
          and(eq(privateMessages.senderId, userId1), eq(privateMessages.receiverId, userId2)),
          and(eq(privateMessages.senderId, userId2), eq(privateMessages.receiverId, userId1))
        )
      )
      .orderBy(asc(privateMessages.createdAt));
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(privateMessages)
      .set({ isRead: true })
      .where(and(eq(privateMessages.receiverId, userId), eq(privateMessages.senderId, senderId)));
  }

  // Creator operations
  async applyForCreator(userId: string, applicationType: "youtube" | "email", youtubeHandle?: string, displayName?: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    let newUsername: string;
    let newCreatorName: string;

    if (applicationType === "youtube" && youtubeHandle) {
      // Use YouTube handle as username (remove @ if present)
      newUsername = youtubeHandle.startsWith('@') ? youtubeHandle.slice(1) : youtubeHandle;
      newCreatorName = youtubeHandle;
    } else {
      // Use email as username and creator name
      if (!user.email) throw new Error("User email is required for email-based application");
      newUsername = user.email;
      newCreatorName = user.email.split('@')[0]; // Use part before @ as creator name
    }

    const updateData: any = {
      creatorApplicationStatus: "pending",
      username: newUsername,
      creatorName: newCreatorName,
      updatedAt: new Date()
    };

    if (displayName?.trim()) {
      updateData.displayName = displayName.trim();
    }

    if (applicationType === "youtube" && youtubeHandle) {
      updateData.youtubeHandle = youtubeHandle;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  async approveCreatorApplication(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isCreator: true, 
        creatorApplicationStatus: "approved", 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async rejectCreatorApplication(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ creatorApplicationStatus: "rejected", updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getFeaturedCreators(limit = 10): Promise<User[]> {
    const result = await db
      .select({
        user: users,
        characterCount: count(characters.id),
      })
      .from(users)
      .leftJoin(characters, eq(users.id, characters.creatorId))
      .where(eq(users.isCreator, true))
      .groupBy(users.id)
      .orderBy(desc(count(characters.id)))
      .limit(limit);

    return result.map(row => row.user);
  }

  // Social media verification
  async addSocialMediaVerification(userId: string, platform: string, username: string): Promise<void> {
    await db
      .insert(socialMediaVerifications)
      .values({ userId, platform, platformUsername: username })
      .onConflictDoUpdate({
        target: [socialMediaVerifications.userId, socialMediaVerifications.platform],
        set: { platformUsername: username },
      });
  }

  async verifySocialMedia(userId: string, platform: string): Promise<void> {
    await db
      .update(socialMediaVerifications)
      .set({ isVerified: true })
      .where(and(eq(socialMediaVerifications.userId, userId), eq(socialMediaVerifications.platform, platform)));
  }

  async getUserVerifications(userId: string): Promise<SocialMediaVerification[]> {
    return await db
      .select()
      .from(socialMediaVerifications)
      .where(eq(socialMediaVerifications.userId, userId));
  }

  // Tags and discovery
  async getTrendingTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const result = await db
      .select({
        tag: sql<string>`unnest(${characters.tags})`,
        count: sql<number>`count(*)`,
      })
      .from(characters)
      .where(eq(characters.visibility, "public"))
      .groupBy(sql`unnest(${characters.tags})`)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return result;
  }

  async getAllTags(): Promise<string[]> {
    const result = await db
      .select({
        tag: sql<string>`DISTINCT unnest(${characters.tags})`,
      })
      .from(characters)
      .where(eq(characters.visibility, "public"));

    return result.map(row => row.tag);
  }
}

export const storage = new DatabaseStorage();
