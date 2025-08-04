import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertAnswerSchema, insertNewsSchema, insertSynagogueSchema, insertDailyHalachaSchema, insertVideoSchema, insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";

// Admin middleware to check if user is admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(401).json({ message: "Unauthorized - No device ID" });
    }

    const user = await storage.getUserByDeviceId(deviceId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes with Hebrew validation
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if device already registered
      const deviceId = req.body.deviceId;
      if (deviceId) {
        const existingUser = await storage.getUserByDeviceId(deviceId);
        if (existingUser) {
          return res.json({ user: existingUser });
        }
      }

      // Check if personal ID already exists
      if (userData.personalId) {
        const existingPersonalId = await storage.getUserByPersonalId(userData.personalId);
        if (existingPersonalId) {
          return res.status(400).json({ message: "מספר אישי זה כבר רשום במערכת" });
        }
      }

      const user = await storage.createUser(userData);
      res.json({ user });
    } catch (error) {
      const errorMessage = error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "שגיאה ברישום המשתמש";
      res.status(400).json({ message: errorMessage });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, deviceId } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "כתובת אימייל לא רשומה במערכת" });
      }

      // Check password (in production, use proper password hashing)
      if (user.password !== password) {
        return res.status(401).json({ message: "סיסמה לא נכונה" });
      }

      if (user.status !== "approved") {
        return res.status(403).json({ message: "החשבון לא אושר עדיין על ידי מנהל המערכת" });
      }

      // Update the user's device ID for this login
      const updatedUser = await storage.updateUserDeviceId(user.id, deviceId);
      
      res.json({ user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בהתחברות" });
    }
  });
  
  app.get("/api/auth/user", async (req, res) => {
    try {
      const { deviceId } = req.query;
      if (!deviceId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByDeviceId(deviceId as string);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-users", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת משתמשים ממתינים" });
    }
  });

  app.post("/api/admin/approve-user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const user = await storage.updateUserStatus(id, "approved", approvedBy);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "שגיאה באישור משתמש" });
    }
  });

  app.post("/api/admin/reject-user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const user = await storage.updateUserStatus(id, "rejected", approvedBy);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "שגיאה בדחיית משתמש" });
    }
  });

  // Questions routes
  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json({ question });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בשליחת השאלה" });
    }
  });

  app.get("/api/questions/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const questions = await storage.getQuestionsByUser(userId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלות" });
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלות" });
    }
  });

  app.get("/api/questions/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "נדרש מונח חיפוש" });
      }
      const questions = await storage.searchQuestions(q);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בחיפוש" });
    }
  });

  // Admin-only: Answer questions
  app.post("/api/admin/answers", requireAdmin, async (req, res) => {
    try {
      const answerData = insertAnswerSchema.parse({
        ...req.body,
        answeredBy: (req as any).adminUser?.fullName || (req as any).adminUser?.id || "מנהל"
      });
      const answer = await storage.createAnswer(answerData);
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Failed to create answer" });
    }
  });

  app.get("/api/answers/question/:questionId", async (req, res) => {
    try {
      const { questionId } = req.params;
      const answers = await storage.getAnswersByQuestion(questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת התשובות" });
    }
  });

  // News routes
  app.get("/api/news", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const news = limit ? await storage.getRecentNews(limit) : await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת החדשות" });
    }
  });

  // Admin-only: Create news
  app.post("/api/admin/news", requireAdmin, async (req, res) => {
    try {
      const newsData = insertNewsSchema.parse({
        ...req.body,
        createdBy: (req as any).adminUser?.id || "admin"
      });
      const news = await storage.createNews(newsData);
      res.json(news);
    } catch (error) {
      const errorMessage = error instanceof z.ZodError 
        ? error.errors.map(e => e.message).join(", ")
        : "Failed to create news";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Admin-only: Update news
  app.put("/api/admin/news/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const newsData = insertNewsSchema.parse(req.body);
      const news = await storage.updateNews(id, newsData);
      res.json(news);
    } catch (error) {
      res.status(400).json({ message: "Failed to update news" });
    }
  });

  // Admin-only: Delete news
  app.delete("/api/admin/news/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNews(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete news" });
    }
  });

  // Synagogues routes
  app.get("/api/synagogues", async (req, res) => {
    try {
      const synagogues = await storage.getAllSynagogues();
      res.json(synagogues);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת בתי הכנסת" });
    }
  });

  // Admin-only: Create synagogue
  app.post("/api/admin/synagogues", requireAdmin, async (req, res) => {
    try {
      const synagogueData = insertSynagogueSchema.parse(req.body);
      const synagogue = await storage.createSynagogue(synagogueData);
      res.json(synagogue);
    } catch (error) {
      res.status(400).json({ message: "Failed to create synagogue" });
    }
  });

  // Admin-only: Update synagogue
  app.put("/api/admin/synagogues/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const synagogueData = insertSynagogueSchema.parse(req.body);
      const synagogue = await storage.updateSynagogue(id, synagogueData);
      res.json(synagogue);
    } catch (error) {
      res.status(400).json({ message: "Failed to update synagogue" });
    }
  });

  // Admin-only: Delete synagogue
  app.delete("/api/admin/synagogues/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSynagogue(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete synagogue" });
    }
  });

  // Daily Halacha routes
  app.get("/api/daily-halacha", async (req, res) => {
    try {
      const halacha = await storage.getTodayHalacha();
      if (!halacha) {
        return res.status(404).json({ message: "לא נמצאה הלכה יומית" });
      }
      res.json(halacha);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת ההלכה היומית" });
    }
  });

  // Admin-only: Create daily halacha
  app.post("/api/admin/daily-halacha", requireAdmin, async (req, res) => {
    try {
      const halachaData = insertDailyHalachaSchema.parse({
        ...req.body,
        createdBy: (req as any).adminUser?.id || "admin"
      });
      const halacha = await storage.createDailyHalacha(halachaData);
      res.json(halacha);
    } catch (error) {
      res.status(400).json({ message: "Failed to create daily halacha" });
    }
  });

  // Admin-only: Update daily halacha
  app.put("/api/admin/daily-halacha/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const halachaData = insertDailyHalachaSchema.parse(req.body);
      const halacha = await storage.updateDailyHalacha(id, halachaData);
      res.json(halacha);
    } catch (error) {
      res.status(400).json({ message: "Failed to update daily halacha" });
    }
  });

  // Admin-only: Delete daily halacha
  app.delete("/api/admin/daily-halacha/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDailyHalacha(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete daily halacha" });
    }
  });

  // Videos routes
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת הסרטונים" });
    }
  });

  // Admin-only: Create video
  app.post("/api/admin/videos", requireAdmin, async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse({
        ...req.body,
        addedBy: (req as any).adminUser?.id || "admin"
      });
      const video = await storage.createVideo(videoData);
      res.json(video);
    } catch (error) {
      res.status(400).json({ message: "Failed to create video" });
    }
  });

  // Admin-only: Update video
  app.put("/api/admin/videos/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const videoData = insertVideoSchema.parse(req.body);
      const video = await storage.updateVideo(id, videoData);
      res.json(video);
    } catch (error) {
      res.status(400).json({ message: "Failed to update video" });
    }
  });

  // Admin-only: Delete video
  app.delete("/api/admin/videos/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVideo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete video" });
    }
  });

  // Jewish times API
  app.get("/api/jewish-times", async (req, res) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Real calculation for Jerusalem coordinates (31.7683, 35.2137)
      const latitude = 31.7683;
      const longitude = 35.2137;
      
      // Calculate sunrise and sunset (simplified calculation)
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const sunriseHour = 6 + Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
      const sunsetHour = 18 + Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
      
      const formatTime = (hour: number) => {
        const h = Math.floor(hour);
        const m = Math.floor((hour - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };
      
      const sunrise = formatTime(sunriseHour);
      const sunset = formatTime(sunsetHour);
      const shemaLatest = formatTime(sunriseHour + 3);
      const tefillaLatest = formatTime(sunriseHour + 4);
      
      const times = {
        sunrise,
        sunset,
        shabbatStart: formatTime(sunsetHour - 0.3),
        shabbatEnd: formatTime(sunsetHour + 1.17),
        shemaLatest,
        tefillaLatest,
        location: "ירושלים",
        date: todayStr
      };
      res.json(times);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת הזמנים" });
    }
  });

  // Contact route
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.json({ success: true, message: "ההודעה נשלחה בהצלחה", id: message.id });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בשליחת ההודעה" });
    }
  });

  // Admin route for contact messages
  app.get("/api/admin/contact-messages", async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת הודעות" });
    }
  });

  app.post("/api/admin/contact-messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.markContactMessageAsRead(id);
      res.json({ message });
    } catch (error) {
      res.status(500).json({ message: "שגיאה בעדכון הודעה" });
    }
  });

  // Enhanced Jewish Times API
  app.get("/api/jewish-times/detailed", async (req, res) => {
    try {
      // This is a placeholder for real Jewish times API integration
      const now = new Date();
      const location = "ירושלים, ישראל";
      
      res.json({
        location,
        date: now.toISOString().split('T')[0],
        dayOfWeek: now.toLocaleDateString('he-IL', { weekday: 'long' }),
        sunrise: "06:42",
        sunset: "17:30", 
        shacharit: "07:00",
        mincha: "13:15",
        maariv: "18:15",
        shabbatStart: now.getDay() === 5 ? "17:15" : undefined,
        shabbatEnd: now.getDay() === 6 ? "18:30" : undefined,
        candleLighting: now.getDay() === 5 ? "17:15" : undefined
      });
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת זמנים יהודיים" });
    }
  });

  // Admin check endpoint  
  app.post("/api/admin/check", async (req, res) => {
    try {
      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      // Find user by device ID
      const user = await storage.getUserByDeviceId(deviceId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.status !== "approved") {
        return res.status(401).json({ message: "User not approved" });
      }

      res.json({ 
        isAdmin: user.isAdmin,
        user: user
      });
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
