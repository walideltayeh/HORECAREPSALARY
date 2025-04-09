import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Award, BookOpen, Play } from 'lucide-react';
import SkillCard from '@/components/learning/SkillCard';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';

export default function LearningPathDetails() {
  const params = useParams<{ id: string }>();
  const pathId = params.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const userId = 1; // For this proof of concept, we're using a fixed userId
  
  // Fetch learning path details
  const { data: learningPath, isLoading: pathLoading } = useQuery({
    queryKey: ['/api/learning-paths', pathId],
    queryFn: ({ queryKey }) => 
      fetch(`/api/learning-paths/${queryKey[1]}`).then(res => res.json()),
    enabled: !!pathId && !isNaN(pathId)
  });
  
  // Fetch skills for this learning path
  const { data: pathSkills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/learning-paths', pathId, 'skills'],
    queryFn: ({ queryKey }) => 
      fetch(`/api/learning-paths/${queryKey[1]}/skills`).then(res => res.json()),
    enabled: !!pathId && !isNaN(pathId)
  });
  
  // Fetch user progress
  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/users', userId, 'progress'],
    queryFn: ({ queryKey }) => 
      fetch(`/api/users/${queryKey[1]}/progress`)
        .then(res => res.json())
        .catch(() => []),
    retry: false
  });
  
  // Calculate progress for this path
  const calculateProgress = () => {
    if (!pathSkills || pathSkills.length === 0 || !userProgress) return 0;
    
    const pathSkillIds = pathSkills.map((skill: any) => skill.id);
    const completedPathSkills = userProgress.filter(
      (progress: any) => 
        pathSkillIds.includes(progress.skillId) && 
        progress.completed
    );
    
    return Math.round((completedPathSkills.length / pathSkillIds.length) * 100);
  };
  
  const progress = skillsLoading || progressLoading ? 0 : calculateProgress();
  
  // Get the user progress for a specific skill
  const getSkillStatus = (skillId: number) => {
    if (!userProgress) return 'available';
    
    const progress = userProgress.find((p: any) => p.skillId === skillId);
    if (!progress) return 'available';
    if (progress.completed) return 'completed';
    if (progress.startedAt) return 'in-progress';
    return 'available';
  };
  
  // Get skills ordered by their dependency chain
  const getOrderedSkills = (skills: any[]) => {
    if (!skills || skills.length === 0) return [];
    
    // Simple implementation - in a real app, you'd implement a topological sort
    // based on prerequisites
    return [...skills].sort((a, b) => a.points - b.points);
  };
  
  const orderedSkills = pathSkills ? getOrderedSkills(pathSkills) : [];
  
  const handleGoBack = () => {
    setLocation('/learning-paths');
  };
  
  // Handle PDF export
  const handleExportPdf = () => {
    if (!learningPath || !pathSkills) return;
    
    const title = `${learningPath.name} Learning Path`;
    
    const skillsData = pathSkills.map((skill: any) => [
      skill.name,
      skill.category,
      skill.difficulty,
      skill.points,
      getSkillStatus(skill.id)
    ]);
    
    exportToPdf({
      title,
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      tables: [
        {
          title: 'Path Overview',
          head: [['Name', 'Description', 'Skills', 'Progress']],
          body: [[
            learningPath.name,
            learningPath.description,
            pathSkills.length,
            `${progress}%`
          ]]
        },
        {
          title: 'Skills in This Path',
          head: [['Skill Name', 'Category', 'Difficulty', 'Points', 'Status']],
          body: skillsData
        }
      ]
    });
  };
  
  // Handle Excel export
  const handleExportExcel = () => {
    if (!learningPath || !pathSkills) return;
    
    // Path overview data with header
    const overviewData = [
      ['Name', 'Description', 'Skills', 'Progress'],
      [
        learningPath.name,
        learningPath.description,
        pathSkills.length,
        `${progress}%`
      ]
    ];
    
    // Skills data with header
    const skillsData = pathSkills.map((skill: any) => [
      skill.name,
      skill.category,
      skill.difficulty,
      skill.points,
      getSkillStatus(skill.id)
    ]);
    
    const skillsWithHeader = [
      ['Skill Name', 'Category', 'Difficulty', 'Points', 'Status'],
      ...skillsData
    ];
    
    exportToExcel({
      title: `${learningPath.name} Learning Path`,
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      sheets: [
        {
          name: 'Path Overview',
          data: overviewData
        },
        {
          name: 'Skills',
          data: skillsWithHeader
        }
      ]
    });
  };
  
  if (pathLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <Skeleton className="h-4 w-full max-w-[70%]" />
        
        <Skeleton className="h-16 w-full rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!learningPath) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Learning Paths
        </Button>
        
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-2">Learning Path Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The learning path you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleGoBack}>Go Back to Learning Paths</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="self-start -ml-2" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Learning Paths
        </Button>
        
        <PageHeader 
          title={learningPath.name}
          description={learningPath.description}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="font-semibold">
                  {pathSkills 
                    ? `${userProgress?.filter((p: any) => 
                        learningPath.skillIds.includes(p.skillId) && 
                        p.completed
                      ).length || 0} of ${pathSkills.length} skills completed`
                    : 'Loading skills...'
                  }
                </span>
              </div>
              
              <div className="flex items-center mb-1">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="ml-3 font-medium text-sm">{progress}%</span>
              </div>
            </div>
            
            {!progressLoading && userProgress && pathSkills && (
              <Button 
                className="gap-2"
                size="sm"
                variant={progress === 100 ? "outline" : "default"}
              >
                {progress === 100 ? (
                  <>
                    <Award className="h-4 w-4" />
                    Path Completed
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Continue Learning
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="overview">Path Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="skills" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))
            ) : (
              orderedSkills.map((skill: any) => (
                <SkillCard 
                  key={skill.id} 
                  skill={skill} 
                  status={getSkillStatus(skill.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <div className="prose prose-sm max-w-none">
            <h2>About This Learning Path</h2>
            <p>{learningPath.description}</p>
            
            <h3>What You'll Learn</h3>
            <ul>
              {skillsLoading ? (
                <li>Loading skills...</li>
              ) : (
                pathSkills.slice(0, 5).map((skill: any) => (
                  <li key={skill.id}>{skill.name}</li>
                ))
              )}
            </ul>
            
            <h3>Path Completion Requirements</h3>
            <p>To complete this learning path, you need to master all the skills included in it. Each skill has its own completion criteria, typically involving completing associated lessons and quizzes.</p>
            
            <h3>Benefits of Completion</h3>
            <p>When you complete this learning path, you'll earn an achievement and gain valuable skills that will help you advance in your career as a coffee shop representative.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}