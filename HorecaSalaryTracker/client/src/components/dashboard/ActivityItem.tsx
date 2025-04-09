import { Activity, Cafe } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  FileSignature, 
  Eye, 
  Camera, 
  FileText 
} from 'lucide-react';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { data: cafe } = useQuery<Cafe>({
    queryKey: [`/api/cafes/${activity.cafeId}`],
    // Only fetch cafe data if we have a cafeId
    enabled: !!activity.cafeId,
  });

  // Use cafe data if available, otherwise use a placeholder
  const cafeName = cafe?.name || `Cafe #${activity.cafeId || 'Unknown'}`;

  // Format timestamp to relative time (e.g., "2 hours ago")
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
  
  // Get icon based on activity type
  const getActivityIcon = () => {
    let iconClasses = "h-4 w-4";
    
    switch (activity.activityType) {
      case 'visit':
        return (
          <div className="bg-blue-100 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
            <Eye className={iconClasses} />
          </div>
        );
      case 'contract':
        return (
          <div className="bg-green-100 text-green-500 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
            <FileSignature className={iconClasses} />
          </div>
        );
      case 'update':
        return (
          <div className="bg-amber-100 text-amber-500 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
            <FileText className={iconClasses} />
          </div>
        );
      case 'photo':
        return (
          <div className="bg-purple-100 text-purple-500 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
            <Camera className={iconClasses} />
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-500 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
            <CheckCircle className={iconClasses} />
          </div>
        );
    }
  };

  return (
    <li className="py-3 flex">
      {getActivityIcon()}
      <div>
        <p className="text-sm font-medium">
          {activity.description.includes('{cafe}') 
            ? activity.description.split('{cafe}').map((part, index, array) => 
                index === array.length - 1 
                  ? part 
                  : <>{part}<span className="font-bold" key={index}>{cafeName}</span></>
              )
            : activity.description
          }
        </p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </li>
  );
}
