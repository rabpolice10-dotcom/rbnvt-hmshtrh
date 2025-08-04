import { storage } from "./storage";
import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Create admin user for system management
export async function seedAdmin() {
  const adminPersonalId = "123456789";
  
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByPersonalId(adminPersonalId);
    
    if (!existingAdmin) {
      console.log("Creating admin user...");
      
      const adminUser = await storage.createUser({
        fullName: "מנהל המערכת",
        personalId: adminPersonalId,
        phone: "0500000000",
        email: "admin@police.gov.il",
        deviceId: "admin-device-123",
      });
      
      // Update to admin status after creation
      await storage.updateUserStatus(adminUser.id, "approved", "system");
      
      // Update admin flag directly
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, adminUser.id));
      
      console.log("Admin user created successfully!");
      console.log("=== פרטי כניסה למנהל ===");
      console.log("מספר אישי: 123456789");
      console.log("הכנס למסך התחברות ואת המספר הזה");
      console.log("========================");
      
      return adminUser;
    } else {
      console.log("Admin user already exists");
      console.log("=== פרטי כניסה למנהל ===");
      console.log("מספר אישי: 123456789");
      console.log("========================");
      return existingAdmin;
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}