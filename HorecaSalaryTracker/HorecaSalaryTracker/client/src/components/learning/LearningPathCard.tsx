import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Briefcase, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LearningPathProps {
  learningPath: {
    id: number;
    name: string;
    description: string;
    skillIds: number[];
    imageUrl?: string;
  }
}

export default function LearningPathCard({ learningPath }: LearningPathProps) {
  const [, setLocation] = useLocation();
  const userId = 1; // For this proof of concept, we're using a fixed userId
  
  // Get user progress for calculating path completion
  const { data: userProgress } = useQuery({
    queryKey: ['/api/users', userId, 'progress'],
    queryFn: ({ queryKey }) => 
      fetch(`/api/users/${queryKey[1]}/progress`)
        .then(res => res.json())
        .catch(() => []),
    retry: false
  });
  
  // Calculate progress for this path
  const calculateProgress = () => {
    if (!userProgress || learningPath.skillIds.length === 0) return 0;
    
    const completedPathSkills = userProgress.filter(
      (progress: any) => 
        learningPath.skillIds.includes(progress.skillId) && 
        progress.completed
    );
    
    return Math.round((completedPathSkills.length / learningPath.skillIds.length) * 100);
  };
  
  const progress = calculateProgress();
  
  const handleClick = () => {
    setLocation(`/learning-paths/${learningPath.id}`);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-full">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <Badge variant="outline">Path</Badge>
          {progress === 100 && (
            <Badge className="ml-auto bg-green-500">
              <Award className="h-3 w-3 mr-1" /> 
              Complete
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{learningPath.name}</CardTitle>
        <CardDescription className="line-clamp-2">{learningPath.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{userProgress ? `${learningPath.skillIds.filter(
            id => userProgress.some((p: any) => p.skillId === id && p.completed)
          ).length} of ${learningPath.skillIds.length} skills` : 'Loading...'}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardContent>
      
      <CardFooter>
        <Button variant="ghost" size="sm" className="ml-auto gap-1">
          View Path <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}