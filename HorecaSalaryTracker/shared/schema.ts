import { pgTable, text, serial, integer, boolean, date, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - keeping original users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// KPI Settings Schema
export const kpiSettings = pgTable("kpi_settings", {
  id: serial("id").primaryKey(),
  
  // Visit targets
  targetLargeVisit: integer("target_large_visit").notNull().default(15),
  targetMediumVisit: integer("target_medium_visit").notNull().default(20),
  targetSmallVisit: integer("target_small_visit").notNull().default(25),
  
  // Contract targets
  targetLargeContract: integer("target_large_contract").notNull().default(8),
  targetMediumContract: integer("target_medium_contract").notNull().default(12),
  targetSmallContract: integer("target_small_contract").notNull().default(10),
  
  // Compensation settings
  visitThreshold: integer("visit_threshold").notNull().default(80), // percentage - if below, rep gets zero
  contractThreshold: integer("contract_threshold").notNull().default(80), // percentage - if below, rep gets zero
  largeCafeBonus: integer("large_cafe_bonus").notNull().default(100),
  mediumCafeBonus: integer("medium_cafe_bonus").notNull().default(75),
  smallCafeBonus: integer("small_cafe_bonus").notNull().default(50),
  
  // Salary structure
  baseSalaryPercentage: integer("base_salary_percentage").notNull().default(30),
  totalTargetSalary: integer("total_target_salary").notNull().default(3000),
  
  // KPI structure - new fields
  visitKpiPercentage: integer("visit_kpi_percentage").notNull().default(50), // % of total KPI for visits
  contractKpiPercentage: integer("contract_kpi_percentage").notNull().default(50), // % of total KPI for contracts
  
  // Representative info
  representativeName: text("representative_name").default(""),
});

export const insertKpiSettingsSchema = createInsertSchema(kpiSettings).omit({
  id: true,
});

export type KpiSettings = typeof kpiSettings.$inferSelect;
export type InsertKpiSettings = z.infer<typeof insertKpiSettingsSchema>;

// Cafe Schema
export const cafes = pgTable("cafes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerNumber: text("owner_number").notNull(),
  hookahCount: integer("hookah_count").notNull(),
  tableCount: integer("table_count").notNull(),
  status: text("status").notNull(), // "visited", "contracted", "pending"
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCafeSchema = createInsertSchema(cafes).omit({
  id: true, 
  createdAt: true
});

export type Cafe = typeof cafes.$inferSelect;
export type InsertCafe = z.infer<typeof insertCafeSchema>;

// Activity Schema for tracking activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  cafeId: integer("cafe_id").notNull(),
  activityType: text("activity_type").notNull(), // "visit", "contract", "update"
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Define relations
export const cafesRelations = relations(cafes, ({ many }) => ({
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  cafe: one(cafes, {
    fields: [activities.cafeId],
    references: [cafes.id],
  }),
}));

// Monthly Performance Schema
export const monthlyPerformance = pgTable("monthly_performance", {
  id: serial("id").primaryKey(),
  month: date("month").notNull(),
  
  // Visits
  largeVisits: integer("large_visits").notNull().default(0),
  mediumVisits: integer("medium_visits").notNull().default(0),
  smallVisits: integer("small_visits").notNull().default(0),
  
  // Contracts
  largeContracts: integer("large_contracts").notNull().default(0),
  mediumContracts: integer("medium_contracts").notNull().default(0),
  smallContracts: integer("small_contracts").notNull().default(0),
  
  // Calculated salary
  baseSalary: integer("base_salary").notNull().default(0),
  kpiBonus: integer("kpi_bonus").notNull().default(0),
  totalSalary: integer("total_salary").notNull().default(0),
});

export const insertMonthlyPerformanceSchema = createInsertSchema(monthlyPerformance).omit({
  id: true
});

export type MonthlyPerformance = typeof monthlyPerformance.$inferSelect;
export type InsertMonthlyPerformance = z.infer<typeof insertMonthlyPerformanceSchema>;

// Learning Skills model
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // sales, product, marketing
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  points: integer("points").notNull().default(10),
  icon: text("icon").notNull(),
  prerequisites: json("prerequisites").default([]).notNull().$type<number[]>(), // skill IDs required before this one
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

// Learning Path model
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  skillIds: json("skill_ids").default([]).notNull().$type<number[]>(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;

// User Progress model
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillId: integer("skill_id").notNull(),
  progress: integer("progress").notNull().default(0), // 0-100
  completed: boolean("completed").notNull().default(false),
  dateStarted: timestamp("date_started").notNull().defaultNow(),
  dateCompleted: timestamp("date_completed"),
  notes: text("notes").default(""),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  dateStarted: true,
  dateCompleted: true,
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

// Achievement model
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requiredPoints: integer("required_points").notNull(),
  badgeUrl: text("badge_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// User Achievements model
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  dateEarned: timestamp("date_earned").notNull().defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  dateEarned: true,
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Learning Content model
export const learningContent = pgTable("learning_content", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // video, article, quiz
  content: text("content").notNull(), // URL or text content
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningContentSchema = createInsertSchema(learningContent).omit({
  id: true,
  createdAt: true,
});

export type LearningContent = typeof learningContent.$inferSelect;
export type InsertLearningContent = z.infer<typeof insertLearningContentSchema>;

// Relations for learning models
export const skillsRelations = relations(skills, ({ many }) => ({
  learningContent: many(learningContent),
  userProgress: many(userProgress),
}));

export const learningPathsRelations = relations(learningPaths, ({ many }) => ({
  skills: many(skills),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [userProgress.skillId],
    references: [skills.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const learningContentRelations = relations(learningContent, ({ one }) => ({
  skill: one(skills, {
    fields: [learningContent.skillId],
    references: [skills.id],
  }),
}));

// Helper function to determine cafe size based on hookah count
export function getCafeSize(hookahCount: number): 'small' | 'medium' | 'large' {
  if (hookahCount <= 3) return 'small';
  if (hookahCount <= 7) return 'medium';
  return 'large';
}
