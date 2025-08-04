
-- Add notification columns to questions table
ALTER TABLE questions 
ADD COLUMN has_new_answer BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN answer_notification_sent BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN answered_at TIMESTAMP;

-- Create notifications table
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('question_answered', 'question_approved', 'news_urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_questions_has_new_answer ON questions(has_new_answer);
