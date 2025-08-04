import { 
  users, questions, answers, news, synagogues, dailyHalacha, videos, contactMessages,
  type User, type InsertUser, type Question, type InsertQuestion,
  type Answer, type InsertAnswer, type News, type InsertNews,
  type Synagogue, type InsertSynagogue, type DailyHalacha, type InsertDailyHalacha,
  type Video, type InsertVideo, type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByDeviceId(deviceId: string): Promise<User | undefined>;
  getUserByPersonalId(personalId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: "pending" | "approved" | "rejected", approvedBy?: string): Promise<User>;
  updateUserDeviceId(id: string, deviceId: string): Promise<User>;
  getPendingUsers(): Promise<User[]>;

  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByUser(userId: string): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  getUnansweredQuestions(): Promise<Question[]>;
  updateQuestionStatus(id: string, status: "pending" | "answered" | "closed"): Promise<Question>;

  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByQuestion(questionId: string): Promise<Answer[]>;

  // News operations
  getAllNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  getRecentNews(limit?: number): Promise<News[]>;

  // Synagogue operations
  getAllSynagogues(): Promise<Synagogue[]>;
  createSynagogue(synagogue: InsertSynagogue): Promise<Synagogue>;

  // Daily Halacha operations
  getTodayHalacha(): Promise<DailyHalacha | undefined>;
  createDailyHalacha(halacha: InsertDailyHalacha): Promise<DailyHalacha>;

  // Video operations
  getAllVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Contact Message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  markContactMessageAsRead(id: string): Promise<ContactMessage>;

  // Search operations
  searchQuestions(query: string): Promise<Question[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.deviceId, deviceId));
    return user || undefined;
  }

  async getUserByPersonalId(personalId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.personalId, personalId));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }



  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStatus(id: string, status: "pending" | "approved" | "rejected", approvedBy?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        status, 
        approvedBy,
        approvedAt: status === "approved" ? new Date() : null
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserDeviceId(id: string, deviceId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ deviceId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.status, "pending")).orderBy(desc(users.createdAt));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async getQuestionsByUser(userId: string): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.userId, userId)).orderBy(desc(questions.createdAt));
  }

  async getAllQuestions(): Promise<Question[]> {
    return db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async getUnansweredQuestions(): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.status, "pending")).orderBy(desc(questions.createdAt));
  }

  async updateQuestionStatus(id: string, status: "pending" | "answered" | "closed"): Promise<Question> {
    const [question] = await db
      .update(questions)
      .set({ status })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db
      .insert(answers)
      .values(answer)
      .returning();
    
    // Update question status to answered
    await this.updateQuestionStatus(answer.questionId, "answered");
    
    return newAnswer;
  }

  async getAnswersByQuestion(questionId: string): Promise<Answer[]> {
    return db.select().from(answers).where(eq(answers.questionId, questionId)).orderBy(desc(answers.createdAt));
  }

  async getAllNews(): Promise<News[]> {
    return db.select().from(news).orderBy(desc(news.publishedAt));
  }

  async createNews(newsItem: InsertNews): Promise<News> {
    const [newNews] = await db
      .insert(news)
      .values(newsItem)
      .returning();
    return newNews;
  }

  async getRecentNews(limit: number = 5): Promise<News[]> {
    return db.select().from(news).orderBy(desc(news.publishedAt)).limit(limit);
  }

  async getAllSynagogues(): Promise<Synagogue[]> {
    return db.select().from(synagogues);
  }

  async createSynagogue(synagogue: InsertSynagogue): Promise<Synagogue> {
    const [newSynagogue] = await db
      .insert(synagogues)
      .values(synagogue)
      .returning();
    return newSynagogue;
  }

  async getTodayHalacha(): Promise<DailyHalacha | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [halacha] = await db
      .select()
      .from(dailyHalacha)
      .where(and(
        eq(dailyHalacha.date, today)
      ));
    
    return halacha || undefined;
  }

  async createDailyHalacha(halacha: InsertDailyHalacha): Promise<DailyHalacha> {
    const [newHalacha] = await db
      .insert(dailyHalacha)
      .values(halacha)
      .returning();
    return newHalacha;
  }

  async getAllVideos(): Promise<Video[]> {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values(video)
      .returning();
    return newVideo;
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async markContactMessageAsRead(id: string): Promise<ContactMessage> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async searchQuestions(query: string): Promise<Question[]> {
    return db
      .select()
      .from(questions)
      .where(
        or(
          ilike(questions.content, `%${query}%`),
          ilike(questions.category, `%${query}%`)
        )
      )
      .orderBy(desc(questions.createdAt));
  }
}

export const storage = new DatabaseStorage();
