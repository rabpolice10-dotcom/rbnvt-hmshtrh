
// Storage methods for notifications - to be integrated into main storage file

// Add these methods to your storage class:

// Create notification
async createNotification(data: InsertNotification): Promise<Notification> {
  const [notification] = await this.db.insert(notifications).values(data).returning();
  return notification;
}

// Get user notifications
async getUserNotifications(userId: string): Promise<Notification[]> {
  return await this.db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

// Mark notifications as read
async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  await this.db
    .update(notifications)
    .set({ isRead: true })
    .where(inArray(notifications.id, notificationIds));
}

// Mark question as answered (set hasNewAnswer flag)
async markQuestionAnswered(questionId: string): Promise<void> {
  await this.db
    .update(questions)
    .set({ 
      hasNewAnswer: true, 
      answeredAt: new Date() 
    })
    .where(eq(questions.id, questionId));
}

// Mark question answer as viewed (remove hasNewAnswer flag)
async markQuestionAnswerViewed(questionId: string): Promise<void> {
  await this.db
    .update(questions)
    .set({ hasNewAnswer: false })
    .where(eq(questions.id, questionId));
}

// Get question by ID
async getQuestionById(questionId: string): Promise<Question | null> {
  const [question] = await this.db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId));
  return question || null;
}
