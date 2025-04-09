import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  Check, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  BadgeCheck,
  PlayCircle
} from 'lucide-react';
import { difficultyColors } from '@/components/learning/SkillCard';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import ContentViewer from '@/components/learning/ContentViewer';
import { useToast } from '@/hooks/use-toast';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';

export default function SkillDetails() {
  const params = useParams<{ id: string }>();
  const skillId = params.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = 1; // For this proof of concept, we're using a fixed userId
  
  // Fetch skill details
  const { data: skill, isLoading: skillLoading } = useQuery({
    queryKey: ['/api/skills', skillId],
    queryFn: ({ queryKey }) => 
      fetch(`/api/skills/${queryKey[1]}`).then(res => res.json()),
    enabled: !!skillId && !isNaN(skillId)
  });
  
  // Fetch learning content for this skill
  const { data: skillContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/skills', skillId, 'content'],
    queryFn: ({ queryKey }) => 
      fetch(`/api/skills/${queryKey[1]}/content`).then(res => res.json()),
    enabled: !!skillId && !isNaN(skillId)
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
  
  // Get the user progress for this skill
  const getSkillProgress = () => {
    if (!userProgress || progressLoading) return null;
    
    return userProgress.find((p: any) => p.skillId === skillId);
  };
  
  const skillProgress = getSkillProgress();
  
  // Start learning mutation
  const startLearningMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/users/${userId}/progress`, {
        skillId,
        startedAt: new Date().toISOString(),
        completed: false
      });
    },
    onSuccess: () => {
      toast({
        title: 'Started learning',
        description: 'Your progress has been saved.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'progress'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to start learning',
        description: error.message || 'An error occurred.',
      });
    }
  });
  
  // Complete skill mutation
  const completeSkillMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/users/${userId}/skills/${skillId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Skill completed',
        description: 'Congratulations! You have completed this skill.',
      });
      
      // Invalidate both progress and achievements as completing a skill might
      // unlock an achievement
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'achievements'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to complete skill',
        description: error.message || 'An error occurred.',
      });
    }
  });
  
  const handleGoBack = () => {
    setLocation('/learning-paths');
  };
  
  const handleStartLearning = () => {
    if (!skillProgress) {
      startLearningMutation.mutate();
    }
  };
  
  const handleCompleteSkill = () => {
    completeSkillMutation.mutate();
  };
  
  // Handle PDF export
  const handleExportPdf = () => {
    if (!skill || !skillContent) return;
    
    const title = `${skill.name} Skill Details`;
    
    const contentData = skillContent.map((content: any) => [
      content.contentType,
      content.title || content.content.substring(0, 50) + '...',
      skillProgress?.completed ? 'Completed' : (skillProgress?.startedAt ? 'In Progress' : 'Not Started')
    ]);
    
    exportToPdf({
      title,
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      tables: [
        {
          title: 'Skill Overview',
          head: [['Name', 'Category', 'Difficulty', 'Points', 'Status']],
          body: [[
            skill.name,
            skill.category,
            skill.difficulty,
            skill.points,
            skillProgress?.completed 
              ? 'Completed' 
              : (skillProgress?.startedAt ? 'In Progress' : 'Not Started')
          ]]
        },
        {
          title: 'Learning Content',
          head: [['Content Type', 'Content Summary', 'Status']],
          body: contentData
        }
      ]
    });
  };
  
  // Handle Excel export
  const handleExportExcel = () => {
    if (!skill || !skillContent) return;
    
    // Overview data with header
    const overviewData = [
      ['Name', 'Category', 'Difficulty', 'Points', 'Status'],
      [
        skill.name,
        skill.category,
        skill.difficulty,
        skill.points,
        skillProgress?.completed 
          ? 'Completed' 
          : (skillProgress?.startedAt ? 'In Progress' : 'Not Started')
      ]
    ];
    
    // Content data with header
    const contentData = skillContent.map((content: any) => [
      content.contentType,
      content.title || 'Untitled Content',
      skillProgress?.completed ? 'Completed' : (skillProgress?.startedAt ? 'In Progress' : 'Not Started')
    ]);
    
    const contentWithHeader = [
      ['Content Type', 'Title', 'Status'],
      ...contentData
    ];
    
    exportToExcel({
      title: `${skill.name} Skill Details`,
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      sheets: [
        {
          name: 'Skill Overview',
          data: overviewData
        },
        {
          name: 'Learning Content',
          data: contentWithHeader
        }
      ]
    });
  };
  
  if (skillLoading) {
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
        
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Learning Content</TabsTrigger>
            <TabsTrigger value="about">About This Skill</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  if (!skill) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Learning
        </Button>
        
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-2">Skill Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The skill you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleGoBack}>Go Back to Learning</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="self-start -ml-2" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Learning
        </Button>
        
        <PageHeader 
          title={skill.name}
          description={skill.description}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className="capitalize">{skill.category}</Badge>
        <Badge 
          variant="outline" 
          className={`capitalize ${difficultyColors[skill.difficulty] || ''}`}
        >
          {skill.difficulty}
        </Badge>
        <Badge variant="outline">{skill.points} points</Badge>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              {skillProgress?.completed ? (
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : skillProgress?.startedAt ? (
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                  <Clock className="h-5 w-5" />
                </div>
              ) : (
                <div className="p-2 bg-primary/10 rounded-full">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
              
              <div>
                <p className="font-medium">
                  {skillProgress?.completed 
                    ? 'Completed' 
                    : skillProgress?.startedAt 
                      ? 'In Progress' 
                      : 'Not Started'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {skillProgress?.completed 
                    ? `Completed on ${new Date(skillProgress.completedAt).toLocaleDateString()}` 
                    : skillProgress?.startedAt 
                      ? `Started on ${new Date(skillProgress.startedAt).toLocaleDateString()}` 
                      : 'Start learning this skill to track your progress'}
                </p>
              </div>
            </div>
            
            {!skillProgress?.completed && (
              skillProgress?.startedAt ? (
                <Button 
                  onClick={handleCompleteSkill}
                  disabled={completeSkillMutation.isPending}
                  className="gap-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  {completeSkillMutation.isPending ? 'Completing...' : 'Mark as Completed'}
                </Button>
              ) : (
                <Button 
                  onClick={handleStartLearning}
                  disabled={startLearningMutation.isPending}
                  className="gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  {startLearningMutation.isPending ? 'Starting...' : 'Start Learning'}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Learning Content</TabsTrigger>
          <TabsTrigger value="about">About This Skill</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-6">
          {contentLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
              ))}
            </div>
          ) : !skillContent || skillContent.length === 0 ? (
            <Alert>
              <AlertTitle>No content available</AlertTitle>
              <AlertDescription>
                There is no learning content available for this skill yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-8">
              {skillContent.map((content: any) => (
                <Card key={content.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{content.title || `${content.contentType} Content`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContentViewer content={content} />
                  </CardContent>
                </Card>
              ))}
              
              {/* Show completion button at the end of content */}
              {!skillProgress?.completed && skillProgress?.startedAt && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={handleCompleteSkill}
                    disabled={completeSkillMutation.isPending}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {completeSkillMutation.isPending 
                      ? 'Completing...' 
                      : 'I Have Completed This Skill'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <div className="prose prose-sm max-w-none">
            <h2>About This Skill</h2>
            <p>{skill.description}</p>
            
            <h3>Learning Objectives</h3>
            <p>By mastering this skill, you will:</p>
            <ul>
              <li>Understand key concepts related to {skill.name}</li>
              <li>Be able to apply these concepts in real-world scenarios</li>
              <li>Add value to your team's efforts</li>
            </ul>
            
            <h3>Skill Level</h3>
            <p>This is a <strong>{skill.difficulty}</strong> level skill that requires {skill.difficulty === 'beginner' ? 'little to no' : skill.difficulty === 'intermediate' ? 'some' : 'significant'} prior knowledge.</p>
            
            <h3>Points Awarded</h3>
            <p>Completing this skill will award you <strong>{skill.points} points</strong> towards your achievements.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}