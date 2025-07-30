import { db } from "./db";
import { users, questions, answers, news, synagogues, dailyHalacha, videos } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Add sample news
    await db.insert(news).values([
      {
        title: "עדכון בנוהלי שיטור בשבת",
        content: "עדכון חשוב בנוהלי השיטור במהלך שבת וחגים. יש לעיין במסמך המצורף ולפעול בהתאם.",
        excerpt: "עדכון בנוהלי שיטור בשבת וחגים",
        isUrgent: true,
        createdBy: "admin"
      },
      {
        title: "לוח זמנים לחגים הקרובים",
        content: "מצורף לוח הזמנים המעודכן לחגים הקרובים כולל שעות עבודה מיוחדות ותורנויות.",
        excerpt: "לוח זמנים לחגים הקרובים",
        isUrgent: false,
        createdBy: "admin"
      },
      {
        title: "הכשרה חדשה - הלכות שיטור",
        content: "נפתחה הכשרה חדשה בנושא הלכות שיטור במצבים מיוחדים. ההרשמה פתוחה.",
        excerpt: "הכשרה חדשה בהלכות שיטור",
        isUrgent: false,
        createdBy: "admin"
      }
    ]);

    // Add sample synagogues
    await db.insert(synagogues).values([
      {
        name: "בית כנסת משטרת ירושלים",
        address: "רחוב יפו 1, ירושלים",
        latitude: "31.7857",
        longitude: "35.2007",
        shacharit: "06:30",
        mincha: "13:30",
        maariv: "19:00",
        contact: "רב משה כהן - 02-5391234",
        notes: "בית כנסת מרכזי עם מניין קבוע"
      },
      {
        name: "בית כנסת תחנת מרכז",
        address: "רחוב דיזנגוף 50, תל אביב",
        latitude: "32.0853",
        longitude: "34.7818",
        shacharit: "07:00",
        mincha: "14:00",
        maariv: "19:30",
        contact: "רב יוסף לוי - 03-5241567",
        notes: "תפילות בימי חול בלבד"
      },
      {
        name: "בית כנסת משטרת חיפה",
        address: "שדרות הציונות 15, חיפה",
        shacharit: "06:45",
        mincha: "13:45",
        maariv: "19:15",
        contact: "רב דוד אברהם - 04-8612345"
      }
    ]);

    // Add daily halacha
    await db.insert(dailyHalacha).values([
      {
        date: new Date(),
        title: "הלכות שיטור בשבת",
        content: "שוטר יהודי רשאי לשאת נשק בשבת כאשר הדבר נחוץ לביטחון הציבור ולמניעת סכנת נפשות. יש להימנע מפעולות שאינן הכרחיות ולהתייעץ עם הרב המשטרתי במקרים מורכבים.",
        createdBy: "admin"
      }
    ]);

    // Add sample videos
    await db.insert(videos).values([
      {
        title: "הלכות שיטור בשבת וחגים",
        description: "הרצאה מקיפה על הלכות שיטור במהלך שבת וחגים - מה מותר ומה אסור",
        youtubeId: "dQw4w9WgXcQ",
        addedBy: "admin"
      },
      {
        title: "כשרות במשטרה",
        description: "דיון בנושא שמירת כשרות במהלך תורנויות וביצוע משימות",
        youtubeId: "dQw4w9WgXcQ",
        addedBy: "admin"
      },
      {
        title: "תפילה בתנאי שטח",
        description: "איך לקיים מצוות תפילה במהלך משימות מבצעיות ותורנויות",
        youtubeId: "dQw4w9WgXcQ",
        addedBy: "admin"
      }
    ]);

    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export { seedDatabase };

// Run seeding if this file is executed directly
seedDatabase().then(() => process.exit(0));