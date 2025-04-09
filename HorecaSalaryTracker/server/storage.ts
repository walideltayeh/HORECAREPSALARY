import { 
  users, type User, type InsertUser,
  kpiSettings, type KpiSettings, type InsertKpiSettings,
  cafes, type Cafe, type InsertCafe,
  activities, type Activity, type InsertActivity,
  monthlyPerformance, type MonthlyPerformance, type InsertMonthlyPerformance,
  skills, type Skill, type InsertSkill,
  learningPaths, type LearningPath, type InsertLearningPath,
  userProgress, type UserProgress, type InsertUserProgress,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement,
  learningContent, type LearningContent, type InsertLearningContent,
  getCafeSize
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { format } from 'date-fns';

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // KPI Settings methods
  getKpiSettings(): Promise<KpiSettings>;
  saveKpiSettings(settings: InsertKpiSettings): Promise<KpiSettings>;
  
  // Cafe methods
  getAllCafes(): Promise<Cafe[]>;
  getCafeById(id: number): Promise<Cafe | undefined>;
  createCafe(cafe: InsertCafe): Promise<Cafe>;
  updateCafe(id: number, cafe: Partial<InsertCafe>): Promise<Cafe>;
  deleteCafe(id: number): Promise<void>;
  
  // Activity methods
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Performance methods
  getCurrentMonthPerformance(): Promise<MonthlyPerformance>;
  getMonthPerformance(year: number, month: number): Promise<MonthlyPerformance>;
  getPerformanceHistory(limit?: number): Promise<MonthlyPerformance[]>;
  updateMonthPerformance(year: number, month: number, performance: Partial<MonthlyPerformance>): Promise<MonthlyPerformance>;
  
  // Learning Skills methods
  getAllSkills(): Promise<Skill[]>;
  getSkillById(id: number): Promise<Skill | undefined>;
  getSkillsByCategory(category: string): Promise<Skill[]>;
  getSkillsByDifficulty(difficulty: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, skill: Partial<InsertSkill>): Promise<Skill>;
  deleteSkill(id: number): Promise<void>;
  
  // Learning Path methods
  getAllLearningPaths(): Promise<LearningPath[]>;
  getLearningPathById(id: number): Promise<LearningPath | undefined>;
  createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath>;
  updateLearningPath(id: number, learningPath: Partial<InsertLearningPath>): Promise<LearningPath>;
  deleteLearningPath(id: number): Promise<void>;
  getSkillsForLearningPath(learningPathId: number): Promise<Skill[]>;
  
  // User Progress methods
  getUserProgressByUser(userId: number): Promise<UserProgress[]>;
  getUserProgressBySkill(skillId: number): Promise<UserProgress[]>;
  getUserProgressByUserAndSkill(userId: number, skillId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  completeSkill(userId: number, skillId: number): Promise<UserProgress>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getAchievementById(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, achievement: Partial<InsertAchievement>): Promise<Achievement>;
  
  // User Achievement methods
  getUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;
  awardAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  
  // Learning Content methods
  getContentForSkill(skillId: number): Promise<LearningContent[]>;
  createLearningContent(content: InsertLearningContent): Promise<LearningContent>;
  updateLearningContent(id: number, content: Partial<InsertLearningContent>): Promise<LearningContent>;
  deleteLearningContent(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private currentId = 1;
  
  private kpiSettingsData: KpiSettings | null = null;
  private kpiSettingsId = 1;
  
  private cafesData: Map<number, Cafe> = new Map();
  private cafeCurrentId = 1;
  
  private activitiesData: Map<number, Activity> = new Map();
  private activityCurrentId = 1;
  
  private performanceData: Map<string, MonthlyPerformance> = new Map();
  private performanceCurrentId = 1;
  
  // Learning module data structures
  private skillsData: Map<number, Skill> = new Map();
  private skillCurrentId = 1;
  
  private learningPathsData: Map<number, LearningPath> = new Map();
  private learningPathCurrentId = 1;
  
  private userProgressData: Map<number, UserProgress> = new Map();
  private userProgressCurrentId = 1;
  
  private achievementsData: Map<number, Achievement> = new Map();
  private achievementCurrentId = 1;
  
  private userAchievementsData: Map<number, UserAchievement> = new Map();
  private userAchievementCurrentId = 1;
  
  private learningContentData: Map<number, LearningContent> = new Map();
  private learningContentCurrentId = 1;
  
  constructor() {
    this.initializeLearningData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // KPI Settings methods
  async getKpiSettings(): Promise<KpiSettings> {
    if (this.kpiSettingsData) {
      return this.kpiSettingsData;
    }
    
    // Create default KPI settings
    const defaultSettings: KpiSettings = {
      id: this.kpiSettingsId,
      targetLargeVisit: 15,
      targetMediumVisit: 20,
      targetSmallVisit: 25,
      targetLargeContract: 8,
      targetMediumContract: 12,
      targetSmallContract: 10,
      visitThreshold: 80,
      contractThreshold: 80,
      largeCafeBonus: 100,
      mediumCafeBonus: 75,
      smallCafeBonus: 50,
      baseSalaryPercentage: 30,
      totalTargetSalary: 3000,
      visitKpiPercentage: 50,
      contractKpiPercentage: 50,
      representativeName: ''
    };
    
    this.kpiSettingsData = defaultSettings;
    return defaultSettings;
  }
  
  async saveKpiSettings(settings: InsertKpiSettings): Promise<KpiSettings> {
    const updatedSettings: KpiSettings = {
      id: this.kpiSettingsId,
      ...settings
    };
    
    this.kpiSettingsData = updatedSettings;
    
    // Recalculate current month's performance with new settings
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Get the current month's performance or create it if it doesn't exist
    await this.getMonthPerformance(year, month);
    
    // Recalculate
    const performance = this.performanceData.get(`${year}-${month}`);
    if (performance) {
      const updatedPerformance = this.calculatePerformance(performance, updatedSettings);
      this.performanceData.set(`${year}-${month}`, updatedPerformance);
    }
    
    return updatedSettings;
  }
  
  private calculatePerformance(performance: MonthlyPerformance, settings: KpiSettings): MonthlyPerformance {
    // Calculate base salary
    const baseSalary = Math.round(settings.totalTargetSalary * (settings.baseSalaryPercentage / 100));
    
    // Calculate contract percentage for threshold
    const totalContracts = performance.largeContracts + performance.mediumContracts + performance.smallContracts;
    const totalContractTargets = 
      settings.targetLargeContract + 
      settings.targetMediumContract + 
      settings.targetSmallContract;
    
    const contractPercentage = totalContractTargets > 0 ? (totalContracts / totalContractTargets) * 100 : 0;
    
    // Calculate potential KPI bonus (total amount available for KPI-based compensation)
    const potentialKpiBonus = settings.totalTargetSalary - baseSalary;
    
    // Calculate contract KPI percentage (default to 50% if not set)
    const contractKpiPercentage = settings.contractKpiPercentage || 50;
    
    // Calculate contract KPI portion
    const contractKpiPortion = potentialKpiBonus * (contractKpiPercentage / 100);
    
    // Calculate raw contract bonuses
    const rawContractBonus = 
      performance.largeContracts * settings.largeCafeBonus +
      performance.mediumContracts * settings.mediumCafeBonus +
      performance.smallContracts * settings.smallCafeBonus;
    
    // Apply threshold and cap at contractKpiPortion
    const contractBonus = contractPercentage >= (settings.contractThreshold || 80) ?
      Math.min(rawContractBonus, contractKpiPortion) : 0;
    
    // Calculate visit bonus
    const totalVisits = performance.largeVisits + performance.mediumVisits + performance.smallVisits;
    const totalVisitTargets = 
      settings.targetLargeVisit + 
      settings.targetMediumVisit + 
      settings.targetSmallVisit;
    
    const visitPercentage = totalVisitTargets > 0 ? (totalVisits / totalVisitTargets) * 100 : 0;
    
    // Calculate visit bonus based on visitKpiPercentage (default to 50% if not set)
    const visitKpiPercentage = settings.visitKpiPercentage || 50;
    const visitBonusBase = potentialKpiBonus * (visitKpiPercentage / 100);
    const visitBonus = visitPercentage >= settings.visitThreshold 
      ? Math.round(visitBonusBase * (visitPercentage / 100))
      : 0;
    
    const kpiBonus = contractBonus + visitBonus;
    const totalSalary = baseSalary + kpiBonus;
    
    return {
      ...performance,
      baseSalary,
      kpiBonus,
      totalSalary
    };
  }
  
  // Cafe methods
  async getAllCafes(): Promise<Cafe[]> {
    return Array.from(this.cafesData.values());
  }
  
  async getCafeById(id: number): Promise<Cafe | undefined> {
    return this.cafesData.get(id);
  }
  
  async createCafe(cafe: InsertCafe): Promise<Cafe> {
    const id = this.cafeCurrentId++;
    const newCafe: Cafe = {
      ...cafe,
      id,
      createdAt: new Date()
    };
    
    this.cafesData.set(id, newCafe);
    
    // Create a visit activity
    await this.createActivity({
      cafeId: id,
      activityType: 'visit',
      description: `Added new cafe: ${cafe.name}`
    });
    
    // Update monthly performance based on cafe size and status
    await this.updatePerformanceForCafe(newCafe);
    
    return newCafe;
  }
  
  async updateCafe(id: number, cafeData: Partial<InsertCafe>): Promise<Cafe> {
    const oldCafe = this.cafesData.get(id);
    
    if (!oldCafe) {
      throw new Error(`Cafe with id ${id} not found`);
    }
    
    const updatedCafe: Cafe = {
      ...oldCafe,
      ...cafeData
    };
    
    this.cafesData.set(id, updatedCafe);
    
    // Create an update activity
    await this.createActivity({
      cafeId: id,
      activityType: 'update',
      description: `Updated cafe: ${updatedCafe.name}`
    });
    
    // If status changed, create appropriate activity
    if (oldCafe.status !== updatedCafe.status) {
      const activityType = updatedCafe.status === 'contracted' ? 'contract' : 'visit';
      const action = updatedCafe.status === 'contracted' ? 'Contracted with' : 'Visited';
      
      await this.createActivity({
        cafeId: id,
        activityType,
        description: `${action} cafe: ${updatedCafe.name}`
      });
    }
    
    // Update performance metrics based on changes
    if (oldCafe.status !== updatedCafe.status || oldCafe.hookahCount !== updatedCafe.hookahCount) {
      // First reverse the old cafe's contribution
      await this.updatePerformanceForCafe(oldCafe, true);
      // Then add the updated cafe's contribution
      await this.updatePerformanceForCafe(updatedCafe);
    }
    
    return updatedCafe;
  }
  
  async deleteCafe(id: number): Promise<void> {
    const cafe = this.cafesData.get(id);
    
    if (!cafe) {
      throw new Error(`Cafe with id ${id} not found`);
    }
    
    // Update performance metrics before deleting
    await this.updatePerformanceForCafe(cafe, true);
    
    // Delete related activities
    for (const [activityId, activity] of this.activitiesData) {
      if (activity.cafeId === id) {
        this.activitiesData.delete(activityId);
      }
    }
    
    // Delete the cafe
    this.cafesData.delete(id);
  }
  
  // Activity methods
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const newActivity: Activity = {
      ...activity,
      id,
      timestamp: new Date()
    };
    
    this.activitiesData.set(id, newActivity);
    return newActivity;
  }
  
  // Performance methods
  async getCurrentMonthPerformance(): Promise<MonthlyPerformance> {
    const currentDate = new Date();
    return this.getMonthPerformance(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }
  
  async getMonthPerformance(year: number, month: number): Promise<MonthlyPerformance> {
    const monthKey = `${year}-${month}`;
    const existingPerformance = this.performanceData.get(monthKey);
    
    if (existingPerformance) {
      // Return existing performance data without recalculation
      return existingPerformance;
    }
    
    // Get KPI settings for default values
    const kpiSettings = await this.getKpiSettings();
    
    // Create a new performance record for the month
    const formattedMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
    const newPerformance: MonthlyPerformance = {
      id: this.performanceCurrentId++,
      month: formattedMonth as any, // ISO date string
      largeVisits: 0,
      mediumVisits: 0,
      smallVisits: 0,
      largeContracts: 0,
      mediumContracts: 0,
      smallContracts: 0,
      baseSalary: Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100)),
      kpiBonus: 0,
      totalSalary: Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100))
    };
    
    this.performanceData.set(monthKey, newPerformance);
    return newPerformance;
  }
  
  async getPerformanceHistory(limit: number = 12): Promise<MonthlyPerformance[]> {
    return Array.from(this.performanceData.values())
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, limit);
  }
  
  async updateMonthPerformance(year: number, month: number, performanceData: Partial<MonthlyPerformance>): Promise<MonthlyPerformance> {
    const monthKey = `${year}-${month}`;
    let performance = this.performanceData.get(monthKey);
    
    if (!performance) {
      performance = await this.getMonthPerformance(year, month);
    }
    
    const updatedPerformance: MonthlyPerformance = { 
      ...performance, 
      ...performanceData 
    };
    
    this.performanceData.set(monthKey, updatedPerformance);
    return updatedPerformance;
  }
  
  private async updatePerformanceForCafe(cafe: Cafe, isReversal = false): Promise<void> {
    const cafeSize = getCafeSize(cafe.hookahCount);
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Get current performance
    const performance = await this.getMonthPerformance(year, month);
    
    // Create a copy for updates
    const updatedPerformance = { ...performance };
    
    // Factor is 1 for additions, -1 for reversals (removals)
    const factor = isReversal ? -1 : 1;
    
    // Update visit counts
    if (cafe.status === 'visited' || cafe.status === 'contracted') {
      if (cafeSize === 'large') {
        updatedPerformance.largeVisits += factor;
      } else if (cafeSize === 'medium') {
        updatedPerformance.mediumVisits += factor;
      } else {
        updatedPerformance.smallVisits += factor;
      }
    }
    
    // Update contract counts
    if (cafe.status === 'contracted') {
      if (cafeSize === 'large') {
        updatedPerformance.largeContracts += factor;
      } else if (cafeSize === 'medium') {
        updatedPerformance.mediumContracts += factor;
      } else {
        updatedPerformance.smallContracts += factor;
      }
    }
    
    // Get KPI settings to calculate salary
    const kpiSettings = await this.getKpiSettings();
    
    // Calculate base salary
    updatedPerformance.baseSalary = Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100));
    
    // Calculate contract percentage for threshold
    const totalContracts = updatedPerformance.largeContracts + updatedPerformance.mediumContracts + updatedPerformance.smallContracts;
    const totalContractTargets = kpiSettings.targetLargeContract + kpiSettings.targetMediumContract + kpiSettings.targetSmallContract;
    const contractPercentage = totalContractTargets > 0 ? (totalContracts / totalContractTargets) * 100 : 0;
    
    // Calculate potential KPI bonus (total amount available for KPI-based compensation)
    const potentialKpiBonus = kpiSettings.totalTargetSalary - updatedPerformance.baseSalary;
    
    // Calculate contract KPI percentage (default to 50% if not set)
    const contractKpiPercentage = kpiSettings.contractKpiPercentage || 50;
    
    // Calculate contract KPI portion
    const contractKpiPortion = potentialKpiBonus * (contractKpiPercentage / 100);
    
    // Calculate raw contract bonuses
    const largeCafeBonus = updatedPerformance.largeContracts * kpiSettings.largeCafeBonus;
    const mediumCafeBonus = updatedPerformance.mediumContracts * kpiSettings.mediumCafeBonus;
    const smallCafeBonus = updatedPerformance.smallContracts * kpiSettings.smallCafeBonus;
    
    // Apply threshold and cap at contractKpiPortion
    const contractThreshold = kpiSettings.contractThreshold || 80;
    const meetsContractThreshold = contractPercentage >= contractThreshold;
    const contractBonus = meetsContractThreshold ? 
      Math.min(largeCafeBonus + mediumCafeBonus + smallCafeBonus, contractKpiPortion) : 0;
    
    // Calculate visit KPI
    const totalVisits = updatedPerformance.largeVisits + updatedPerformance.mediumVisits + updatedPerformance.smallVisits;
    const totalVisitTargets = kpiSettings.targetLargeVisit + kpiSettings.targetMediumVisit + kpiSettings.targetSmallVisit;
    const visitPercentage = totalVisitTargets > 0 ? (totalVisits / totalVisitTargets) * 100 : 0;
    
    // Calculate visit KPI percentage (default to 50% if not set)
    const visitKpiPercentage = kpiSettings.visitKpiPercentage || 50;
    
    // Calculate visit KPI portion
    const visitKpiPortion = potentialKpiBonus * (visitKpiPercentage / 100);
    
    // Calculate visit bonus (with threshold)
    const visitBonus = visitPercentage >= kpiSettings.visitThreshold 
      ? Math.round(visitKpiPortion * (visitPercentage / 100))
      : 0;
    
    // Set KPI bonus and total salary
    updatedPerformance.kpiBonus = contractBonus + visitBonus;
    updatedPerformance.totalSalary = updatedPerformance.baseSalary + updatedPerformance.kpiBonus;
    
    // Save updated performance
    await this.updateMonthPerformance(year, month, updatedPerformance);
  }
  
  // Initialize learning data with some initial skills, paths, and achievements
  private initializeLearningData() {
    // Sales skills
    const salesBasicsSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Sales Basics",
      description: "Learn the fundamentals of sales in the horeca industry",
      category: "sales",
      difficulty: "beginner",
      points: 10,
      icon: "book",
      prerequisites: [],
      createdAt: new Date()
    };
    
    const negotiationSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Negotiation Techniques",
      description: "Master the art of negotiation with cafe owners",
      category: "sales",
      difficulty: "intermediate",
      points: 20,
      icon: "handshake",
      prerequisites: [1],
      createdAt: new Date()
    };
    
    const closingDealsSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Closing Deals",
      description: "Learn effective techniques to close contracts",
      category: "sales",
      difficulty: "advanced",
      points: 30,
      icon: "check-circle",
      prerequisites: [2],
      createdAt: new Date()
    };
    
    // Product skills
    const productKnowledgeSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Product Knowledge",
      description: "Detailed understanding of hookah products",
      category: "product",
      difficulty: "beginner",
      points: 15,
      icon: "package",
      prerequisites: [],
      createdAt: new Date()
    };
    
    const hookahSetupSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Hookah Setup Mastery",
      description: "Learn to set up and demonstrate hookahs effectively",
      category: "product",
      difficulty: "intermediate",
      points: 25,
      icon: "tool",
      prerequisites: [4],
      createdAt: new Date()
    };
    
    // Marketing skills
    const cafeMarketingSkill: Skill = {
      id: this.skillCurrentId++,
      name: "Cafe Marketing",
      description: "Learn how to help cafe owners market hookah offerings",
      category: "marketing",
      difficulty: "intermediate",
      points: 20,
      icon: "trending-up",
      prerequisites: [],
      createdAt: new Date()
    };
    
    // Learning paths
    const salesCareerPath: LearningPath = {
      id: this.learningPathCurrentId++,
      name: "Sales Career",
      description: "Master the entire sales process from prospecting to closing",
      skillIds: [1, 2, 3],
      icon: "briefcase",
      createdAt: new Date()
    };
    
    const productExpertPath: LearningPath = {
      id: this.learningPathCurrentId++,
      name: "Product Expert",
      description: "Become a product expert in the hookah industry",
      skillIds: [4, 5],
      icon: "award",
      createdAt: new Date()
    };
    
    const completeRepPath: LearningPath = {
      id: this.learningPathCurrentId++,
      name: "Complete Representative",
      description: "Master all skills needed to be a top-performing representative",
      skillIds: [1, 2, 3, 4, 5, 6],
      icon: "star",
      createdAt: new Date()
    };
    
    // Achievements
    const salesRookieAchievement: Achievement = {
      id: this.achievementCurrentId++,
      name: "Sales Rookie",
      description: "Complete your first sales skill",
      icon: "award",
      requiredPoints: 10,
      badgeUrl: "/badges/sales-rookie.svg",
      createdAt: new Date()
    };
    
    const salesMasterAchievement: Achievement = {
      id: this.achievementCurrentId++,
      name: "Sales Master",
      description: "Complete all sales skills",
      icon: "award",
      requiredPoints: 60,
      badgeUrl: "/badges/sales-master.svg",
      createdAt: new Date()
    };
    
    const productGuruAchievement: Achievement = {
      id: this.achievementCurrentId++,
      name: "Product Guru",
      description: "Complete all product skills",
      icon: "award",
      requiredPoints: 40,
      badgeUrl: "/badges/product-guru.svg",
      createdAt: new Date()
    };
    
    // Store skills in the map
    this.skillsData.set(salesBasicsSkill.id, salesBasicsSkill);
    this.skillsData.set(negotiationSkill.id, negotiationSkill);
    this.skillsData.set(closingDealsSkill.id, closingDealsSkill);
    this.skillsData.set(productKnowledgeSkill.id, productKnowledgeSkill);
    this.skillsData.set(hookahSetupSkill.id, hookahSetupSkill);
    this.skillsData.set(cafeMarketingSkill.id, cafeMarketingSkill);
    
    // Store learning paths
    this.learningPathsData.set(salesCareerPath.id, salesCareerPath);
    this.learningPathsData.set(productExpertPath.id, productExpertPath);
    this.learningPathsData.set(completeRepPath.id, completeRepPath);
    
    // Store achievements
    this.achievementsData.set(salesRookieAchievement.id, salesRookieAchievement);
    this.achievementsData.set(salesMasterAchievement.id, salesMasterAchievement);
    this.achievementsData.set(productGuruAchievement.id, productGuruAchievement);
    
    // Add learning content
    const salesBasicsIntro: LearningContent = {
      id: this.learningContentCurrentId++,
      skillId: 1,
      title: "Introduction to Sales",
      contentType: "video",
      content: "https://example.com/sales-basics-intro",
      position: 1,
      createdAt: new Date()
    };
    
    const salesBasicsQuiz: LearningContent = {
      id: this.learningContentCurrentId++,
      skillId: 1,
      title: "Sales Basics Quiz",
      contentType: "quiz",
      content: JSON.stringify({
        questions: [
          {
            question: "What is the first step in the sales process?",
            options: ["Closing", "Prospecting", "Negotiation", "Delivery"],
            correctAnswer: 1
          },
          {
            question: "What percentage of communication is non-verbal?",
            options: ["30%", "55%", "75%", "90%"],
            correctAnswer: 2
          }
        ]
      }),
      position: 2,
      createdAt: new Date()
    };
    
    // Store learning content
    this.learningContentData.set(salesBasicsIntro.id, salesBasicsIntro);
    this.learningContentData.set(salesBasicsQuiz.id, salesBasicsQuiz);
  }
  
  // Learning Skills methods
  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skillsData.values());
  }
  
  async getSkillById(id: number): Promise<Skill | undefined> {
    return this.skillsData.get(id);
  }
  
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return Array.from(this.skillsData.values())
      .filter(skill => skill.category === category);
  }
  
  async getSkillsByDifficulty(difficulty: string): Promise<Skill[]> {
    return Array.from(this.skillsData.values())
      .filter(skill => skill.difficulty === difficulty);
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const id = this.skillCurrentId++;
    const newSkill: Skill = {
      ...skill,
      id,
      createdAt: new Date()
    };
    
    this.skillsData.set(id, newSkill);
    return newSkill;
  }
  
  async updateSkill(id: number, skillData: Partial<InsertSkill>): Promise<Skill> {
    const skill = this.skillsData.get(id);
    if (!skill) {
      throw new Error(`Skill with id ${id} not found`);
    }
    
    const updatedSkill: Skill = {
      ...skill,
      ...skillData
    };
    
    this.skillsData.set(id, updatedSkill);
    return updatedSkill;
  }
  
  async deleteSkill(id: number): Promise<void> {
    if (!this.skillsData.has(id)) {
      throw new Error(`Skill with id ${id} not found`);
    }
    
    this.skillsData.delete(id);
    
    // Update learning paths that reference this skill
    for (const [pathId, path] of this.learningPathsData) {
      if (path.skillIds.includes(id)) {
        const updatedSkillIds = path.skillIds.filter(skillId => skillId !== id);
        const updatedPath: LearningPath = {
          ...path,
          skillIds: updatedSkillIds
        };
        this.learningPathsData.set(pathId, updatedPath);
      }
    }
    
    // Delete related user progress
    for (const [progressId, progress] of this.userProgressData) {
      if (progress.skillId === id) {
        this.userProgressData.delete(progressId);
      }
    }
    
    // Delete related learning content
    for (const [contentId, content] of this.learningContentData) {
      if (content.skillId === id) {
        this.learningContentData.delete(contentId);
      }
    }
  }
  
  // Learning Path methods
  async getAllLearningPaths(): Promise<LearningPath[]> {
    return Array.from(this.learningPathsData.values());
  }
  
  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    return this.learningPathsData.get(id);
  }
  
  async createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath> {
    const id = this.learningPathCurrentId++;
    const newLearningPath: LearningPath = {
      ...learningPath,
      id,
      createdAt: new Date()
    };
    
    this.learningPathsData.set(id, newLearningPath);
    return newLearningPath;
  }
  
  async updateLearningPath(id: number, pathData: Partial<InsertLearningPath>): Promise<LearningPath> {
    const path = this.learningPathsData.get(id);
    if (!path) {
      throw new Error(`Learning path with id ${id} not found`);
    }
    
    const updatedPath: LearningPath = {
      ...path,
      ...pathData
    };
    
    this.learningPathsData.set(id, updatedPath);
    return updatedPath;
  }
  
  async deleteLearningPath(id: number): Promise<void> {
    if (!this.learningPathsData.has(id)) {
      throw new Error(`Learning path with id ${id} not found`);
    }
    
    this.learningPathsData.delete(id);
  }
  
  async getSkillsForLearningPath(learningPathId: number): Promise<Skill[]> {
    const path = this.learningPathsData.get(learningPathId);
    if (!path) {
      throw new Error(`Learning path with id ${learningPathId} not found`);
    }
    
    return path.skillIds
      .map(skillId => this.skillsData.get(skillId))
      .filter((skill): skill is Skill => skill !== undefined);
  }
  
  // User Progress methods
  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressData.values())
      .filter(progress => progress.userId === userId);
  }
  
  async getUserProgressBySkill(skillId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressData.values())
      .filter(progress => progress.skillId === skillId);
  }
  
  async getUserProgressByUserAndSkill(userId: number, skillId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgressData.values())
      .find(progress => progress.userId === userId && progress.skillId === skillId);
  }
  
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = this.userProgressCurrentId++;
    const newProgress: UserProgress = {
      ...progress,
      id,
      dateStarted: new Date(),
      dateCompleted: progress.completed ? new Date() : null
    };
    
    this.userProgressData.set(id, newProgress);
    
    // If skill is completed, check for achievements
    if (newProgress.completed) {
      await this.checkAndAwardAchievements(newProgress.userId);
    }
    
    return newProgress;
  }
  
  async updateUserProgress(id: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress> {
    const progress = this.userProgressData.get(id);
    if (!progress) {
      throw new Error(`User progress with id ${id} not found`);
    }
    
    // If we're updating the status to completed, set the completion date
    let dateCompleted = progress.dateCompleted;
    if (progressData.completed && !progress.completed) {
      dateCompleted = new Date();
    }
    
    const updatedProgress: UserProgress = {
      ...progress,
      ...progressData,
      dateCompleted
    };
    
    this.userProgressData.set(id, updatedProgress);
    
    // If completion status changed to completed, check for achievements
    if (progressData.completed && !progress.completed) {
      await this.checkAndAwardAchievements(progress.userId);
    }
    
    return updatedProgress;
  }
  
  async completeSkill(userId: number, skillId: number): Promise<UserProgress> {
    // Check if progress exists
    const existingProgress = await this.getUserProgressByUserAndSkill(userId, skillId);
    
    if (existingProgress) {
      return this.updateUserProgress(existingProgress.id, { 
        completed: true,
        progress: 100
      });
    } else {
      return this.createUserProgress({
        userId,
        skillId,
        progress: 100,
        completed: true,
        notes: "Skill completed"
      });
    }
  }
  
  // Helper method to check for achievements
  private async checkAndAwardAchievements(userId: number): Promise<void> {
    // Get all completed skills for this user
    const userProgress = await this.getUserProgressByUser(userId);
    const completedSkills = userProgress
      .filter(progress => progress.completed)
      .map(progress => this.skillsData.get(progress.skillId))
      .filter((skill): skill is Skill => skill !== undefined);
    
    // Calculate total points
    const totalPoints = completedSkills.reduce((sum, skill) => sum + skill.points, 0);
    
    // Get user's existing achievements
    const userAchievements = await this.getUserAchievementsByUser(userId);
    const earnedAchievementIds = userAchievements.map(ua => ua.achievementId);
    
    // Check for achievements not yet earned
    const allAchievements = Array.from(this.achievementsData.values());
    for (const achievement of allAchievements) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement.id)) {
        continue;
      }
      
      // Check if requirements are met for this achievement
      if (totalPoints >= achievement.requiredPoints) {
        // Award the achievement
        await this.awardAchievement(userId, achievement.id);
      }
      
      // Check for specific skill category achievements (e.g., Sales Master)
      if (achievement.name === "Sales Master") {
        const salesSkills = await this.getSkillsByCategory("sales");
        const completedSalesSkillIds = completedSkills
          .filter(skill => skill.category === "sales")
          .map(skill => skill.id);
        
        if (salesSkills.every(skill => completedSalesSkillIds.includes(skill.id))) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      if (achievement.name === "Product Guru") {
        const productSkills = await this.getSkillsByCategory("product");
        const completedProductSkillIds = completedSkills
          .filter(skill => skill.category === "product")
          .map(skill => skill.id);
        
        if (productSkills.every(skill => completedProductSkillIds.includes(skill.id))) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
    }
  }
  
  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievementsData.values());
  }
  
  async getAchievementById(id: number): Promise<Achievement | undefined> {
    return this.achievementsData.get(id);
  }
  
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementCurrentId++;
    const newAchievement: Achievement = {
      ...achievement,
      id,
      createdAt: new Date()
    };
    
    this.achievementsData.set(id, newAchievement);
    return newAchievement;
  }
  
  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement> {
    const achievement = this.achievementsData.get(id);
    if (!achievement) {
      throw new Error(`Achievement with id ${id} not found`);
    }
    
    const updatedAchievement: Achievement = {
      ...achievement,
      ...achievementData
    };
    
    this.achievementsData.set(id, updatedAchievement);
    return updatedAchievement;
  }
  
  // User Achievement methods
  async getUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievementsData.values())
      .filter(userAchievement => userAchievement.userId === userId);
  }
  
  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    // Check if the user already has this achievement
    const existingAchievement = Array.from(this.userAchievementsData.values())
      .find(ua => ua.userId === userId && ua.achievementId === achievementId);
    
    if (existingAchievement) {
      return existingAchievement;
    }
    
    // Verify achievement exists
    const achievement = this.achievementsData.get(achievementId);
    if (!achievement) {
      throw new Error(`Achievement with id ${achievementId} not found`);
    }
    
    // Award the achievement
    const id = this.userAchievementCurrentId++;
    const userAchievement: UserAchievement = {
      id,
      userId,
      achievementId,
      dateEarned: new Date()
    };
    
    this.userAchievementsData.set(id, userAchievement);
    return userAchievement;
  }
  
  // Learning Content methods
  async getContentForSkill(skillId: number): Promise<LearningContent[]> {
    return Array.from(this.learningContentData.values())
      .filter(content => content.skillId === skillId)
      .sort((a, b) => a.position - b.position);
  }
  
  async createLearningContent(content: InsertLearningContent): Promise<LearningContent> {
    const id = this.learningContentCurrentId++;
    const newContent: LearningContent = {
      ...content,
      id,
      createdAt: new Date()
    };
    
    this.learningContentData.set(id, newContent);
    return newContent;
  }
  
  async updateLearningContent(id: number, contentData: Partial<InsertLearningContent>): Promise<LearningContent> {
    const content = this.learningContentData.get(id);
    if (!content) {
      throw new Error(`Learning content with id ${id} not found`);
    }
    
    const updatedContent: LearningContent = {
      ...content,
      ...contentData
    };
    
    this.learningContentData.set(id, updatedContent);
    return updatedContent;
  }
  
  async deleteLearningContent(id: number): Promise<void> {
    if (!this.learningContentData.has(id)) {
      throw new Error(`Learning content with id ${id} not found`);
    }
    
    this.learningContentData.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Learning Skills methods
  async getAllSkills(): Promise<Skill[]> {
    return await db.select().from(skills);
  }
  
  async getSkillById(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill || undefined;
  }
  
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.category, category));
  }
  
  async getSkillsByDifficulty(difficulty: string): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.difficulty, difficulty));
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }
  
  async updateSkill(id: number, skillData: Partial<InsertSkill>): Promise<Skill> {
    const [updatedSkill] = await db
      .update(skills)
      .set(skillData)
      .where(eq(skills.id, id))
      .returning();
      
    if (!updatedSkill) {
      throw new Error(`Skill with id ${id} not found`);
    }
    
    return updatedSkill;
  }
  
  async deleteSkill(id: number): Promise<void> {
    // Delete related user progress
    await db.delete(userProgress).where(eq(userProgress.skillId, id));
    
    // Delete related learning content
    await db.delete(learningContent).where(eq(learningContent.skillId, id));
    
    // Update learning paths
    const affectedPaths = await db
      .select()
      .from(learningPaths)
      .where(sql`${id} = ANY(${learningPaths.skillIds})`);
      
    for (const path of affectedPaths) {
      const updatedSkillIds = path.skillIds.filter(skillId => skillId !== id);
      await db
        .update(learningPaths)
        .set({ skillIds: updatedSkillIds })
        .where(eq(learningPaths.id, path.id));
    }
    
    // Delete the skill
    const result = await db.delete(skills).where(eq(skills.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Skill with id ${id} not found`);
    }
  }
  
  // Learning Path methods
  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await db.select().from(learningPaths);
  }
  
  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path || undefined;
  }
  
  async createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath> {
    const [newPath] = await db.insert(learningPaths).values(learningPath).returning();
    return newPath;
  }
  
  async updateLearningPath(id: number, pathData: Partial<InsertLearningPath>): Promise<LearningPath> {
    const [updatedPath] = await db
      .update(learningPaths)
      .set(pathData)
      .where(eq(learningPaths.id, id))
      .returning();
      
    if (!updatedPath) {
      throw new Error(`Learning path with id ${id} not found`);
    }
    
    return updatedPath;
  }
  
  async deleteLearningPath(id: number): Promise<void> {
    const result = await db.delete(learningPaths).where(eq(learningPaths.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Learning path with id ${id} not found`);
    }
  }
  
  async getSkillsForLearningPath(learningPathId: number): Promise<Skill[]> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, learningPathId));
    
    if (!path) {
      throw new Error(`Learning path with id ${learningPathId} not found`);
    }
    
    const pathSkills = await db
      .select()
      .from(skills)
      .where(sql`${skills.id} = ANY(ARRAY[${path.skillIds.join(',')}]::integer[])`);
      
    return pathSkills;
  }
  
  // User Progress methods
  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  
  async getUserProgressBySkill(skillId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.skillId, skillId));
  }
  
  async getUserProgressByUserAndSkill(userId: number, skillId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.skillId, skillId)
        )
      );
      
    return progress || undefined;
  }
  
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values({
        ...progress,
        dateCompleted: progress.completed ? new Date() : null
      })
      .returning();
      
    // If skill is completed, check for achievements
    if (newProgress.completed) {
      await this.checkAndAwardAchievements(newProgress.userId);
    }
    
    return newProgress;
  }
  
  async updateUserProgress(id: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress> {
    // Get current progress to check completion status change
    const [currentProgress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.id, id));
      
    if (!currentProgress) {
      throw new Error(`User progress with id ${id} not found`);
    }
    
    // Update dateCompleted if completion status is changing to true
    let dateCompleted = currentProgress.dateCompleted;
    if (progressData.completed && !currentProgress.completed) {
      dateCompleted = new Date();
    }
    
    const [updatedProgress] = await db
      .update(userProgress)
      .set({
        ...progressData,
        dateCompleted
      })
      .where(eq(userProgress.id, id))
      .returning();
      
    // If completion status changed to completed, check for achievements
    if (progressData.completed && !currentProgress.completed) {
      await this.checkAndAwardAchievements(currentProgress.userId);
    }
    
    return updatedProgress;
  }
  
  async completeSkill(userId: number, skillId: number): Promise<UserProgress> {
    // Check if progress exists
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.skillId, skillId)
        )
      );
    
    if (existingProgress) {
      return this.updateUserProgress(existingProgress.id, { 
        completed: true,
        progress: 100
      });
    } else {
      return this.createUserProgress({
        userId,
        skillId,
        progress: 100,
        completed: true,
        notes: "Skill completed"
      });
    }
  }
  
  // Helper method to check for achievements
  private async checkAndAwardAchievements(userId: number): Promise<void> {
    // Get all completed skills for user
    const completedSkills = await db
      .select()
      .from(userProgress)
      .innerJoin(skills, eq(userProgress.skillId, skills.id))
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.completed, true)
        )
      );
    
    // Calculate total points
    const totalPoints = completedSkills.reduce((sum, { skills }) => sum + skills.points, 0);
    
    // Get user's existing achievements
    const userAchievements = await this.getUserAchievementsByUser(userId);
    const earnedAchievementIds = userAchievements.map(ua => ua.achievementId);
    
    // Check for achievements not yet earned
    const allAchievements = await db.select().from(achievements);
    
    for (const achievement of allAchievements) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement.id)) {
        continue;
      }
      
      // Check if requirements are met for this achievement
      if (totalPoints >= achievement.requiredPoints) {
        // Award the achievement
        await this.awardAchievement(userId, achievement.id);
      }
      
      // Check for specific skill category achievements
      if (achievement.name === "Sales Master") {
        const salesSkills = await this.getSkillsByCategory("sales");
        const completedSalesSkillIds = completedSkills
          .filter(({ skills }) => skills.category === "sales")
          .map(({ skills }) => skills.id);
        
        if (salesSkills.every(skill => completedSalesSkillIds.includes(skill.id))) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
      
      if (achievement.name === "Product Guru") {
        const productSkills = await this.getSkillsByCategory("product");
        const completedProductSkillIds = completedSkills
          .filter(({ skills }) => skills.category === "product")
          .map(({ skills }) => skills.id);
        
        if (productSkills.every(skill => completedProductSkillIds.includes(skill.id))) {
          await this.awardAchievement(userId, achievement.id);
        }
      }
    }
  }
  
  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }
  
  async getAchievementById(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement || undefined;
  }
  
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }
  
  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement> {
    const [updatedAchievement] = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
      
    if (!updatedAchievement) {
      throw new Error(`Achievement with id ${id} not found`);
    }
    
    return updatedAchievement;
  }
  
  // User Achievement methods
  async getUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }
  
  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    // Check if user already has this achievement
    const [existingAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
      
    if (existingAchievement) {
      return existingAchievement;
    }
    
    // Verify achievement exists
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, achievementId));
    if (!achievement) {
      throw new Error(`Achievement with id ${achievementId} not found`);
    }
    
    // Award the achievement
    const [userAchievement] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
        dateEarned: new Date()
      })
      .returning();
      
    return userAchievement;
  }
  
  // Learning Content methods
  async getContentForSkill(skillId: number): Promise<LearningContent[]> {
    return await db
      .select()
      .from(learningContent)
      .where(eq(learningContent.skillId, skillId))
      .orderBy(learningContent.position);
  }
  
  async createLearningContent(content: InsertLearningContent): Promise<LearningContent> {
    const [newContent] = await db.insert(learningContent).values(content).returning();
    return newContent;
  }
  
  async updateLearningContent(id: number, contentData: Partial<InsertLearningContent>): Promise<LearningContent> {
    const [updatedContent] = await db
      .update(learningContent)
      .set(contentData)
      .where(eq(learningContent.id, id))
      .returning();
      
    if (!updatedContent) {
      throw new Error(`Learning content with id ${id} not found`);
    }
    
    return updatedContent;
  }
  
  async deleteLearningContent(id: number): Promise<void> {
    const result = await db.delete(learningContent).where(eq(learningContent.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Learning content with id ${id} not found`);
    }
  }

  // KPI Settings methods
  async getKpiSettings(): Promise<KpiSettings> {
    const [settings] = await db.select().from(kpiSettings);
    
    if (!settings) {
      // Create default KPI settings if none exists
      const defaultSettings: InsertKpiSettings = {
        targetLargeVisit: 15,
        targetMediumVisit: 20,
        targetSmallVisit: 25,
        targetLargeContract: 8,
        targetMediumContract: 12,
        targetSmallContract: 10,
        visitThreshold: 80,
        contractThreshold: 80,
        largeCafeBonus: 100,
        mediumCafeBonus: 75,
        smallCafeBonus: 50,
        baseSalaryPercentage: 30,
        totalTargetSalary: 3000,
        visitKpiPercentage: 50,
        contractKpiPercentage: 50,
        representativeName: ''
      };
      
      const [newSettings] = await db.insert(kpiSettings).values(defaultSettings).returning();
      return newSettings;
    }
    
    return settings;
  }

  async saveKpiSettings(settings: InsertKpiSettings): Promise<KpiSettings> {
    // Get existing settings if any
    const [existingSettings] = await db.select().from(kpiSettings);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(kpiSettings)
        .set(settings)
        .where(eq(kpiSettings.id, existingSettings.id))
        .returning();
      
      // Recalculate current month's performance
      const currentDate = new Date();
      await this.recalculateMonthPerformance(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(kpiSettings).values(settings).returning();
      return newSettings;
    }
  }

  // Helper method to recalculate a month's performance based on KPI settings
  private async recalculateMonthPerformance(year: number, month: number): Promise<void> {
    const kpiSettings = await this.getKpiSettings();
    const monthDate = new Date(year, month - 1, 1);
    
    // Get performance for the specified month
    const [performance] = await db.select()
      .from(monthlyPerformance)
      .where(
        and(
          sql`extract(year from ${monthlyPerformance.month}) = ${year}`,
          sql`extract(month from ${monthlyPerformance.month}) = ${month}`
        )
      );
    
    if (performance) {
      // Calculate base salary
      const baseSalary = Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100));
      
      // Calculate potential KPI bonus (total amount available for KPI-based compensation)
      const potentialKpiBonus = kpiSettings.totalTargetSalary - baseSalary;
      
      // Calculate contract bonuses
      const contractBonus = 
        performance.largeContracts * kpiSettings.largeCafeBonus +
        performance.mediumContracts * kpiSettings.mediumCafeBonus +
        performance.smallContracts * kpiSettings.smallCafeBonus;
      
      // Calculate contract threshold
      const totalContracts = performance.largeContracts + performance.mediumContracts + performance.smallContracts;
      const totalContractTargets = 
        kpiSettings.targetLargeContract + 
        kpiSettings.targetMediumContract + 
        kpiSettings.targetSmallContract;
      
      const contractPercentage = totalContractTargets > 0 ? (totalContracts / totalContractTargets) * 100 : 0;
      
      // Calculate visit threshold
      const totalVisits = performance.largeVisits + performance.mediumVisits + performance.smallVisits;
      const totalVisitTargets = 
        kpiSettings.targetLargeVisit + 
        kpiSettings.targetMediumVisit + 
        kpiSettings.targetSmallVisit;
      
      const visitPercentage = totalVisitTargets > 0 ? (totalVisits / totalVisitTargets) * 100 : 0;
      
      // Calculate visit bonus based on visitKpiPercentage (default to 50% if not set)
      const visitKpiPercentage = kpiSettings.visitKpiPercentage || 50;
      const visitBonusBase = potentialKpiBonus * (visitKpiPercentage / 100);
      const visitBonus = visitPercentage >= kpiSettings.visitThreshold 
        ? Math.round(visitBonusBase * (visitPercentage / 100))
        : 0;
      
      // Calculate contract bonus based on contractKpiPercentage (default to 50% if not set)
      const contractKpiPercentage = kpiSettings.contractKpiPercentage || 50;
      const contractBonusBase = potentialKpiBonus * (contractKpiPercentage / 100);
      const finalContractBonus = contractPercentage >= kpiSettings.contractThreshold 
        ? Math.min(contractBonus, contractBonusBase)
        : 0;
      
      const kpiBonus = visitBonus + finalContractBonus;
      const totalSalary = baseSalary + kpiBonus;
      
      // Update the performance
      await db.update(monthlyPerformance)
        .set({
          baseSalary,
          kpiBonus,
          totalSalary
        })
        .where(eq(monthlyPerformance.id, performance.id));
    }
  }

  // Cafe methods
  async getAllCafes(): Promise<Cafe[]> {
    return await db.select().from(cafes);
  }

  async getCafeById(id: number): Promise<Cafe | undefined> {
    const [cafe] = await db.select().from(cafes).where(eq(cafes.id, id));
    return cafe || undefined;
  }

  async createCafe(cafe: InsertCafe): Promise<Cafe> {
    const [newCafe] = await db.insert(cafes).values(cafe).returning();
    return newCafe;
  }

  async updateCafe(id: number, cafeData: Partial<InsertCafe>): Promise<Cafe> {
    const [updatedCafe] = await db
      .update(cafes)
      .set(cafeData)
      .where(eq(cafes.id, id))
      .returning();
    
    if (!updatedCafe) {
      throw new Error(`Cafe with id ${id} not found`);
    }
    
    return updatedCafe;
  }

  async deleteCafe(id: number): Promise<void> {
    // First delete related activities (foreign key constraint)
    await db.delete(activities).where(eq(activities.cafeId, id));
    
    // Then delete the cafe
    const result = await db.delete(cafes).where(eq(cafes.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Cafe with id ${id} not found`);
    }
  }

  // Activity methods
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Performance methods
  async getCurrentMonthPerformance(): Promise<MonthlyPerformance> {
    const currentDate = new Date();
    return this.getMonthPerformance(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }

  async getMonthPerformance(year: number, month: number): Promise<MonthlyPerformance> {
    const monthDate = new Date(year, month - 1, 1);
    
    // Try to get existing performance data
    const [performance] = await db.select()
      .from(monthlyPerformance)
      .where(
        and(
          sql`extract(year from ${monthlyPerformance.month}) = ${year}`,
          sql`extract(month from ${monthlyPerformance.month}) = ${month}`
        )
      );
    
    if (performance) {
      return performance;
    }
    
    // If no performance data exists, create a new one
    const kpiSettings = await this.getKpiSettings();
    const baseSalary = Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100));
    
    const newPerformance: InsertMonthlyPerformance = {
      month: monthDate.toISOString() as any, // Convert date to ISO string for DB
      largeVisits: 0,
      mediumVisits: 0,
      smallVisits: 0,
      largeContracts: 0,
      mediumContracts: 0,
      smallContracts: 0,
      baseSalary,
      kpiBonus: 0,
      totalSalary: baseSalary
    };
    
    const [createdPerformance] = await db.insert(monthlyPerformance).values(newPerformance).returning();
    return createdPerformance;
  }

  async getPerformanceHistory(limit: number = 12): Promise<MonthlyPerformance[]> {
    return await db.select()
      .from(monthlyPerformance)
      .orderBy(desc(monthlyPerformance.month))
      .limit(limit);
  }

  async updateMonthPerformance(year: number, month: number, performanceData: Partial<MonthlyPerformance>): Promise<MonthlyPerformance> {
    // Get existing performance
    const [existingPerformance] = await db.select()
      .from(monthlyPerformance)
      .where(
        and(
          sql`extract(year from ${monthlyPerformance.month}) = ${year}`,
          sql`extract(month from ${monthlyPerformance.month}) = ${month}`
        )
      );
    
    if (existingPerformance) {
      // Update existing performance
      const [updatedPerformance] = await db
        .update(monthlyPerformance)
        .set(performanceData)
        .where(eq(monthlyPerformance.id, existingPerformance.id))
        .returning();
      
      return updatedPerformance;
    } else {
      // Create new performance if it doesn't exist
      const performance = await this.getMonthPerformance(year, month);
      const [updatedPerformance] = await db
        .update(monthlyPerformance)
        .set(performanceData)
        .where(eq(monthlyPerformance.id, performance.id))
        .returning();
      
      return updatedPerformance;
    }
  }
}

// Make this a Memory Storage for faster development and testing
// For production, use the DatabaseStorage
export const storage = new MemStorage();