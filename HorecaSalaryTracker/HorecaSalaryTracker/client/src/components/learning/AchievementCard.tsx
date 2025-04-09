import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface AchievementCardProps {
  achievement: {
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
    points: number;
    criteria: string;
    unlocked?: boolean;
  }
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  // For this example, we're showing a simple achievement card.
  // In a real app, you'd want to check if the user has unlocked this achievement.
  const isUnlocked = achievement.unlocked || false;
  
  return (
    <Card className={`border ${isUnlocked ? 'border-yellow-300' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-full ${
            isUnlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
          }`}>
            <Trophy className="h-4 w-4" />
          </div>
          <Badge variant={isUnlocked ? "default" : "outline"} className={
            isUnlocked ? 'bg-yellow-500' : ''
          }>
            {achievement.points} points
          </Badge>
        </div>
        <CardTitle className="text-xl">{achievement.name}</CardTitle>
        <CardDescription className="line-clamp-2">{achievement.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">
          <strong>How to earn:</strong> {achievement.criteria}
        </p>
        {isUnlocked ? (
          <div className="flex items-center gap-2 mt-3 text-yellow-600">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Achievement Unlocked</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-3 text-gray-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Locked</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}