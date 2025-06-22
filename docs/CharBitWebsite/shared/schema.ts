import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  pgEnum,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // Separate display name they can customize
  creatorName: varchar("creator_name"), // YouTube name or email name when they become creator
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  youtubeHandle: varchar("youtube_handle"), // Their YouTube username/handle
  isCreator: boolean("is_creator").default(false),
  creatorApplicationStatus: varchar("creator_application_status", { enum: ["none", "pending", "approved", "rejected"] }).default("none"),
  theme: varchar("theme").default("black"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media verification
export const socialMediaVerifications = pgTable("social_media_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // youtube, instagram, x, tiktok, facebook
  platformUsername: varchar("platform_username").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Character visibility enum
export const visibilityEnum = pgEnum("visibility", ["private", "restricted", "public"]);

// Add profile visibility to users table
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  profileVisibility: visibilityEnum("profile_visibility").default("public"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Characters table
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  nickname: varchar("nickname"),
  personality: text("personality"),
  about: text("about"),
  avatarUrl: varchar("avatar_url"),
  visibility: visibilityEnum("visibility").default("public"),
  tags: text("tags").array().default([]),
  likesCount: integer("likes_count").default(0),
  favoritesCount: integer("favorites_count").default(0),
  viewsCount: integer("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Character likes
export const characterLikes = pgTable(
  "character_likes",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.userId, table.characterId)]
);

// Character favorites
export const characterFavorites = pgTable(
  "character_favorites",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.userId, table.characterId)]
);

// Recently viewed characters
export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id").references(() => characters.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at").defaultNow(),
  },
  (table) => [unique().on(table.userId, table.characterId)]
);

// User follows
export const userFollows = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    followerId: varchar("follower_id").references(() => users.id, { onDelete: "cascade" }),
    followingId: varchar("following_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.followerId, table.followingId)]
);

// User friendships
export const userFriendships = pgTable(
  "user_friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: varchar("requester_id").references(() => users.id, { onDelete: "cascade" }),
    addresseeId: varchar("addressee_id").references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status").default("pending"), // pending, accepted, rejected
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique().on(table.requesterId, table.addresseeId)]
);

// User blocks
export const userBlocks = pgTable(
  "user_blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: varchar("blocker_id").references(() => users.id, { onDelete: "cascade" }),
    blockedId: varchar("blocked_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.blockerId, table.blockedId)]
);

// Private messages
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  socialMediaVerifications: many(socialMediaVerifications),
  characterLikes: many(characterLikes),
  characterFavorites: many(characterFavorites),
  recentlyViewed: many(recentlyViewed),
  following: many(userFollows, { relationName: "follower" }),
  followers: many(userFollows, { relationName: "following" }),
  sentFriendRequests: many(userFriendships, { relationName: "requester" }),
  receivedFriendRequests: many(userFriendships, { relationName: "addressee" }),
  blockedUsers: many(userBlocks, { relationName: "blocker" }),
  blockedBy: many(userBlocks, { relationName: "blocked" }),
  sentMessages: many(privateMessages, { relationName: "sender" }),
  receivedMessages: many(privateMessages, { relationName: "receiver" }),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  creator: one(users, {
    fields: [characters.creatorId],
    references: [users.id],
  }),
  likes: many(characterLikes),
  favorites: many(characterFavorites),
  views: many(recentlyViewed),
}));

export const characterLikesRelations = relations(characterLikes, ({ one }) => ({
  user: one(users, {
    fields: [characterLikes.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [characterLikes.characterId],
    references: [characters.id],
  }),
}));

export const characterFavoritesRelations = relations(characterFavorites, ({ one }) => ({
  user: one(users, {
    fields: [characterFavorites.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [characterFavorites.characterId],
    references: [characters.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  creatorId: true,
  likesCount: true,
  favoritesCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCharacterSchema = insertCharacterSchema.partial();

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type UpdateCharacter = z.infer<typeof updateCharacterSchema>;
export type SocialMediaVerification = typeof socialMediaVerifications.$inferSelect;
export type UserFollow = typeof userFollows.$inferSelect;
export type UserFriendship = typeof userFriendships.$inferSelect;
export type PrivateMessage = typeof privateMessages.$inferSelect;
