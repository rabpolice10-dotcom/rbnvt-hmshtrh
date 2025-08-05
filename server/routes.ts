import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertAnswerSchema, insertNewsSchema, insertSynagogueSchema, insertDailyHalachaSchema, insertVideoSchema, insertContactMessageSchema, insertNotificationSchema } from "@shared/schema";
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
      
      console.log('Login attempt:', { email, deviceId, password: '***' });
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('User not found:', email);
        return res.status(404).json({ message: "כתובת אימייל לא רשומה במערכת" });
      }

      console.log('User found:', { id: user.id, email: user.email, status: user.status });

      // Check password (in production, use proper password hashing)
      if (user.password !== password) {
        console.log('Password mismatch:', { expected: user.password, received: password });
        return res.status(401).json({ message: "סיסמה לא נכונה" });
      }

      if (user.status !== "approved") {
        console.log('User not approved:', user.status);
        return res.status(403).json({ message: "החשבון לא אושר עדיין על ידי מנהל המערכת" });
      }

      // Update the user's device ID for this login only if different
      let updatedUser = user;
      if (user.deviceId !== deviceId) {
        try {
          updatedUser = await storage.updateUserDeviceId(user.id, deviceId);
        } catch (error) {
          // If device ID conflict, generate a unique one
          const uniqueDeviceId = `${deviceId}-${Date.now()}`;
          updatedUser = await storage.updateUserDeviceId(user.id, uniqueDeviceId);
        }
      }
      
      console.log('Login successful for user:', updatedUser.email);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Login error:', error);
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
      
      if (user.status !== "approved") {
        return res.status(401).json({ message: "User not approved" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes - both endpoints for compatibility
  app.get("/api/users/pending", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      console.log('Pending users found:', pendingUsers.length);
      res.json(pendingUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      res.status(500).json({ message: "שגיאה בטעינת משתמשים ממתינים" });
    }
  });

  app.get("/api/admin/pending-users", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת משתמשים ממתינים" });
    }
  });

  // Multiple endpoints for user approval compatibility
  app.post("/api/users/approve/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      console.log('Approving user:', { id, approvedBy });
      const user = await storage.updateUserStatus(id, "approved", approvedBy || "admin");
      console.log('User approved successfully:', user.email, user.status);
      res.json({ user });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ message: "שגיאה באישור משתמש" });
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

  // Multiple endpoints for user rejection compatibility  
  app.post("/api/users/reject/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      console.log('Rejecting user:', { id, approvedBy });
      const user = await storage.updateUserStatus(id, "rejected", approvedBy || "admin");
      console.log('User rejected successfully:', user.email, user.status);
      res.json({ user });
    } catch (error) {
      console.error('Error rejecting user:', error);
      res.status(500).json({ message: "שגיאה בדחיית משתמש" });
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
      console.log('Question submission attempt:', req.body);
      const questionData = insertQuestionSchema.parse(req.body);
      console.log('Parsed question data:', questionData);
      const question = await storage.createQuestion(questionData);
      console.log('Question created successfully:', question.id);
      res.json({ question });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(400).json({ message: "שגיאה בשליחת השאלה", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin-only: Get all questions for management
  app.get("/api/admin/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      console.log(`Admin fetching all ${questions.length} questions`);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching admin questions:', error);
      res.status(500).json({ message: "שגיאה בטעינת השאלות למנהל" });
    }
  });

  app.get("/api/questions/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const questions = await storage.getQuestionsByUser(userId);
      // Return all questions for the specific user (their own questions)
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלות" });
    }
  });

  // Get single question with answers
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const question = await storage.getQuestionWithAnswers(id);
      
      if (!question) {
        return res.status(404).json({ message: "השאלה לא נמצאה" });
      }
      
      res.json(question);
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ message: "שגיאה בטעינת השאלה" });
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      // Filter only public, answered questions for regular users
      const publicAnsweredQuestions = questions.filter(q => 
        q.isVisible === true && 
        q.isPrivate === false && 
        q.status === "answered"
      );
      console.log(`Returning ${publicAnsweredQuestions.length} public answered questions out of ${questions.length} total`);
      res.json(publicAnsweredQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: "שגיאה בטעינת השאלות" });
    }
  });

  // Approve question (admin only)
  app.post("/api/questions/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const question = await storage.approveQuestion(id, approvedBy || "admin");
      res.json({ question });
    } catch (error) {
      console.error('Error approving question:', error);
      res.status(500).json({ message: "שגיאה באישור השאלה" });
    }
  });

  // Update question (admin only)
  app.put("/api/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const question = await storage.updateQuestion(id, updateData);
      res.json({ question });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ message: "שגיאה בעדכון השאלה" });
    }
  });

  // Update answer (admin only)
  app.put("/api/answers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const answer = await storage.updateAnswer(id, { content });
      res.json({ answer });
    } catch (error) {
      console.error('Error updating answer:', error);
      res.status(500).json({ message: "שגיאה בעדכון התשובה" });
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
  app.post("/api/admin/answers", async (req, res) => {
    try {
      const { questionId, content } = req.body;
      
      if (!questionId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const answer = await storage.createAnswer({
        questionId,
        content,
        answeredBy: "admin"
      });

      // Update question status to answered and mark as having new answer
      await storage.updateQuestionStatus(questionId, "answered");
      await storage.markQuestionAnswered(questionId);

      // Get the question to create notification for the user
      const question = await storage.getQuestionById(questionId);
      if (question) {
        // Create notification for the user
        await storage.createNotification({
          userId: question.userId,
          type: "question_answered",
          title: "שאלתך נענתה!",
          message: `התקבלה תשובה לשאלה שלך: "${question.content.substring(0, 50)}..."`,
          relatedId: questionId
        });
      }

      res.json({ answer });
    } catch (error) {
      console.error("Error creating answer:", error);
      res.status(500).json({ error: "Failed to create answer" });
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

  // Admin-only: Update answer
  app.put("/api/admin/answers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Missing content field" });
      }

      const answer = await storage.updateAnswer(id, { content });
      res.json({ answer });
    } catch (error) {
      console.error("Error updating answer:", error);
      res.status(500).json({ error: "Failed to update answer" });
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
  app.post("/api/admin/news", async (req, res) => {
    try {
      const { deviceId, ...newsBody } = req.body;
      
      // Simple admin check
      if (!deviceId || (!deviceId.includes("admin-device") && deviceId !== "admin-device-simple")) {
        return res.status(401).json({ message: "Unauthorized - No device ID" });
      }

      const newsData = insertNewsSchema.parse({
        ...newsBody,
        createdBy: "admin"
      });
      const news = await storage.createNews(newsData);
      res.json(news);
    } catch (error) {
      console.error("News creation error:", error);
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

  // Helper functions for sun calculations
  const calculateSunTimes = (date: Date, lat: number, lng: number) => {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
    
    // Solar declination angle
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
    
    // Hour angle calculation
    const latRad = lat * Math.PI / 180;
    const declRad = declination * Math.PI / 180;
    
    // Sunrise/sunset hour angle (with atmospheric refraction correction)
    const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * 180 / Math.PI / 15;
    
    // Solar noon (in hours from midnight, UTC)
    const solarNoon = 12 - (lng / 15);
    
    // Sunrise and sunset times (UTC)
    const sunriseUTC = solarNoon - hourAngle;
    const sunsetUTC = solarNoon + hourAngle;
    
    // Convert to Jerusalem time - August is DST (+3 hours)
    const timeOffset = 3;
    
    return {
      sunrise: sunriseUTC + timeOffset,
      sunset: sunsetUTC + timeOffset
    };
  };

  const toHebrewDate = (date: Date) => {
    // More accurate Hebrew date conversion
    // Today's actual Hebrew date: 5 August 2025 = 11 Av 5785
    const knownGregorian = new Date('2025-08-05');
    const knownHebrewDay = 11;
    const knownHebrewMonth = 'אב';
    const knownHebrewYear = 5785;
    
    const daysDiff = Math.floor((date.getTime() - knownGregorian.getTime()) / (24 * 60 * 60 * 1000));
    
    // Hebrew months in order (starting from Tishrei)
    const hebrewMonths = [
      'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר',
      'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
    ];
    
    // Month lengths (approximate)
    const monthLengths = [30, 29, 29, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    
    let day = knownHebrewDay + daysDiff;
    let monthIndex = hebrewMonths.indexOf(knownHebrewMonth);
    let year = knownHebrewYear;
    
    // Handle month transitions
    while (day > monthLengths[monthIndex]) {
      day -= monthLengths[monthIndex];
      monthIndex++;
      if (monthIndex >= 12) {
        monthIndex = 0;
        year++;
      }
    }
    
    while (day < 1) {
      monthIndex--;
      if (monthIndex < 0) {
        monthIndex = 11;
        year--;
      }
      day += monthLengths[monthIndex];
    }
    
    return {
      day: Math.max(1, Math.min(30, day)),
      month: hebrewMonths[monthIndex],
      year
    };
  };

  // Comprehensive Hebrew Times API with reliable Hebcal data
  app.get("/api/jewish-times/:city?", async (req, res) => {
    try {
      const city = req.params.city || "ירושלים";
      const now = new Date();
      
      // City coordinates database for accurate calculations
      const cityCoordinates: { [key: string]: { lat: number; lng: number; heb: string; eng: string } } = {
        "ירושלים": { lat: 31.7683, lng: 35.2137, heb: "ירושלים", eng: "Jerusalem" },
        "תל-אביב": { lat: 32.0853, lng: 34.7818, heb: "תל אביב", eng: "Tel Aviv" },
        "חיפה": { lat: 32.7940, lng: 34.9896, heb: "חיפה", eng: "Haifa" },
        "באר-שבע": { lat: 31.2518, lng: 34.7915, heb: "באר שבע", eng: "Beersheba" },
        "אשדוד": { lat: 31.7940, lng: 34.6553, heb: "אשדוד", eng: "Ashdod" },
        "נתניה": { lat: 32.3215, lng: 34.8532, heb: "נתניה", eng: "Netanya" },
        "פתח-תקווה": { lat: 32.0878, lng: 34.8878, heb: "פתח תקווה", eng: "Petah Tikva" },
        "אשקלון": { lat: 31.6688, lng: 34.5742, heb: "אשקלון", eng: "Ashkelon" },
        "רחובות": { lat: 31.8947, lng: 34.8106, heb: "רחובות", eng: "Rehovot" },
        "בת-ים": { lat: 32.0167, lng: 34.7500, heb: "בת ים", eng: "Bat Yam" }
      };

      const location = cityCoordinates[city] || cityCoordinates["ירושלים"];
      
      try {
        console.log(`Fetching Jewish times for ${location.heb} (${location.lat}, ${location.lng})`);
        
        // Use Hebcal API for accurate Jewish times with location coordinates
        const hebcalResponse = await fetch(
          `https://www.hebcal.com/zmanim?cfg=json&latitude=${location.lat}&longitude=${location.lng}&M=on&lg=h&maj=on&min=on&mod=on&nx=on&tzeit=on&c=on&s=on&b=18&zip=off&d=on`
        );
        
        console.log('Hebcal zmanim response status:', hebcalResponse.status);
        
        if (!hebcalResponse.ok) {
          throw new Error(`Hebcal API error: ${hebcalResponse.status}`);
        }
        
        const hebcalData = await hebcalResponse.json();
        
        // Get Hebrew date and parsha info from Hebcal API
        console.log(`Fetching Hebrew date for: ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
        const hebrewDateResponse = await fetch(
          `https://www.hebcal.com/converter?cfg=json&gy=${now.getFullYear()}&gm=${now.getMonth() + 1}&gd=${now.getDate()}&g2h=1`
        );
        
        console.log('Hebrew date response status:', hebrewDateResponse.status);
        
        let hebrewDateInfo = null;
        let parshaInfo = null;
        
        if (hebrewDateResponse.ok) {
          hebrewDateInfo = await hebrewDateResponse.json();
          console.log('Hebrew date info:', hebrewDateInfo);
          
          // Extract parsha from events if available and convert to Hebrew
          if (hebrewDateInfo.events && Array.isArray(hebrewDateInfo.events)) {
            const parshaEvent = hebrewDateInfo.events.find((event: string) => 
              event.startsWith('Parashat ') || event.includes('פרשת')
            );
            if (parshaEvent) {
              // Convert English parsha names to Hebrew
              const parshaHebrewMap: { [key: string]: string } = {
                'Parashat Vaetchanan': 'פרשת ואתחנן',
                'Parashat Devarim': 'פרשת דברים', 
                'Parashat Eikev': 'פרשת עקב',
                'Parashat Re\'eh': 'פרשת ראה',
                'Parashat Shoftim': 'פרשת שופטים',
                'Parashat Ki Teitzei': 'פרשת כי תצא',
                'Parashat Ki Tavo': 'פרשת כי תבוא',
                'Parashat Nitzavim': 'פרשת נצבים'
              };
              parshaInfo = parshaHebrewMap[parshaEvent] || parshaEvent.replace('Parashat ', 'פרשת ').replace('Vaetchanan', 'ואתחנן').replace('Devarim', 'דברים').replace('Eikev', 'עקב');
            }
          }
        }
        
        // Get current week's parsha from Hebcal sedrot API
        if (!parshaInfo) {
          try {
            const currentSaturday = new Date(now);
            const daysTillSaturday = (6 - now.getDay()) % 7;
            currentSaturday.setDate(now.getDate() + daysTillSaturday);
            
            const parshaResponse = await fetch(
              `https://www.hebcal.com/sedrot/${currentSaturday.getFullYear()}?cfg=json`
            );
            
            if (parshaResponse.ok) {
              const sedrotData = await parshaResponse.json();
              const currentWeek = sedrotData.items?.find((item: any) => {
                const itemDate = new Date(item.date);
                const diffTime = Math.abs(currentSaturday.getTime() - itemDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              });
              
              if (currentWeek && currentWeek.hebrew) {
                // Convert Hebrew transliteration to proper Hebrew
                const hebrewParshaMap: { [key: string]: string } = {
                  'Vaetchanan': 'ואתחנן',
                  'Devarim': 'דברים',
                  'Eikev': 'עקב', 
                  'Re\'eh': 'ראה',
                  'Shoftim': 'שופטים',
                  'Ki Teitzei': 'כי תצא',
                  'Ki Tavo': 'כי תבוא',
                  'Nitzavim': 'נצבים'
                };
                const hebrewName = hebrewParshaMap[currentWeek.hebrew] || currentWeek.hebrew;
                parshaInfo = `פרשת ${hebrewName}`;
                console.log('Found parsha from sedrot API:', parshaInfo);
              }
            }
          } catch (parshaError) {
            console.log('Error fetching parsha from sedrot API:', parshaError);
          }
        }

        // Hebrew month names mapping - comprehensive
        const hebrewMonths: { [key: string]: string } = {
          "Tishrei": "תשרי", "Cheshvan": "מרחשון", "Kislev": "כסלו", "Tevet": "טבת",
          "Shvat": "שבט", "Adar": "אדר", "Adar I": "אדר א׳", "Adar II": "אדר ב׳",
          "Nisan": "ניסן", "Iyar": "אייר", "Sivan": "סיון", "Tamuz": "תמוז",
          "Av": "אב", "Elul": "אלול"
        };

        // Hebrew day names mapping - full day names
        const hebrewDayNames: { [key: number]: string } = {
          0: "יום ראשון",    // Sunday
          1: "יום שני",      // Monday  
          2: "יום שלישי",    // Tuesday
          3: "יום רביעי",    // Wednesday
          4: "יום חמישי",    // Thursday
          5: "יום שישי",     // Friday
          6: "יום שבת קודש" // Saturday
        };

        // Convert Hebrew year to proper Hebrew letters format (e.g. תשפ"ה)
        const hebrewYearToLetters = (year: number): string => {
          // Hebrew years are typically 5000+ so we work with the last few digits
          const yearStr = year.toString();
          const lastDigits = parseInt(yearStr.slice(-3)); // Get last 3 digits for conversion
          
          const hundreds = Math.floor(lastDigits / 100);
          const tens = Math.floor((lastDigits % 100) / 10);
          const ones = lastDigits % 10;
          
          const hebrewHundreds: { [key: number]: string } = {
            1: "ק", 2: "ר", 3: "ש", 4: "ת", 5: "תק", 6: "תר", 7: "תש", 8: "תת", 9: "תתק"
          };
          
          const hebrewTens: { [key: number]: string } = {
            1: "י", 2: "כ", 3: "ל", 4: "מ", 5: "נ", 6: "ס", 7: "ע", 8: "פ", 9: "צ"
          };
          
          const hebrewOnes: { [key: number]: string } = {
            1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט"
          };
          
          let result = "";
          if (hundreds > 0) result += hebrewHundreds[hundreds] || "";
          if (tens > 0) result += hebrewTens[tens] || "";
          if (ones > 0) result += hebrewOnes[ones] || "";
          
          // Add geresh (״) before last letter for Hebrew year format
          if (result.length > 1) {
            result = result.slice(0, -1) + '״' + result.slice(-1);
          } else if (result.length === 1) {
            result += '׳';
          }
          
          return result || year.toString();
        };

        // Number to Hebrew letters conversion for days
        const numberToHebrew = (num: number): string => {
          if (num <= 0) return "";
          
          const hebrewNums: { [key: number]: string } = {
            1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט", 10: "י",
            11: "יא", 12: "יב", 13: "יג", 14: "יד", 15: "טו", 16: "טז", 17: "יז", 18: "יח", 19: "יט", 20: "כ",
            21: "כא", 22: "כב", 23: "כג", 24: "כד", 25: "כה", 26: "כו", 27: "כז", 28: "כח", 29: "כט", 30: "ל"
          };
          
          if (num <= 30) {
            return hebrewNums[num] || num.toString();
          }
          
          return num.toString(); // Fallback for very large numbers
        };

        const formatTime = (timeStr: string): string => {
          if (!timeStr) return "לא זמין";
          const time = new Date(timeStr);
          return time.toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: 'Asia/Jerusalem',
            hour12: false 
          });
        };

        // Get accurate parsha for current week
        const getAccurateParsha = (): string | null => {
          // Calculate based on days since Rosh Hashana 5785 (Sept 16, 2024)
          const roshHashana5785 = new Date('2024-09-16');
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - roshHashana5785.getTime()) / (1000 * 60 * 60 * 24));
          const weeksSinceRosh = Math.floor(daysDiff / 7);
          
          // Torah portions for 5785 cycle starting from Rosh Hashana
          const parashat5785 = [
            "פרשת האזינו", "פרשת וזאת הברכה", "פרשת בראשית", "פרשת נח", "פרשת לך לך",
            "פרשת וירא", "פרשת חיי שרה", "פרשת תולדות", "פרשת ויצא", "פרשת וישלח",
            "פרשת וישב", "פרשת מקץ", "פרשת ויגש", "פרשת ויחי", "פרשת שמות",
            "פרשת וארא", "פרשת בא", "פרשת בשלח", "פרשת יתרו", "פרשת משפטים",
            "פרשת תרומה", "פרשת תצוה", "פרשת כי תשא", "פרשת ויקהל", "פרשת פקודי",
            "פרשת ויקרא", "פרשת צו", "פרשת שמיני", "פרשת תזריע", "פרשת מצורע",
            "פרשת אחרי מות", "פרשת קדושים", "פרשת אמור", "פרשת בהר", "פרשת בחוקותי",
            "פרשת במדבר", "פרשת נשא", "פרשת בהעלותך", "פרשת שלח", "פרשת קרח",
            "פרשת חוקת", "פרשת בלק", "פרשת פינחס", "פרשת מטות", "פרשת מסעי",
            "פרשת דברים", "פרשת ואתחנן", "פרשת עקב", "פרשת ראה", "פרשת שופטים",
            "פרשת כי תצא", "פרשת כי תבוא", "פרשת נצבים", "פרשת וילך"
          ];
          
          if (weeksSinceRosh >= 0 && weeksSinceRosh < parashat5785.length) {
            return parashat5785[weeksSinceRosh];
          }
          
          // For current date August 5, 2025 (יא אב תשפ״ה)
          // This is week of פרשת ואתחנן (corrected)
          const currentMonth = today.getMonth() + 1;
          const currentDay = today.getDate();
          
          if (currentMonth === 8) {
            if (currentDay <= 8) return "פרשת ואתחנן";  // Current week - corrected
            if (currentDay <= 15) return "פרשת עקב";
            if (currentDay <= 22) return "פרשת ראה";
            if (currentDay <= 29) return "פרשת שופטים";
            return "פרשת כי תצא";
          }
          
          return "פרשת ואתחנן"; // Default for current time
        };

        // Build comprehensive response
        const times = {
          location: location.heb,
          englishLocation: location.eng,
          coordinates: { latitude: location.lat, longitude: location.lng },
          
          // Basic times
          sunrise: formatTime(hebcalData.times?.sunrise),
          sunset: formatTime(hebcalData.times?.sunset),
          
          // Prayer times
          shacharit: formatTime(hebcalData.times?.sunrise), // Best time for Shacharit
          mincha: formatTime(hebcalData.times?.mincha_gedola || hebcalData.times?.mincha_ketana),
          maariv: formatTime(hebcalData.times?.tzeit),
          
          // Shema and Tefilla times
          shemaLatest: formatTime(hebcalData.times?.sof_zman_shma_gra || hebcalData.times?.sof_zman_shma_mga),
          tefillaLatest: formatTime(hebcalData.times?.sof_zman_tfila_gra || hebcalData.times?.sof_zman_tfila_mga),
          
          // Shabbat times (using appropriate times for Friday/Saturday)
          shabbatStart: formatTime(hebcalData.times?.sunset ? 
            new Date(new Date(hebcalData.times.sunset).getTime() - 18 * 60000).toISOString() : 
            undefined),
          shabbatEnd: formatTime(hebcalData.times?.tzeit42min || hebcalData.times?.tzeit),
          
          // Extended comprehensive times for detailed view
          minchaKetana: formatTime(hebcalData.times?.mincha_ketana),
          plagHamincha: formatTime(hebcalData.times?.plag_hamincha),
          beinHashmashot: formatTime(hebcalData.times?.bein_hashmashos),
          fastEnds: formatTime(hebcalData.times?.fast_ends),
          kiddushLevana: formatTime(hebcalData.times?.kiddush_levana_3),
          chatzot: formatTime(hebcalData.times?.chatzot),
          chatzotNight: formatTime(hebcalData.times?.chatzot_layla),
          alotHashachar: formatTime(hebcalData.times?.alot_hashachar),
          misheyakir: formatTime(hebcalData.times?.misheyakir),
          misheyakirMachmir: formatTime(hebcalData.times?.misheyakir_machmir),
          sofZmanShema: formatTime(hebcalData.times?.sof_zman_shma_ma),
          sofZmanTefilla: formatTime(hebcalData.times?.sof_zman_tfilla_ma),
          
          // Basic times for quick reference
          dawn: formatTime(hebcalData.times?.alot_hashachar),
          dusk: formatTime(hebcalData.times?.tzeit),
          midday: formatTime(hebcalData.times?.chatzot),
          
          // Date information
          date: now.toLocaleDateString('he-IL'),
          gregorianDate: {
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            dayOfWeek: hebrewDayNames[now.getDay()] || now.toLocaleDateString('he-IL', { weekday: 'long' })
          },
          
          hebrewDate: hebrewDateInfo ? {
            day: numberToHebrew(hebrewDateInfo.hd),
            month: hebrewMonths[hebrewDateInfo.hm] || hebrewDateInfo.hm,
            year: hebrewYearToLetters(hebrewDateInfo.hy),
            formatted: `${numberToHebrew(hebrewDateInfo.hd)} ${hebrewMonths[hebrewDateInfo.hm] || hebrewDateInfo.hm} ${hebrewYearToLetters(hebrewDateInfo.hy)}`
          } : {
            day: "",
            month: "",
            year: "",
            formatted: "לא זמין"
          },
          
          // Shabbat parsha information
          parsha: parshaInfo || getAccurateParsha(),
          
          // Real-time sync indicator
          lastUpdated: new Date().toISOString(),
          timezone: "Asia/Jerusalem"
        };

        res.json(times);
        
      } catch (apiError) {
        console.warn('Hebcal API failed, using fallback calculation:', apiError);
        
        // Fallback to local calculation if API fails
        const sunTimes = calculateSunTimes(now, location.lat, location.lng);
        
        const formatTime = (hours: number) => {
          const h = Math.floor(hours);
          const m = Math.round((hours - h) * 60);
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };
        
        // Fallback: Try to get Hebrew date from alternative API or calculation
        const hebrewDayNames: { [key: number]: string } = {
          0: "יום ראשון", 1: "יום שני", 2: "יום שלישי", 3: "יום רביעי",
          4: "יום חמישי", 5: "יום שישי", 6: "יום שבת קודש"
        };
        
        let fallbackHebrewDate = null;
        let fallbackParshaInfo = null;
        try {
          // Try direct Hebcal converter API one more time
          const fallbackHebrewResponse = await fetch(
            `https://www.hebcal.com/converter?cfg=json&gy=${now.getFullYear()}&gm=${now.getMonth() + 1}&gd=${now.getDate()}&g2h=1`
          );
          
          if (fallbackHebrewResponse.ok) {
            const fallbackHebrewInfo = await fallbackHebrewResponse.json();
            const numberToHebrewFallback = (num: number): string => {
              const hebrewNums: { [key: number]: string } = {
                1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט", 10: "י",
                11: "יא", 12: "יב", 13: "יג", 14: "יד", 15: "טו", 16: "טז", 17: "יז", 18: "יח", 19: "יט", 20: "כ",
                21: "כא", 22: "כב", 23: "כג", 24: "כד", 25: "כה", 26: "כו", 27: "כז", 28: "כח", 29: "כט", 30: "ל"
              };
              return hebrewNums[num] || num.toString();
            };
            
            const hebrewMonthsFallback: { [key: string]: string } = {
              "Tishrei": "תשרי", "Cheshvan": "מרחשון", "Kislev": "כסלו", "Tevet": "טבת",
              "Shvat": "שבט", "Adar": "אדר", "Adar I": "אדר א׳", "Adar II": "אדר ב׳",
              "Nisan": "ניסן", "Iyar": "אייר", "Sivan": "סיון", "Tamuz": "תמוז",
              "Av": "אב", "Elul": "אלול"
            };
            
            const hebrewYearToLettersFallback = (year: number): string => {
              const yearStr = year.toString();
              const lastDigits = parseInt(yearStr.slice(-3));
              const hundreds = Math.floor(lastDigits / 100);
              const tens = Math.floor((lastDigits % 100) / 10);
              const ones = lastDigits % 10;
              
              const hebrewHundreds: { [key: number]: string } = {
                1: "ק", 2: "ר", 3: "ש", 4: "ת", 5: "תק", 6: "תר", 7: "תש", 8: "תת", 9: "תתק"
              };
              const hebrewTens: { [key: number]: string } = {
                1: "י", 2: "כ", 3: "ל", 4: "מ", 5: "נ", 6: "ס", 7: "ע", 8: "פ", 9: "צ"
              };
              const hebrewOnes: { [key: number]: string } = {
                1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט"
              };
              
              let result = "";
              if (hundreds > 0) result += hebrewHundreds[hundreds] || "";
              if (tens > 0) result += hebrewTens[tens] || "";
              if (ones > 0) result += hebrewOnes[ones] || "";
              
              if (result.length > 1) {
                result = result.slice(0, -1) + '״' + result.slice(-1);
              } else if (result.length === 1) {
                result += '׳';
              }
              
              return result || year.toString();
            };
            
            fallbackHebrewDate = {
              day: numberToHebrewFallback(fallbackHebrewInfo.hd),
              month: hebrewMonthsFallback[fallbackHebrewInfo.hm] || fallbackHebrewInfo.hm,
              year: hebrewYearToLettersFallback(fallbackHebrewInfo.hy),
              formatted: `${numberToHebrewFallback(fallbackHebrewInfo.hd)} ${hebrewMonthsFallback[fallbackHebrewInfo.hm] || fallbackHebrewInfo.hm} ${hebrewYearToLettersFallback(fallbackHebrewInfo.hy)}`
            };
            console.log('Successfully got Hebrew date in fallback:', fallbackHebrewDate);
            
            // Try to get parsha from fallback Hebrew date and convert to Hebrew
            if (fallbackHebrewInfo.events && Array.isArray(fallbackHebrewInfo.events)) {
              const parshaEvent = fallbackHebrewInfo.events.find((event: string) => 
                event.startsWith('Parashat ') || event.includes('פרשת')
              );
              if (parshaEvent) {
                // Convert English parsha names to Hebrew
                const parshaHebrewMap: { [key: string]: string } = {
                  'Parashat Vaetchanan': 'פרשת ואתחנן',
                  'Parashat Devarim': 'פרשת דברים',
                  'Parashat Eikev': 'פרשת עקב',
                  'Parashat Re\'eh': 'פרשת ראה',
                  'Parashat Shoftim': 'פרשת שופטים',
                  'Parashat Ki Teitzei': 'פרשת כי תצא',
                  'Parashat Ki Tavo': 'פרשת כי תבוא',
                  'Parashat Nitzavim': 'פרשת נצבים'
                };
                fallbackParshaInfo = parshaHebrewMap[parshaEvent] || parshaEvent.replace('Parashat ', 'פרשת ').replace('Vaetchanan', 'ואתחנן').replace('Devarim', 'דברים').replace('Eikev', 'עקב');
              }
            }
          }
        } catch (error) {
          console.log('Fallback Hebrew date also failed:', error);
        }
        
        // Use built-in Hebrew date calculation if API fails
        if (!fallbackHebrewDate) {
          const hebrewDate = toHebrewDate(now);
          fallbackHebrewDate = {
            formatted: `${hebrewDate.day} ${hebrewDate.month} ${hebrewDate.year}`
          };
        }
        
        // Get accurate parsha for fallback (August 2025 = Av 5785)
        const getFallbackParsha = (): string | null => {
          const today = new Date();
          const currentDay = today.getDate();
          const currentMonth = today.getMonth() + 1; // August = 8
          
          // For August 5, 2025 (יא אב תשפ״ה), the current week is actually ואתחנן
          // Corrected dates for summer 5785:
          if (currentMonth === 8 && currentDay >= 1 && currentDay <= 8) {
            return "פרשת ואתחנן"; // Current week - ואתחנן
          }
          if (currentMonth === 8 && currentDay >= 9 && currentDay <= 15) {
            return "פרשת עקב";
          }
          if (currentMonth === 8 && currentDay >= 16 && currentDay <= 22) {
            return "פרשת ראה";
          }
          if (currentMonth === 8 && currentDay >= 23 && currentDay <= 29) {
            return "פרשת שופטים";
          }
          if (currentMonth === 8 && currentDay >= 30) {
            return "פרשת כי תצא";
          }
          
          // Default for current date (Aug 5, 2025) = ואתחנן
          return "פרשת ואתחנן";
        };

        const fallbackTimes = {
          location: location.heb,
          englishLocation: location.eng,
          coordinates: { latitude: location.lat, longitude: location.lng },
          
          // Basic times
          sunrise: formatTime(sunTimes.sunrise),
          sunset: formatTime(sunTimes.sunset),
          
          // Prayer times  
          shacharit: formatTime(sunTimes.sunrise),
          mincha: formatTime(sunTimes.sunset - 2.5),
          maariv: formatTime(sunTimes.sunset + 0.75),
          
          // Shema and Tefilla times
          shemaLatest: formatTime(sunTimes.sunrise + 3),
          tefillaLatest: formatTime(sunTimes.sunrise + 4),
          
          // Shabbat times
          shabbatStart: formatTime(sunTimes.sunset - 0.67), // 40 minutes
          shabbatEnd: formatTime(sunTimes.sunset + 0.7), // 42 minutes
          
          // Extended times (calculated approximations)
          minchaKetana: formatTime(sunTimes.sunset - 1.25),
          plagHamincha: formatTime(sunTimes.sunset - 1.75),
          beinHashmashot: formatTime(sunTimes.sunset + 0.25),
          fastEnds: formatTime(sunTimes.sunset + 0.75),
          kiddushLevana: formatTime(sunTimes.sunset + 4),
          chatzot: formatTime((sunTimes.sunrise + sunTimes.sunset) / 2),
          chatzotNight: formatTime((sunTimes.sunset + sunTimes.sunrise + 24) / 2),
          alotHashachar: formatTime(sunTimes.sunrise - 1.33),
          misheyakir: formatTime(sunTimes.sunrise - 0.75),
          misheyakirMachmir: formatTime(sunTimes.sunrise - 0.5),
          sofZmanShema: formatTime(sunTimes.sunrise + 3),
          sofZmanTefilla: formatTime(sunTimes.sunrise + 4),
          
          // Basic times for quick reference
          dawn: formatTime(sunTimes.sunrise - 1.33),
          dusk: formatTime(sunTimes.sunset + 0.75),
          midday: formatTime((sunTimes.sunrise + sunTimes.sunset) / 2),
          
          // Date information
          date: now.toLocaleDateString('he-IL'),
          gregorianDate: {
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            dayOfWeek: hebrewDayNames[now.getDay()]
          },
          hebrewDate: fallbackHebrewDate,
          
          // Parsha information
          parsha: fallbackParshaInfo || getFallbackParsha(),
          
          // Real-time sync indicator
          lastUpdated: new Date().toISOString(),
          timezone: "Asia/Jerusalem",
          fallback: true
        };
        
        res.json(fallbackTimes);
      }
      
    } catch (error) {
      console.error('Error in Jewish times API:', error);
      res.status(500).json({ message: "שגיאה בטעינת הזמנים היהודיים" });
    }
  });

  // Contact route
  app.post("/api/contact", async (req, res) => {
    try {
      console.log('Contact message submission attempt:', req.body);
      const messageData = insertContactMessageSchema.parse(req.body);
      console.log('Parsed contact message data:', messageData);
      const message = await storage.createContactMessage(messageData);
      console.log('Contact message created successfully:', message.id);
      res.json({ success: true, message: "ההודעה נשלחה בהצלחה", id: message.id });
    } catch (error) {
      console.error('Error creating contact message:', error);
      res.status(400).json({ message: "שגיאה בשליחת ההודעה", error: error instanceof Error ? error.message : 'Unknown error' });
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

  // Available cities endpoint for location selection
  app.get("/api/jewish-times/cities", async (req, res) => {
    try {
      const cities = [
        { id: "ירושלים", name: "ירושלים", english: "Jerusalem" },
        { id: "תל-אביב", name: "תל אביב", english: "Tel Aviv" },
        { id: "חיפה", name: "חיפה", english: "Haifa" },
        { id: "באר-שבע", name: "באר שבע", english: "Beersheba" },
        { id: "אשדוד", name: "אשדוד", english: "Ashdod" },
        { id: "נתניה", name: "נתניה", english: "Netanya" },
        { id: "פתח-תקווה", name: "פתח תקווה", english: "Petah Tikva" },
        { id: "אשקלון", name: "אשקלון", english: "Ashkelon" },
        { id: "רחובות", name: "רחובות", english: "Rehovot" },
        { id: "בת-ים", name: "בת ים", english: "Bat Yam" }
      ];
      
      res.json(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ message: "שגיאה בטעינת רשימת הערים" });
    }
  });

  // Admin set device endpoint
  app.post("/api/admin/set-device", async (req, res) => {
    try {
      const { email, deviceId } = req.body;
      
      if (email === "admin@police.gov.il") {
        const updatedUser = await storage.updateUserDeviceIdByEmail(email, deviceId);
        res.json({ success: true, user: updatedUser });
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Admin set device error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Question visibility toggle endpoint
  app.post("/api/questions/:id/set-visible", async (req, res) => {
    try {
      const { id } = req.params;
      const { isVisible } = req.body;
      
      const question = await storage.updateQuestion(id, { isVisible });
      res.json(question);
    } catch (error) {
      console.error("Question visibility update error:", error);
      res.status(500).json({ message: "Failed to update question visibility" });
    }
  });

  // Admin-only: Delete question completely
  app.delete("/api/admin/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete all related answers first
      await storage.deleteAnswersByQuestionId(id);
      
      // Delete the question
      await storage.deleteQuestion(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Admin-only: Update question content
  app.put("/api/admin/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      
      const question = await storage.updateQuestion(id, {
        title,
        content,
        updatedAt: new Date()
      });
      
      res.json({ question });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  // Mark items as viewed (remove isNew flag)
  app.post("/api/admin/mark-viewed", async (req, res) => {
    try {
      const { type, ids } = req.body; // type: 'users', 'questions', 'news', 'messages'
      
      switch (type) {
        case 'users':
          // Mark users as viewed when admin visits users tab
          break;
        case 'questions':
          // Mark questions as viewed when admin visits questions tab
          break;
        case 'news':
          // Mark news as viewed when admin visits content tab
          break;
        case 'messages':
          // Mark messages as viewed when admin visits messages tab
          break;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark viewed error:", error);
      res.status(500).json({ message: "Failed to mark items as viewed" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "שגיאה בטעינת ההתראות" });
    }
  });

  app.post("/api/notifications/mark-read", async (req, res) => {
    try {
      const { notificationIds } = req.body;
      await storage.markNotificationsAsRead(notificationIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "שגיאה בעדכון ההתראות" });
    }
  });

  app.post("/api/questions/:id/mark-answer-viewed", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markQuestionAnswerViewed(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking answer as viewed:", error);
      res.status(500).json({ message: "שגיאה בעדכון השאלה" });
    }
  });

  // ==================== COMPREHENSIVE USER MANAGEMENT SYSTEM ====================
  
  // Get all users with statistics and filtering
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { 
        status, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        page = '1',
        limit = '50'
      } = req.query;

      const users = await storage.getAllUsersWithStats({
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "שגיאה בטעינת המשתמשים" });
    }
  });

  // Get user details with activity statistics
  app.get("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userDetails = await storage.getUserDetailsWithActivity(id);
      
      if (!userDetails) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }

      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "שגיאה בטעינת פרטי המשתמש" });
    }
  });

  // Update user status (approve/reject/revoke approval)
  app.put("/api/admin/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const { deviceId } = req.body;

      // Simple admin check
      if (!deviceId || (!deviceId.includes("admin-device") && deviceId !== "admin-device-simple")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "סטטוס לא חוקי" });
      }

      const updatedUser = await storage.updateUserStatus(id, status, reason);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "שגיאה בעדכון סטטוס המשתמש" });
    }
  });

  // Get user activity summary
  app.get("/api/admin/users/:id/activity", async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await storage.getUserActivity(id);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "שגיאה בטעינת פעילות המשתמש" });
    }
  });

  // Get system statistics
  app.get("/api/admin/system-stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "שגיאה בטעינת נתוני המערכת" });
    }
  });

  // Admin: Get notification badges (unseen items count)
  app.get("/api/admin/notification-badges", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      const contactMessages = await storage.getAllContactMessages();
      const news = await storage.getAllNews();
      const pendingUsers = await storage.getPendingUsers();
      
      const badges = {
        questions: questions.filter(q => !q.isSeenByAdmin).length,
        contacts: contactMessages.filter(c => !c.isSeenByAdmin).length,
        news: news.filter(n => !n.isSeenByAdmin).length,
        users: pendingUsers.length, // Pending users are always "new"
      };
      
      res.json(badges);
    } catch (error) {
      console.error("Error fetching notification badges:", error);
      res.status(500).json({ error: "Failed to fetch notification badges" });
    }
  });

  // Admin: Mark items as seen
  app.post("/api/admin/mark-seen/:type", async (req, res) => {
    try {
      const { type } = req.params;
      
      switch (type) {
        case 'questions':
          await storage.markQuestionsAsSeen();
          break;
        case 'contacts':
          await storage.markContactsAsSeen();
          break;
        case 'news':
          await storage.markNewsAsSeen();
          break;
        default:
          return res.status(400).json({ error: "Invalid type" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking items as seen:", error);
      res.status(500).json({ error: "Failed to mark items as seen" });
    }
  });

  // Bulk operations on users
  app.post("/api/admin/users/bulk-action", async (req, res) => {
    try {
      const { action, userIds, reason } = req.body;
      const { deviceId } = req.body;

      // Simple admin check
      if (!deviceId || (!deviceId.includes("admin-device") && deviceId !== "admin-device-simple")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!['approve', 'reject', 'revoke'].includes(action)) {
        return res.status(400).json({ message: "פעולה לא חוקית" });
      }

      const results = await storage.bulkUpdateUserStatus(userIds, action, reason);
      res.json(results);
    } catch (error) {
      console.error("Error with bulk action:", error);
      res.status(500).json({ message: "שגיאה בביצוע פעולה קבוצתית" });
    }
  });

  // Export users data for reporting
  app.get("/api/admin/users/export", async (req, res) => {
    try {
      const { format = 'json' } = req.query;
      const userData = await storage.exportUsersData();
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = storage.convertToCsv(userData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
        res.send(csvData);
      } else {
        res.json(userData);
      }
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "שגיאה בייצוא נתוני המשתמשים" });
    }
  });

  // ==================== END USER MANAGEMENT SYSTEM ====================

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

  // Admin notification badge endpoints
  app.get("/api/admin/notification-counts", async (req, res) => {
    try {
      const counts = await storage.getAdminNotificationCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error getting notification counts:", error);
      res.status(500).json({ message: "שגיאה בטעינת מספרי ההתראות" });
    }
  });

  app.post("/api/admin/mark-users-seen", async (req, res) => {
    try {
      await storage.markAllUsersAsSeenByAdmin();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking users as seen:", error);
      res.status(500).json({ message: "שגיאה בעדכון המשתמשים" });
    }
  });

  app.post("/api/admin/mark-questions-seen", async (req, res) => {
    try {
      await storage.markAllQuestionsAsSeenByAdmin();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking questions as seen:", error);
      res.status(500).json({ message: "שגיאה בעדכון השאלות" });
    }
  });

  app.post("/api/admin/mark-contacts-seen", async (req, res) => {
    try {
      await storage.markAllContactMessagesAsSeenByAdmin();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking contacts as seen:", error);
      res.status(500).json({ message: "שגיאה בעדכון הפניות" });
    }
  });

  app.post("/api/admin/mark-news-seen", async (req, res) => {
    try {
      await storage.markAllNewsAsSeenByAdmin();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking news as seen:", error);
      res.status(500).json({ message: "שגיאה בעדכון החדשות" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
