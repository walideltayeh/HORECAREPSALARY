import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ChevronRight, Award, BookOpen } from 'lucide-react';

// Map of difficulty levels to colors
export const difficultyColors: Record<string, string> = {
  'beginner': 'text-green-600 border-green-200',
  'intermediate': 'text-blue-600 border-blue-200',
  'advanced': 'text-orange-600 border-orange-200',
  'expert': 'text-red-600 border-red-200'
};

interface SkillCardProps {
  skill: {
    id: number;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    points: number;
    imageUrl?: string;
  };
  status: 'available' | 'in-progress' | 'completed';
}

export default function SkillCard({ skill, status }: SkillCardProps) {
  const [, setLocation] = useLocation();
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-primary" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Available';
    }
  };
  
  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'in-progress':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };
  
  const handleClick = () => {
    setLocation(`/skills/${skill.id}`);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-full">
            {getStatusIcon()}
          </div>
          <Badge variant="outline" className={difficultyColors[skill.difficulty] || ''}>
            {skill.difficulty}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {skill.category}
          </Badge>
        </div>
        <CardTitle className="text-xl">{skill.name}</CardTitle>
        <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center gap-1 mt-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{skill.points} points</span>
          <Badge variant="outline" className={`ml-auto ${getStatusClass()}`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="ghost" size="sm" className="ml-auto gap-1">
          View Details <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}