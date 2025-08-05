import { 
  users, questions, answers, news, synagogues, dailyHalacha, videos, contactMessages,
  type User, type InsertUser, type Question, type InsertQuestion,
  type Answer, type InsertAnswer, type News, type InsertNews,
  type Synagogue, type InsertSynagogue, type DailyHalacha, type InsertDailyHalacha,
  type Video, type InsertVideo, type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

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
  updateUserDeviceIdByEmail(email: string, deviceId: string): Promise<User>;
  upsertUser(user: { id: string; email: string; firstName: string; lastName: string; profileImageUrl: string }): Promise<User>;

  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByUser(userId: string): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  getUnansweredQuestions(): Promise<Question[]>;
  getQuestionWithAnswers(id: string): Promise<(Question & { answers: Answer[]; user?: { fullName: string } }) | undefined>;
  updateQuestionStatus(id: string, status: "pending" | "answered" | "closed"): Promise<Question>;
  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question>;
  approveQuestion(id: string, approvedBy: string): Promise<Question>;

  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByQuestion(questionId: string): Promise<Answer[]>;
  updateAnswer(id: string, data: { content: string }): Promise<Answer>;

  // News operations
  getAllNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, data: Partial<InsertNews>): Promise<News>;
  deleteNews(id: string): Promise<void>;
  getRecentNews(limit?: number): Promise<News[]>;

  // Synagogue operations
  getAllSynagogues(): Promise<Synagogue[]>;
  createSynagogue(synagogue: InsertSynagogue): Promise<Synagogue>;
  updateSynagogue(id: string, data: Partial<InsertSynagogue>): Promise<Synagogue>;
  deleteSynagogue(id: string): Promise<void>;

  // Daily Halacha operations
  getTodayHalacha(): Promise<DailyHalacha | undefined>;
  createDailyHalacha(halacha: InsertDailyHalacha): Promise<DailyHalacha>;
  updateDailyHalacha(id: string, data: Partial<InsertDailyHalacha>): Promise<DailyHalacha>;
  deleteDailyHalacha(id: string): Promise<void>;

  // Video operations
  getAllVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: string): Promise<void>;

  // Contact Message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  markContactMessageAsRead(id: string): Promise<ContactMessage>;

  // Search operations
  searchQuestions(query: string): Promise<Question[]>;

  // Enhanced User Management operations
  getAllUsersWithStats(params: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    users: (User & { questionsCount: number; lastActivity: string })[];
    total: number;
    pages: number;
  }>;
  
  getUserDetailsWithActivity(id: string): Promise<{
    user: User;
    statistics: {
      questionsSubmitted: number;
      questionsAnswered: number;
      lastLogin: string | null;
      totalLoginCount: number;
      joinDate: string;
      accountStatus: string;
    };
    recentActivity: any[];
  } | null>;
  
  updateUserStatus(id: string, status: string, reason?: string): Promise<User>;
  getUserActivity(id: string): Promise<any[]>;
  getSystemStatistics(): Promise<{
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    totalQuestions: number;
    answeredQuestions: number;
    pendingQuestions: number;
    recentRegistrations: number;
    activeUsers: number;
  }>;
  
  bulkUpdateUserStatus(userIds: string[], action: string, reason?: string): Promise<any>;
  exportUsersData(): Promise<any[]>;
  convertToCsv(data: any[]): string;

  // Notification operations (missing methods)
  getUserNotifications(userId: string): Promise<any[]>;
  markNotificationsAsRead(notificationIds: string[]): Promise<void>;
  markQuestionAnswerViewed(questionId: string): Promise<void>;
  markQuestionAnswered(questionId: string): Promise<void>;
  getQuestionById(id: string): Promise<Question | undefined>;
  createNotification(notification: any): Promise<any>;
  
  // Admin badge/notification operations
  markAllUsersAsSeenByAdmin(): Promise<void>;
  markAllQuestionsAsSeenByAdmin(): Promise<void>;
  markAllContactMessagesAsSeenByAdmin(): Promise<void>;
  markAllNewsAsSeenByAdmin(): Promise<void>;
  getAdminNotificationCounts(): Promise<{
    users: number;
    questions: number;
    contacts: number;
    news: number;
  }>;
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

  async updateUserDeviceIdByEmail(email: string, deviceId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ deviceId })
      .where(eq(users.email, email))
      .returning();
    return updatedUser;
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
    const allQuestions = await db.select().from(questions).orderBy(desc(questions.createdAt));
    console.log(`getAllQuestions: Found ${allQuestions.length} questions`);
    console.log('Questions visibility:', allQuestions.map(q => ({ id: q.id, title: q.title, isVisible: q.isVisible })));
    return allQuestions;
  }

  async getQuestionWithAnswers(id: string): Promise<(Question & { answers: Answer[]; user?: { fullName: string } }) | undefined> {
    const [question] = await db.select({
      id: questions.id,
      userId: questions.userId,
      title: questions.title,
      category: questions.category,
      content: questions.content,
      isUrgent: questions.isUrgent,
      isPrivate: questions.isPrivate,
      status: questions.status,
      isApproved: questions.isApproved,
      approvedBy: questions.approvedBy,
      approvedAt: questions.approvedAt,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
      userFullName: users.fullName,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .where(eq(questions.id, id));

    if (!question) return undefined;

    const questionAnswers = await db.select().from(answers).where(eq(answers.questionId, id));

    return {
      ...question,
      answers: questionAnswers,
      user: { fullName: question.userFullName || "משתמש" },
      isNew: question.isNew ?? true,
      isVisible: question.isVisible ?? false
    } as Question & { answers: Answer[]; user: { fullName: string } };
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question> {
    const [updated] = await db
      .update(questions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async approveQuestion(id: string, approvedBy: string): Promise<Question> {
    const [updated] = await db
      .update(questions)
      .set({ 
        isApproved: true, 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(questions.id, id))
      .returning();
    return updated;
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

  async updateAnswer(id: string, data: { content: string }): Promise<Answer> {
    const [updated] = await db
      .update(answers)
      .set({ content: data.content, updatedAt: new Date() })
      .where(eq(answers.id, id))
      .returning();
    return updated;
  }

  async deleteAnswersByQuestionId(questionId: string): Promise<void> {
    await db.delete(answers).where(eq(answers.questionId, questionId));
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
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

  async updateNews(id: string, data: Partial<InsertNews>): Promise<News> {
    const [newsItem] = await db.update(news).set(data).where(eq(news.id, id)).returning();
    return newsItem;
  }

  async deleteNews(id: string): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
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

  async updateSynagogue(id: string, data: Partial<InsertSynagogue>): Promise<Synagogue> {
    const [synagogue] = await db.update(synagogues).set(data).where(eq(synagogues.id, id)).returning();
    return synagogue;
  }

  async deleteSynagogue(id: string): Promise<void> {
    await db.delete(synagogues).where(eq(synagogues.id, id));
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

  async updateDailyHalacha(id: string, data: Partial<InsertDailyHalacha>): Promise<DailyHalacha> {
    const [halacha] = await db.update(dailyHalacha).set(data).where(eq(dailyHalacha.id, id)).returning();
    return halacha;
  }

  async deleteDailyHalacha(id: string): Promise<void> {
    await db.delete(dailyHalacha).where(eq(dailyHalacha.id, id));
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

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video> {
    const [video] = await db.update(videos).set(data).where(eq(videos.id, id)).returning();
    return video;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
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

  async upsertUser(userData: { id: string; email: string; firstName: string; lastName: string; profileImageUrl: string }): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          fullName: `${userData.firstName} ${userData.lastName}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const newUser = await this.createUser({
        fullName: `${userData.firstName} ${userData.lastName}`,
        personalId: userData.id.slice(-7), // Use last 7 chars of ID as personal ID
        phone: '0000000000', // Default phone
        email: userData.email,
        password: 'replit-auth' // Default password for Replit auth users
      });
      return newUser;
    }
  }

  // ==================== COMPREHENSIVE USER MANAGEMENT METHODS ====================
  
  async getAllUsersWithStats(params: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    users: (User & { questionsCount: number; lastActivity: string })[];
    total: number;
    pages: number;
  }> {
    const { status, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    // Build base query with filters
    const filters = [];
    if (status && status !== 'all') {
      filters.push(eq(users.status, status as any));
    }
    if (search) {
      filters.push(
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.phone, `%${search}%`),
          ilike(users.personalId, `%${search}%`)
        )
      );
    }

    // Get filtered users with simplified approach
    const allUsers = await db.select().from(users);
    let filteredUsers = allUsers;

    // Apply filters manually for simplicity
    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(search) ||
        user.personalId.includes(search)
      );
    }

    // Sort users
    filteredUsers.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'fullName':
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'loginCount':
          aVal = a.loginCount || 0;
          bVal = b.loginCount || 0;
          break;
        case 'lastLoginAt':
          aVal = a.lastLoginAt || new Date(0);
          bVal = b.lastLoginAt || new Date(0);
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // Apply pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Add question counts
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        const userQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.userId, user.id));
        
        return {
          ...user,
          questionsCount: userQuestions.length,
          lastActivity: user.lastLoginAt?.toISOString() || user.createdAt.toISOString()
        };
      })
    );

    return {
      users: usersWithStats,
      total,
      pages
    };
  }

  async getUserDetailsWithActivity(id: string): Promise<{
    user: User;
    statistics: {
      questionsSubmitted: number;
      questionsAnswered: number;
      lastLogin: string | null;
      totalLoginCount: number;
      joinDate: string;
      accountStatus: string;
    };
    recentActivity: any[];
  } | null> {
    const user = await this.getUser(id);
    if (!user) return null;

    // Get user questions
    const userQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.userId, id));

    const answeredQuestions = userQuestions.filter(q => q.status === 'answered');

    // Get recent activity (questions and answers)
    const recentQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.userId, id))
      .orderBy(desc(questions.createdAt))
      .limit(10);

    const recentActivity = recentQuestions.map(q => ({
      type: 'question',
      title: q.title || 'שאלה',
      content: q.content.substring(0, 100) + '...',
      date: q.createdAt,
      status: q.status
    }));

    return {
      user,
      statistics: {
        questionsSubmitted: userQuestions.length,
        questionsAnswered: answeredQuestions.length,
        lastLogin: user.lastLoginAt?.toISOString() || null,
        totalLoginCount: user.loginCount || 0,
        joinDate: user.createdAt.toISOString(),
        accountStatus: user.status
      },
      recentActivity
    };
  }

  async updateUserStatus(id: string, status: string, reason?: string): Promise<User> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = 'admin-system';
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async getUserActivity(id: string): Promise<any[]> {
    const userQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.userId, id))
      .orderBy(desc(questions.createdAt));

    return userQuestions.map(q => ({
      type: 'question',
      title: q.title || 'שאלה',
      content: q.content.substring(0, 150) + '...',
      date: q.createdAt,
      status: q.status,
      category: q.category
    }));
  }

  async getSystemStatistics(): Promise<{
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    totalQuestions: number;
    answeredQuestions: number;
    pendingQuestions: number;
    recentRegistrations: number;
    activeUsers: number;
  }> {
    // Simplified approach to avoid complex counting queries
    const allUsers = await db.select().from(users);
    const allQuestions = await db.select().from(questions);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      totalUsers: allUsers.length,
      pendingUsers: allUsers.filter(u => u.status === 'pending').length,
      approvedUsers: allUsers.filter(u => u.status === 'approved').length,
      rejectedUsers: allUsers.filter(u => u.status === 'rejected').length,
      totalQuestions: allQuestions.length,
      answeredQuestions: allQuestions.filter(q => q.status === 'answered').length,
      pendingQuestions: allQuestions.filter(q => q.status === 'pending').length,
      recentRegistrations: allUsers.filter(u => u.createdAt >= sevenDaysAgo).length,
      activeUsers: allUsers.filter(u => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo).length
    };
  }

  async bulkUpdateUserStatus(userIds: string[], action: string, reason?: string): Promise<any> {
    const status = action === 'approve' ? 'approved' : 
                  action === 'reject' ? 'rejected' : 
                  action === 'revoke' ? 'pending' : 'pending';

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (action === 'approve') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = 'admin-system';
    }

    const results = await Promise.all(
      userIds.map(async (id) => {
        try {
          const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();
          return { id, success: true, user: updatedUser };
        } catch (error: any) {
          return { id, success: false, error: error?.message || 'Unknown error' };
        }
      })
    );

    return {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Notification badges functions
  async markQuestionsAsSeen() {
    try {
      await db
        .update(questions)
        .set({ isSeenByAdmin: true })
        .where(eq(questions.isSeenByAdmin, false));
    } catch (error) {
      console.error("Error marking questions as seen:", error);
      throw error;
    }
  }

  async markContactsAsSeen() {
    try {
      await db
        .update(contactMessages)
        .set({ isSeenByAdmin: true })
        .where(eq(contactMessages.isSeenByAdmin, false));
    } catch (error) {
      console.error("Error marking contacts as seen:", error);
      throw error;
    }
  }

  async markNewsAsSeen() {
    try {
      await db
        .update(news)
        .set({ isSeenByAdmin: true })
        .where(eq(news.isSeenByAdmin, false));
    } catch (error) {
      console.error("Error marking news as seen:", error);
      throw error;
    }
  }

  async exportUsersData(): Promise<any[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    return allUsers.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      approvedAt: user.approvedAt?.toISOString() || null,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      loginCount: user.loginCount || 0,
      questionsSubmitted: user.questionsSubmitted || 0
    }));
  }

  convertToCsv(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // ==================== NOTIFICATION METHODS ====================
  
  async getUserNotifications(userId: string): Promise<any[]> {
    // For now, return empty array since notifications table might not exist
    // This should be implemented with proper notifications table
    return [];
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    // Placeholder implementation
    return;
  }

  async markQuestionAnswerViewed(questionId: string): Promise<void> {
    await db
      .update(questions)
      .set({ hasNewAnswer: false })
      .where(eq(questions.id, questionId));
  }

  async markQuestionAnswered(questionId: string): Promise<void> {
    await db
      .update(questions)
      .set({ 
        status: 'answered',
        answeredAt: new Date(),
        hasNewAnswer: true
      })
      .where(eq(questions.id, questionId));
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createNotification(notification: any): Promise<any> {
    // Placeholder implementation - should create notification in notifications table
    return notification;
  }

  // Admin badge/notification operations
  async markAllUsersAsSeenByAdmin(): Promise<void> {
    await db
      .update(users)
      .set({ isSeenByAdmin: true })
      .where(eq(users.isSeenByAdmin, false));
  }

  async markAllQuestionsAsSeenByAdmin(): Promise<void> {
    await db
      .update(questions)
      .set({ isSeenByAdmin: true })
      .where(eq(questions.isSeenByAdmin, false));
  }

  async markAllContactMessagesAsSeenByAdmin(): Promise<void> {
    await db
      .update(contactMessages)
      .set({ isSeenByAdmin: true })
      .where(eq(contactMessages.isSeenByAdmin, false));
  }

  async markAllNewsAsSeenByAdmin(): Promise<void> {
    await db
      .update(news)
      .set({ isSeenByAdmin: true })
      .where(eq(news.isSeenByAdmin, false));
  }

  async getAdminNotificationCounts(): Promise<{
    users: number;
    questions: number;
    contacts: number;
    news: number;
  }> {
    const [userCount] = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(users)
      .where(and(
        eq(users.status, "pending"),
        eq(users.isSeenByAdmin, false)
      ));

    const [questionCount] = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(questions)
      .where(and(
        eq(questions.status, "pending"),
        eq(questions.isSeenByAdmin, false)
      ));

    const [contactCount] = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(contactMessages)
      .where(eq(contactMessages.isSeenByAdmin, false));

    const [newsCount] = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(news)
      .where(eq(news.isSeenByAdmin, false));

    return {
      users: Number(userCount?.count || 0),
      questions: Number(questionCount?.count || 0),
      contacts: Number(contactCount?.count || 0),
      news: Number(newsCount?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
