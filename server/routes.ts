import express from "express";
import { createServer } from "http";
import { storage } from "./storage.js";
import * as KosherZmanim from "kosher-zmanim";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: express.Application) {
  // Storage instance

  // Middleware for device ID verification
  const requireDeviceId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const deviceId = req.headers['x-device-id'] as string;
    
    if (!deviceId) {
      return res.status(401).json({ message: "Unauthorized - No device ID" });
    }
    
    next();
  };

  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      
      if (!deviceId) {
        return res.status(401).json({ message: "Unauthorized - No device ID" });
      }
      
      const user = await storage.getUserByDeviceId(deviceId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // User Authentication Routes
  console.log('Registering routes...');
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { fullName, personalId, phone, email, password, deviceId } = req.body;

      const existingUserByDeviceId = await storage.getUserByDeviceId(deviceId);
      if (existingUserByDeviceId) {
        return res.json({ user: existingUserByDeviceId });
      }
      
      const existingUserByPersonalId = await storage.getUserByPersonalId(personalId);
      if (existingUserByPersonalId) {
        return res.status(400).json({ message: "מספר אישי זה כבר רשום במערכת" });
      }

      const user = await storage.createUser({ fullName, personalId, phone, email, password });
      res.json({ user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהרשמה';
      res.status(400).json({ message: errorMessage });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, deviceId } = req.body;
      console.log('Login attempt:', { email, deviceId, password: '***' });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "כתובת אימייל לא רשומה במערכת" });
      }

      console.log('User found:', { id: user.id, email: user.email, status: user.status });

      if (user.password !== password) {
        console.log('Password mismatch:', { expected: user.password, received: password });
        return res.status(401).json({ message: "סיסמה לא נכונה" });
      }

      if (user.status !== "approved") {
        return res.status(403).json({ message: "החשבון לא אושר עדיין על ידי מנהל המערכת" });
      }

      // For now, just return the user (device ID updates would need separate endpoint)
      const updatedUser = user;

      res.json({ user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בהתחברות" });
    }
  });

  app.get("/api/auth/user", requireDeviceId, async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const user = await storage.getUserByDeviceId(deviceId);
      
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

  // Jewish Times API - Completely rewritten with KosherZmanim 0.9.0
  
  // Cities API
  app.get("/api/jewish-times/cities", async (req, res) => {
    try {
      console.log('Cities endpoint called, __dirname:', __dirname);
      const citiesPath = path.join(__dirname, 'cities_il.json');
      console.log('Looking for cities file at:', citiesPath);
      
      if (!fs.existsSync(citiesPath)) {
        console.error('Cities file not found at:', citiesPath);
        return res.status(500).json({ message: "קובץ ערים לא נמצא" });
      }
      
      const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
      
      const cities = Object.keys(citiesData).map(city => ({
        id: city,
        name: city,
        english: getEnglishCityName(city)
      }));
      
      res.json({ cities });
    } catch (error) {
      console.error('Error fetching cities:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ message: "שגיאה בטעינת רשימת הערים" });
    }
  });

  // Helper function for English city names
  const getEnglishCityName = (hebrewCity: string): string => {
    const cityMap: { [key: string]: string } = {
      "ירושלים": "Jerusalem",
      "תל אביב-יפו": "Tel Aviv-Yafo", 
      "חיפה": "Haifa",
      "באר שבע": "Beer Sheva",
      "אשדוד": "Ashdod",
      "ראשון לציון": "Rishon LeZion",
      "פתח תקווה": "Petah Tikva",
      "נתניה": "Netanya",
      "חולון": "Holon",
      "בת ים": "Bat Yam",
      "רמת גן": "Ramat Gan",
      "גבעתיים": "Givatayim",
      "הרצליה": "Herzliya",
      "כפר סבא": "Kfar Saba",
      "רעננה": "Ra'anana",
      "חדרה": "Hadera",
      "מודיעין-מכבים-רעות": "Modi'in-Maccabim-Re'ut",
      "אשקלון": "Ashkelon",
      "רחובות": "Rehovot",
      "רמלה": "Ramla",
      "לוד": "Lod",
      "בית שמש": "Beit Shemesh",
      "נהריה": "Nahariya",
      "עכו": "Acre",
      "טבריה": "Tiberias",
      "עפולה": "Afula",
      "נוף הגליל": "Nof HaGalil",
      "אילת": "Eilat",
      "קריית שמונה": "Kiryat Shmona",
      "צפת": "Safed",
      "זכרון יעקב": "Zichron Yaakov"
    };
    return cityMap[hebrewCity] || hebrewCity;
  };

  // Main Jewish Times API
  app.get("/api/jewish-times/:city?", async (req, res) => {
    try {
      const requestedCity = req.params.city || "ירושלים";
      const requestDate = req.query.date ? new Date(req.query.date as string) : new Date();
      
      console.log(`Jewish times request: ${requestedCity} for ${requestDate.toISOString()}`);
      
      // Load cities data
      const citiesPath = path.join(__dirname, 'cities_il.json');
      const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
      
      // Handle geolocation request
      if (requestedCity === "current_location") {
        return res.json(createFallbackResponse("current_location", requestDate, "Geolocation not available"));
      }
      
      // Find city data
      const cityData = citiesData[requestedCity] || citiesData["ירושלים"];
      
      // KosherZmanim is already imported
      
      // Calculate Jewish times using the new API
      const zmanimOptions = {
        date: requestDate,
        timeZoneId: cityData.tz || 'Asia/Jerusalem',
        locationName: getEnglishCityName(requestedCity),
        latitude: cityData.lat,
        longitude: cityData.lon,
        elevation: cityData.elevation || 0,
        complexZmanim: true
      };
      
      console.log('Calculating zmanim with options:', zmanimOptions);
      
      let zmanimResult: any;
      try {
        zmanimResult = KosherZmanim.getZmanimJson(zmanimOptions);
        console.log('Zmanim result structure:', Object.keys(zmanimResult));
      } catch (libError) {
        console.error('KosherZmanim library error:', libError);
        console.error('Error type:', typeof libError);
        console.error('Error message:', libError instanceof Error ? libError.message : String(libError));
        
        // Return fallback response with error details
        return res.status(500).json({
          message: "שגיאה בספריית KosherZmanim",
          error: libError instanceof Error ? libError.message : String(libError),
          fallback: true
        });
      }
      
      // Check if we have the Zmanim object
      if (zmanimResult.Zmanim) {
        console.log('Full Zmanim object keys:', Object.keys(zmanimResult.Zmanim));
        console.log('First few zmanim:', JSON.stringify(Object.fromEntries(Object.entries(zmanimResult.Zmanim).slice(0, 5)), null, 2));
      }
      
      // Calculate Hebrew date
      const hebrewDate = calculateHebrewDate(requestDate);
      
      // Calculate Parsha
      const parsha = calculateCurrentParsha(requestDate);
      
      // Safe access to zmanim data first
      const zmanim = zmanimResult.Zmanim || {};
      
      // Calculate Shabbat times properly
      const shabbatTimes = calculateShabbatTimes(requestDate, cityData, zmanim);
      
      // Format times consistently
      const formatTime = (dateTime: any) => {
        if (!dateTime) return null;
        try {
          const date = new Date(dateTime);
          if (isNaN(date.getTime())) return null;
          return date.toISOString();
        } catch {
          return null;
        }
      };

      // zmanim already defined above
      
      // Debug: log available zmanim times
      console.log('Available zmanim times:', Object.keys(zmanim));
      console.log('Sample zmanim values:', { 
        Sunrise: zmanim.Sunrise, 
        Sunset: zmanim.Sunset,
        Hanetz: zmanim.Hanetz,
        Shkia: zmanim.Shkia 
      });

      // Build comprehensive response
      const response = {
        location: requestedCity,
        englishLocation: getEnglishCityName(requestedCity),
        
        // Basic sun times - try different property names
        sunrise: formatTime(zmanim.Sunrise || zmanim.Hanetz || zmanim.sunrise),
        sunset: formatTime(zmanim.Sunset || zmanim.Shkia || zmanim.sunset),
        
        // Prayer times (estimated based on zmanim)
        shacharit: formatTime(zmanim.SofZmanShmaGRA),
        mincha: formatTime(zmanim.MinchaGedola),
        maariv: formatTime(zmanim.Tzais72),
        
        // Shema and Tefilla times
        shemaLatest: formatTime(zmanim.SofZmanShmaGRA),
        tefillaLatest: formatTime(zmanim.SofZmanTfilaGRA),
        
        // Shabbat times
        shabbatStart: formatTime(shabbatTimes.candleLighting),
        shabbatEnd: formatTime(shabbatTimes.havdalah),
        
        // Extended zmanim
        minchaKetana: formatTime(zmanim.MinchaKetana),
        plagHamincha: formatTime(zmanim.PlagHamincha),
        beinHashmashot: formatTime(zmanim.BainHashmashos),
        fastEnds: formatTime(zmanim.Tzais72),
        kiddushLevana: null,
        chatzot: formatTime(zmanim.Chatzos),
        chatzotNight: formatTime(zmanim.ChatzosLayla),
        alotHashachar: formatTime(zmanim.Alos72),
        misheyakir: formatTime(zmanim.MisheyakirMachmir),
        misheyakirMachmir: formatTime(zmanim.MisheyakirMachmir),
        sofZmanShema: formatTime(zmanim.SofZmanShmaGRA),
        sofZmanTefilla: formatTime(zmanim.SofZmanTfilaGRA),
        
        // Additional times
        dawn: formatTime(zmanim.Alos72),
        dusk: formatTime(zmanim.Tzais72),
        midday: formatTime(zmanim.Chatzos),
        
        // Date information
        date: requestDate.toISOString().split('T')[0],
        gregorianDate: {
          day: requestDate.getDate(),
          month: requestDate.getMonth() + 1,
          year: requestDate.getFullYear(),
          dayOfWeek: requestDate.toLocaleDateString('he-IL', { weekday: 'long' })
        },
        hebrewDate: hebrewDate,
        
        // Torah portion
        parsha: parsha,
        
        lastUpdated: new Date().toISOString(),
        timezone: cityData.tz || "Asia/Jerusalem",
        fallback: false,
        
        // Meta information
        meta: {
          source: "KosherZmanim 0.9.0",
          license: "Open Source",
          city: requestedCity,
          candle_offset_used: cityData.default_candle_offset
        }
      };
      
      console.log('Successfully calculated zmanim for', requestedCity);
      res.json(response);
      
    } catch (error) {
      console.error('Jewish times calculation error:', error);
      res.status(500).json({ message: "שגיאה בחישוב זמני היום" });
    }
  });

  // Helper functions for Jewish times calculation
  function createFallbackResponse(city: string, date: Date, errorMsg: string) {
    return {
      location: city,
      englishLocation: getEnglishCityName(city),
      sunrise: null,
      sunset: null,
      shacharit: null,
      mincha: null,
      maariv: null,
      shemaLatest: null,
      tefillaLatest: null,
      shabbatStart: null,
      shabbatEnd: null,
      minchaKetana: null,
      plagHamincha: null,
      beinHashmashot: null,
      fastEnds: null,
      kiddushLevana: null,
      chatzot: null,
      chatzotNight: null,
      alotHashachar: null,
      misheyakir: null,
      misheyakirMachmir: null,
      sofZmanShema: null,
      sofZmanTefilla: null,
      dawn: null,
      dusk: null,
      midday: null,
      date: date.toISOString().split('T')[0],
      gregorianDate: {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dayOfWeek: date.toLocaleDateString('he-IL', { weekday: 'long' })
      },
      hebrewDate: { day: "א", month: "אלול", year: "תשפ״ה", formatted: "א אלול תשפ״ה" },
      parsha: null,
      lastUpdated: new Date().toISOString(),
      timezone: "Asia/Jerusalem",
      fallback: true,
      meta: {
        source: "KosherZmanim 0.9.0",
        license: "Open Source",
        city: city,
        candle_offset_used: 18,
        error: errorMsg
      }
    };
  }

  function calculateHebrewDate(date: Date) {
    // Simple Hebrew date calculation - can be enhanced with proper Hebrew calendar
    const day = date.getDate();
    const hebrewDayNames = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", 
                           "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", 
                           "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"];
    
    return {
      day: hebrewDayNames[day] || day.toString(),
      month: "אלול", // Current Hebrew month - should be calculated properly
      year: "תשפ״ה", // Current Hebrew year - should be calculated properly
      formatted: `${hebrewDayNames[day] || day} אלול תשפ״ה`
    };
  }

  function calculateCurrentParsha(date: Date): string {
    // Simple Parsha calculation based on week in year
    const parashat = [
      "פרשת בראשית", "פרשת נח", "פרשת לך לך", "פרשת וירא", "פרשת חיי שרה",
      "פרשת תולדות", "פרשת ויצא", "פרשת וישלח", "פרשת וישב", "פרשת מקץ",
      "פרשת ויגש", "פרשת ויחי", "פרשת שמות", "פרשת וארא", "פרשת בא",
      "פרשת בשלח", "פרשת יתרו", "פרשת משפטים", "פרשת תרומה", "פרשת תצוה"
    ];
    
    const weekInYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7));
    return parashat[weekInYear % parashat.length] || "פרשת בראשית";
  }

  function calculateShabbatTimes(date: Date, cityData: any, zmanim: any) {
    try {
      // Find sunset time from zmanim
      const sunset = zmanim.Sunset || zmanim.Shkia || zmanim.sunset;
      
      if (!sunset) {
        console.log('No sunset time found in zmanim');
        return { candleLighting: null, havdalah: null };
      }
      
      // Find the upcoming Friday for Shabbat
      const today = new Date(date);
      const daysToFriday = (5 - today.getDay() + 7) % 7;
      
      // If today is Friday, use today; otherwise find next Friday
      const fridayDate = new Date(today);
      if (daysToFriday > 0) {
        fridayDate.setDate(today.getDate() + daysToFriday);
      }
      
      // Candle lighting time (sunset minus offset on Friday)
      const sunsetTime = new Date(sunset);
      const candleLighting = new Date(sunsetTime.getTime() - (cityData.default_candle_offset * 60000));
      
      // Havdalah time (72 minutes after sunset on Saturday)
      const saturdayDate = new Date(fridayDate);
      saturdayDate.setDate(fridayDate.getDate() + 1);
      const havdalah = new Date(sunsetTime.getTime() + (72 * 60000)); // 72 minutes after sunset
      
      console.log('Calculated Shabbat times:', { 
        candleLighting: candleLighting.toISOString(), 
        havdalah: havdalah.toISOString() 
      });
      
      return {
        candleLighting: candleLighting.toISOString(),
        havdalah: havdalah.toISOString()
      };
      
    } catch (error) {
      console.error('Error calculating Shabbat times:', error);
      return {
        candleLighting: null,
        havdalah: null
      };
    }
  }

  // Questions API
  app.post("/api/questions", requireDeviceId, async (req, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const user = await storage.getUserByDeviceId(deviceId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const question = await storage.createQuestion({
        ...req.body,
        userId: user.id,
      });

      res.json({ question });
    } catch (error) {
      res.status(400).json({ message: "שגיאה בשליחת השאלה", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/questions/admin", requireAdmin, async (req, res) => {
    try {
      const questions = await storage.getUnansweredQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלות למנהל" });
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

  app.get("/api/questions/user/:userId", requireDeviceId, async (req, res) => {
    try {
      const questions = await storage.getQuestionsByUser(req.params.userId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלות" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestionWithAnswers(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "השאלה לא נמצאה" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת השאלה" });
    }
  });

  // News API
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת החדשות" });
    }
  });

  app.post("/api/news", requireAdmin, async (req, res) => {
    try {
      const news = await storage.createNews(req.body);
      res.json({ news });
    } catch (error) {
      res.status(400).json({ message: "שגיאה ביצירת חדשה" });
    }
  });

  // Synagogues API
  app.get("/api/synagogues", async (req, res) => {
    try {
      const synagogues = await storage.getAllSynagogues();
      res.json(synagogues);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת בתי הכנסת" });
    }
  });

  // Videos API
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת הסרטונים" });
    }
  });

  // Daily Halacha API
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

  // Notifications API
  app.get("/api/notifications/:userId", requireDeviceId, async (req, res) => {
    try {
      // Simple implementation returning empty array for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת ההתראות" });
    }
  });

  // Admin Users API
  app.get("/api/admin/users/pending", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getPendingUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "שגיאה בטעינת משתמשים ממתינים" });
    }
  });

  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const user = await storage.updateUserStatus(id, "approved", approvedBy);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "שגיאה באישור משתמש" });
    }
  });

  app.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const user = await storage.updateUserStatus(id, "rejected", approvedBy);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "שגיאה בדחיית משתמש" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}