import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import fs from "fs";
import { getCafeSize } from "../shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Create the upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const randomName = randomBytes(16).toString("hex");
    const fileExtension = path.extname(file.originalname);
    cb(null, `${randomName}${fileExtension}`);
  },
});

const upload = multer({ 
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed") as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
  // Upload endpoint
  app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the file path that can be accessed via the static route
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
  
  // KPI Settings
  app.get('/api/kpi-settings', async (req, res) => {
    try {
      const settings = await storage.getKpiSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/kpi-settings', async (req, res) => {
    try {
      const settings = await storage.saveKpiSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Cafes
  app.get('/api/cafes', async (req, res) => {
    try {
      const cafes = await storage.getAllCafes();
      res.json(cafes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/cafes/:id', async (req, res) => {
    try {
      const cafe = await storage.getCafeById(parseInt(req.params.id));
      if (!cafe) {
        return res.status(404).json({ message: 'Cafe not found' });
      }
      res.json(cafe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/cafes', async (req, res) => {
    try {
      const cafe = await storage.createCafe(req.body);
      
      // No need to create an activity or update performance here
      // as it's already handled in the storage.createCafe method
      
      res.status(201).json(cafe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/cafes/:id', async (req, res) => {
    try {
      const cafeId = parseInt(req.params.id);
      const oldCafe = await storage.getCafeById(cafeId);
      if (!oldCafe) {
        return res.status(404).json({ message: 'Cafe not found' });
      }
      
      // The storage.updateCafe method already handles:
      // - Creating the update activity
      // - Creating status change activity if needed
      // - Updating performance metrics based on changes
      const updatedCafe = await storage.updateCafe(cafeId, req.body);
      
      res.json(updatedCafe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/cafes/:id', async (req, res) => {
    try {
      const cafeId = parseInt(req.params.id);
      const cafe = await storage.getCafeById(cafeId);
      if (!cafe) {
        return res.status(404).json({ message: 'Cafe not found' });
      }
      
      // The storage.deleteCafe method already handles updating performance metrics
      await storage.deleteCafe(cafeId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Activities
  app.get('/api/activities', async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Performance
  app.get('/api/performance/current', async (req, res) => {
    try {
      const performance = await storage.getCurrentMonthPerformance();
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/performance/history', async (req, res) => {
    try {
      const history = await storage.getPerformanceHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/performance/:yearMonth', async (req, res) => {
    try {
      const [year, month] = req.params.yearMonth.split('-').map(Number);
      const performance = await storage.getMonthPerformance(year, month);
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Routes for learning center have been removed

  // Helper function to update monthly performance when cafe status changes
  async function updatePerformanceForCafe(cafe: any, isReversal = false) {
    const cafeSize = getCafeSize(cafe.hookahCount);
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Get current performance
    const performance = await storage.getMonthPerformance(year, month);
    
    // Create a copy for updates
    const updatedPerformance = { ...performance };
    
    // Factor is 1 for additions, -1 for reversals (removals)
    const factor = isReversal ? -1 : 1;
    
    // Update visit counts - only when status is relevant
    if (cafe.status === 'visited' || cafe.status === 'contracted') {
      if (cafeSize === 'large') {
        updatedPerformance.largeVisits += factor;
      } else if (cafeSize === 'medium') {
        updatedPerformance.mediumVisits += factor;
      } else {
        updatedPerformance.smallVisits += factor;
      }
    }
    
    // Update contract counts - only when contracted
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
    const kpiSettings = await storage.getKpiSettings();
    
    // Calculate base salary
    updatedPerformance.baseSalary = Math.round(kpiSettings.totalTargetSalary * (kpiSettings.baseSalaryPercentage / 100));
    
    // Calculate potential KPI bonus
    const potentialKpiBonus = kpiSettings.totalTargetSalary - updatedPerformance.baseSalary;
    
    // Calculate contract bonuses
    const largeCafeBonus = updatedPerformance.largeContracts * kpiSettings.largeCafeBonus;
    const mediumCafeBonus = updatedPerformance.mediumContracts * kpiSettings.mediumCafeBonus;
    const smallCafeBonus = updatedPerformance.smallContracts * kpiSettings.smallCafeBonus;
    const contractBonus = largeCafeBonus + mediumCafeBonus + smallCafeBonus;
    
    // Calculate visit KPI
    const totalVisits = updatedPerformance.largeVisits + updatedPerformance.mediumVisits + updatedPerformance.smallVisits;
    const totalVisitTargets = kpiSettings.targetLargeVisit + kpiSettings.targetMediumVisit + kpiSettings.targetSmallVisit;
    const visitPercentage = totalVisitTargets > 0 ? (totalVisits / totalVisitTargets) * 100 : 0;
    
    // Calculate contract KPI percentage
    const totalContracts = updatedPerformance.largeContracts + updatedPerformance.mediumContracts + updatedPerformance.smallContracts;
    const totalContractTargets = kpiSettings.targetLargeContract + kpiSettings.targetMediumContract + kpiSettings.targetSmallContract;
    const contractPercentage = totalContractTargets > 0 ? (totalContracts / totalContractTargets) * 100 : 0;
    
    // Apply the contract threshold - only apply contract bonuses if the threshold is met
    const appliedContractBonus = contractPercentage >= kpiSettings.contractThreshold ? contractBonus : 0;
    
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
      ? Math.min(appliedContractBonus, contractBonusBase)
      : 0;
    
    // Set KPI bonus and total salary
    updatedPerformance.kpiBonus = visitBonus + finalContractBonus;
    updatedPerformance.totalSalary = updatedPerformance.baseSalary + updatedPerformance.kpiBonus;
    
    // Save updated performance
    await storage.updateMonthPerformance(year, month, updatedPerformance);
  }

  const httpServer = createServer(app);
  return httpServer;
}
