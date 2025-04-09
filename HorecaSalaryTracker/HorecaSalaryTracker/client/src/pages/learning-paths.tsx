import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Briefcase, Award, Trophy, BarChart3 } from 'lucide-react';
import LearningPathCard from '@/components/learning/LearningPathCard';
import SkillCard from '@/components/learning/SkillCard';
import AchievementCard from '@/components/learning/AchievementCard';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';

export default function LearningPaths() {
  const [searchTerm, setSearchTerm] = useState('');
  const userId = 1; // For this proof of concept, we're using a fixed userId

  // Fetch all learning paths
  const { data: learningPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ['/api/learning-paths'],
    queryFn: () => fetch('/api/learning-paths').then(res => res.json())
  });

  // Fetch all skills
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  // Fetch all achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: () => fetch('/api/achievements').then(res => res.json())
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

  // Filter learning paths by search term
  const filteredPaths = !pathsLoading && learningPaths
    ? learningPaths.filter((path: any) => 
        path.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        path.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Filter skills by search term
  const filteredSkills = !skillsLoading && skills
    ? skills.filter((skill: any) => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        skill.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Filter achievements by search term
  const filteredAchievements = !achievementsLoading && achievements
    ? achievements.filter((achievement: any) => 
        achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Get the user progress for a specific skill
  const getSkillStatus = (skillId: number) => {
    if (!userProgress) return 'available';
    
    const progress = userProgress.find((p: any) => p.skillId === skillId);
    if (!progress) return 'available';
    if (progress.completed) return 'completed';
    if (progress.startedAt) return 'in-progress';
    return 'available';
  };

  // Handle PDF export
  const handleExportPdf = () => {
    const title = 'Learning Paths Report';
    
    const pathsData = !pathsLoading && learningPaths ? learningPaths.map((path: any) => {
      // Calculate progress for this path
      const pathSkillIds = path.skillIds;
      let progress = 0;
      
      if (userProgress && pathSkillIds.length > 0) {
        const completedPathSkills = userProgress.filter(
          (p: any) => pathSkillIds.includes(p.skillId) && p.completed
        );
        progress = Math.round((completedPathSkills.length / pathSkillIds.length) * 100);
      }
      
      return [
        path.name,
        path.description,
        pathSkillIds.length,
        `${progress}%`
      ];
    }) : [];
    
    exportToPdf({
      title,
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      tables: [
        {
          title: 'Learning Paths',
          head: [['Path Name', 'Description', 'Skills', 'Progress']],
          body: pathsData
        }
      ]
    });
  };

  // Handle Excel export
  const handleExportExcel = () => {
    // Data for Learning Paths sheet
    const pathsData = !pathsLoading && learningPaths ? learningPaths.map((path: any) => {
      // Calculate progress for this path
      const pathSkillIds = path.skillIds;
      let progress = 0;
      
      if (userProgress && pathSkillIds.length > 0) {
        const completedPathSkills = userProgress.filter(
          (p: any) => pathSkillIds.includes(p.skillId) && p.completed
        );
        progress = Math.round((completedPathSkills.length / pathSkillIds.length) * 100);
      }
      
      return [
        path.name,
        path.description,
        pathSkillIds.length,
        `${progress}%`
      ];
    }) : [];
    
    // Add header row
    const pathsWithHeader = [['Path Name', 'Description', 'Skills', 'Progress'], ...pathsData];
    
    // Data for Skills sheet
    const skillsData = !skillsLoading && skills ? skills.map((skill: any) => [
      skill.name,
      skill.category,
      skill.difficulty,
      skill.points,
      getSkillStatus(skill.id)
    ]) : [];
    
    // Add header row
    const skillsWithHeader = [['Skill Name', 'Category', 'Difficulty', 'Points', 'Status'], ...skillsData];
    
    exportToExcel({
      title: 'Learning Report',
      representativeName: 'Sales Representative', // Use the actual rep name from global state
      sheets: [
        {
          name: 'Learning Paths',
          data: pathsWithHeader
        },
        {
          name: 'Skills',
          data: skillsWithHeader
        }
      ]
    });
  };

  // Calculate total progress across all skills
  const calculateTotalProgress = () => {
    if (!skills || skillsLoading || !userProgress) return 0;
    
    const totalSkills = skills.length;
    if (totalSkills === 0) return 0;
    
    const completedSkills = userProgress.filter((p: any) => p.completed).length;
    return Math.round((completedSkills / totalSkills) * 100);
  };

  const totalProgress = calculateTotalProgress();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Learning Center" 
        description="Develop your skills and advance your career"
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">{totalProgress}%</span>
          </div>
          <h3 className="text-lg font-medium mb-1">Overall Progress</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {!progressLoading && userProgress 
              ? `${userProgress.filter((p: any) => p.completed).length} of ${skills?.length || 0} skills completed`
              : 'Loading progress...'}
          </p>
        </div>
        
        {/* Paths Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">{!pathsLoading ? learningPaths?.length : '...'}</span>
          </div>
          <h3 className="text-lg font-medium mb-1">Learning Paths</h3>
          <p className="text-sm text-muted-foreground">Structured learning journeys</p>
        </div>
        
        {/* Achievements Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">
              {!achievementsLoading && achievements
                ? `${userProgress?.filter((p: any) => p.completed).length || 0}/${achievements.length}`
                : '...'}
            </span>
          </div>
          <h3 className="text-lg font-medium mb-1">Achievements</h3>
          <p className="text-sm text-muted-foreground">Recognition of your progress</p>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search paths, skills, or achievements..." 
          className="pl-10" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="paths">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="paths" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Paths</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Skills</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="paths" className="mt-6">
          {pathsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredPaths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPaths.map((path: any) => (
                <LearningPathCard key={path.id} learningPath={path} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No learning paths found.</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="skills" className="mt-6">
          {skillsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map((skill: any) => (
                <SkillCard 
                  key={skill.id} 
                  skill={skill} 
                  status={getSkillStatus(skill.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No skills found.</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-6">
          {achievementsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[180px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAchievements.map((achievement: any) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No achievements found.</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}