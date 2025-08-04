import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertAnswerSchema, insertNewsSchema, insertSynagogueSchema, insertDailyHalachaSchema, insertVideoSchema, insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes with Hebrew validation
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if device already registered
      if (userData.deviceId) {
        const existingUser = await storage.getUserByDeviceId(userData.deviceId);
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
      const { deviceId } = req.body;
      const user = await storage.getUserByDeviceId(deviceId);
      
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }

      res.json({ user });
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

  // Answers routes
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertAnswerSchema.parse(req.body);
      const answer = await storage.createAnswer(answerData);
      res.json({ answer });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בשליחת התשובה" });
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

  app.post("/api/news", async (req, res) => {
    try {
      const newsData = insertNewsSchema.parse(req.body);
      const news = await storage.createNews(newsData);
      res.json({ news });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בפרסום החדשה" });
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

  app.post("/api/synagogues", async (req, res) => {
    try {
      const synagogueData = insertSynagogueSchema.parse(req.body);
      const synagogue = await storage.createSynagogue(synagogueData);
      res.json({ synagogue });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בהוספת בית הכנסת" });
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

  app.post("/api/daily-halacha", async (req, res) => {
    try {
      const halachaData = insertDailyHalachaSchema.parse(req.body);
      const halacha = await storage.createDailyHalacha(halachaData);
      res.json({ halacha });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בהוספת הלכה יומית" });
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

  app.post("/api/videos", async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(videoData);
      res.json({ video });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בהוספת סרטון" });
    }
  });

  // Jewish times API proxy
  app.get("/api/jewish-times", async (req, res) => {
    try {
      const { city = "jerusalem" } = req.query;
      // This would typically call MyZmanim API
      // For now, return mock data structure
      const times = {
        sunrise: "06:42",
        sunset: "16:51",
        shabbatIn: "16:33",
        shabbatOut: "17:49",
        city: city as string,
        date: new Date().toISOString()
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

  const httpServer = createServer(app);
  return httpServer;
}
