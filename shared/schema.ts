import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with required Hebrew fields and admin approval system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Required Hebrew fields
  fullName: text("full_name").notNull(),
  personalId: text("personal_id").unique().notNull(),
  phone: text("phone").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  deviceId: text("device_id").unique(),
  // System fields
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  isUrgent: boolean("is_urgent").default(false).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  status: text("status", { enum: ["pending", "answered", "closed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Answers table
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").references(() => questions.id).notNull(),
  content: text("content").notNull(),
  answeredBy: varchar("answered_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// News table
export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  isUrgent: boolean("is_urgent").default(false).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull(),
});

// Synagogues table
export const synagogues = pgTable("synagogues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  shacharit: text("shacharit"),
  mincha: text("mincha"),
  maariv: text("maariv"),
  contact: text("contact"),
  notes: text("notes"),
});

// Daily Halacha table
export const dailyHalacha = pgTable("daily_halacha", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  content: text("content").notNull(),
  title: text("title"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// YouTube Videos table
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtube_id").notNull(),
  thumbnail: text("thumbnail"),
  publishedAt: timestamp("published_at"),
  addedBy: varchar("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact Messages table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

// Insert schemas with validation for Hebrew registration
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true,
  status: true,
  isAdmin: true,
  deviceId: true,
}).extend({
  fullName: z.string().min(2, "שם מלא חובה").max(100, "שם ארוך מדי"),
  personalId: z.string().regex(/^\d{7}$/, "מספר אישי חייב להכיל 7 ספרות"),
  phone: z.string().regex(/^0[5-7]\d{8}$/, "מספר טלפון לא תקין"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "סיסמה נדרשת"),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  publishedAt: true,
});

export const insertSynagogueSchema = createInsertSchema(synagogues).omit({
  id: true,
});

export const insertDailyHalachaSchema = createInsertSchema(dailyHalacha).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Synagogue = typeof synagogues.$inferSelect;
export type InsertSynagogue = z.infer<typeof insertSynagogueSchema>;
export type DailyHalacha = typeof dailyHalacha.$inferSelect;
export type InsertDailyHalacha = z.infer<typeof insertDailyHalachaSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;


