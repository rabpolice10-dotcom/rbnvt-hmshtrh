import express from "express";
import { createServer } from "http";
import { storage } from "./storage.js";

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

      const user = await storage.createUser({ fullName, personalId, phone, email, password, deviceId });
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

      // Update device ID and login stats
      const updatedUser = await storage.updateUser(user.id, {
        deviceId,
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1,
      });

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

  // Cities API
  app.get("/api/jewish-times/cities", async (req, res) => {
    try {
      const citiesPath = require.resolve('./cities_il.json');
      const citiesData = require(citiesPath);
      
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

  // Jewish Times API using KosherZmanim library
  app.get("/api/jewish-times/:city?", async (req, res) => {
    try {
      console.log('Jewish times endpoint called, params:', req.params, 'query:', req.query);
      const requestedCity = req.params.city || "ירושלים";
      const requestDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const citiesData = require('./cities_il.json');
      
      // Helper functions
      const createEmptyJewishTimes = (city: string, date: Date, error: string) => ({
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
          source: "KosherZmanim",
          license: "Open Source",
          city: city,
          candle_offset_used: 18,
          error: error
        }
      });

      const calculateParsha = (date: Date): string => {
        const parashat = [
          "פרשת דברים", "פרשת ואתחנן", "פרשת עקב", "פרשת ראה", "פרשת שופטים",
          "פרשת כי תצא", "פרשת כי תבוא", "פרשת נצבים", "פרשת וילך"
        ];
        const currentWeek = Math.floor((date.getDate() - 1) / 7);
        return parashat[Math.min(currentWeek, parashat.length - 1)] || "פרשת ואתחנן";
      };

      const getHebrewDate = (date: Date) => {
        const day = date.getDate();
        const hebrewDayNames = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"];
        
        return {
          day: hebrewDayNames[day] || day.toString(),
          month: "אלול",
          year: "תשפ״ה",
          formatted: `${hebrewDayNames[day] || day} אלול תשפ״ה`
        };
      };

      // Handle geolocation request
      if (requestedCity === "current_location") {
        return res.json(createEmptyJewishTimes("current_location", requestDate, "Geolocation denied/unavailable"));
      }
      
      // Find city data with support for alternative spellings
      const locationData = citiesData[requestedCity] || 
                          citiesData[requestedCity.replace('-', ' ')] ||
                          citiesData[requestedCity.replace(' ', '-')] ||
                          citiesData["ירושלים"]; // Default fallback
      
      try {
        console.log('Jewish times request for city:', requestedCity);
        console.log('Location data:', locationData);
        
        const { ComplexZmanimCalendar, GeoLocation } = require('kosher-zmanim');
        
        // Create GeoLocation object
        const geoLocation = new GeoLocation(
          getEnglishCityName(requestedCity),
          locationData.lat,
          locationData.lon,
          locationData.elevation || 0,
          locationData.tz
        );
        
        // Initialize KosherZmanim calculator
        const zmanim = new ComplexZmanimCalendar(geoLocation);
        zmanim.setCalendar(requestDate);
        
        // Calculate candle lighting offset (default per city)
        const candleOffset = locationData.default_candle_offset;
        
        // Calculate all required times
        const formatTime = (date: Date | null) => {
          if (!date || isNaN(date.getTime())) return null;
          return date.toISOString();
        };

        // Get Shabbat times (for the upcoming Friday/Saturday)
        const today = new Date(requestDate);
        const fridayDate = new Date(today);
        const daysToFriday = (5 - today.getDay() + 7) % 7;
        fridayDate.setDate(today.getDate() + daysToFriday);
        
        const fridayZmanim = new ComplexZmanimCalendar(geoLocation);
        fridayZmanim.setCalendar(fridayDate);
        
        const candleLighting = fridayZmanim.getSunset();
        if (candleLighting) {
          candleLighting.setTime(candleLighting.getTime() - candleOffset * 60000);
        }

        // Build response according to existing schema
        const jewishTimesResponse = {
          location: requestedCity,
          englishLocation: getEnglishCityName(requestedCity),
          
          // Basic times  
          sunrise: formatTime(zmanim.getSunrise()),
          sunset: formatTime(zmanim.getSunset()),
          
          // Prayer times - mapped to existing schema
          shacharit: null, // Service times not calculated by zmanim
          mincha: null,
          maariv: null,
          
          // Shema and Tefilla times
          shemaLatest: formatTime(zmanim.getSofZmanShmaGRA()),
          tefillaLatest: formatTime(zmanim.getSofZmanTfilaGRA()),
          
          // Shabbat times
          shabbatStart: formatTime(candleLighting),
          shabbatEnd: formatTime(fridayZmanim.getTzais72Minutes()),
          
          // Extended times
          minchaKetana: formatTime(zmanim.getMinchaKetana()),
          plagHamincha: formatTime(zmanim.getPlagHamincha()),
          beinHashmashot: null,
          fastEnds: null,
          kiddushLevana: null,
          chatzot: formatTime(zmanim.getChatzos()),
          chatzotNight: null,
          alotHashachar: formatTime(zmanim.getAlosHashachar()),
          misheyakir: formatTime(zmanim.getMisheyakir11Point5Degrees()),
          misheyakirMachmir: null,
          sofZmanShema: formatTime(zmanim.getSofZmanShmaGRA()),
          sofZmanTefilla: formatTime(zmanim.getSofZmanTfilaGRA()),
          
          // Additional times
          dawn: formatTime(zmanim.getAlosHashachar()),
          dusk: formatTime(zmanim.getTzais72Minutes()),
          midday: formatTime(zmanim.getChatzos()),
          
          // Date information
          date: requestDate.toISOString().split('T')[0],
          gregorianDate: {
            day: requestDate.getDate(),
            month: requestDate.getMonth() + 1,
            year: requestDate.getFullYear(),
            dayOfWeek: requestDate.toLocaleDateString('he-IL', { weekday: 'long' })
          },
          hebrewDate: getHebrewDate(requestDate),
          
          // Shabbat information
          parsha: calculateParsha(requestDate),
          
          lastUpdated: new Date().toISOString(),
          timezone: "Asia/Jerusalem",
          fallback: false,
          
          // Meta information as per specification
          meta: {
            source: "KosherZmanim",
            license: "Open Source",
            city: requestedCity,
            candle_offset_used: candleOffset
          }
        };
        
        res.json(jewishTimesResponse);
      } catch (error) {
        console.error('KosherZmanim calculation error:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
        return res.json(createEmptyJewishTimes(requestedCity, requestDate, "Computation error"));
      }
    } catch (error) {
      console.error('Jewish times API error:', error);
      res.status(500).json({ message: "שגיאה בחישוב זמני היום" });
    }
  });

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