import { storage } from "./storage";
import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Create admin user for system management
export async function seedAdmin() {
  const adminEmail = "admin@police.gov.il";
  
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      console.log("Creating admin user...");
      
      const adminUser = await storage.createUser({
        fullName: "מנהל המערכת",
        personalId: "1234567",
        phone: "0500000000",
        email: adminEmail,
        password: "admin123",
      });
      
      // Update to admin status after creation
      await storage.updateUserStatus(adminUser.id, "approved", "system");
      
      // Update admin flag directly
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, adminUser.id));
      
      console.log("Admin user created successfully!");
      console.log("=== פרטי כניסה למנהל ===");
      console.log("אימייל: admin@police.gov.il");
      console.log("סיסמה: admin123");
      console.log("========================");
      
      return adminUser;
    } else {
      console.log("Admin user already exists");
      console.log("=== פרטי כניסה למנהל ===");
      console.log("אימייל: admin@police.gov.il");
      console.log("סיסמה: admin123");
      console.log("========================");
      return existingAdmin;
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}