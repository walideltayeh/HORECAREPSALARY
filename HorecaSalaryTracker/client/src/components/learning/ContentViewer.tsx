import { 
  AlertCircle, 
  BookOpen, 
  FileText, 
  Link as LinkIcon, 
  Play, 
  HelpCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ContentViewerProps {
  content: {
    id: number;
    skillId: number;
    contentType: string;
    title?: string;
    content: string;
    url?: string;
    order?: number;
  }
}

export default function ContentViewer({ content }: ContentViewerProps) {
  const renderContent = () => {
    switch (content.contentType.toLowerCase()) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }} />
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 flex items-center gap-3">
              <Play className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Video Resource</p>
                <p className="text-sm text-muted-foreground">
                  {content.url || 'Video URL not available'}
                </p>
              </div>
              {content.url && (
                <a 
                  href={content.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  Watch <LinkIcon className="h-3 w-3" />
                </a>
              )}
            </div>
            {content.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }} />
              </div>
            )}
          </div>
        );
        
      case 'link':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">External Resource</p>
                <p className="text-sm text-muted-foreground">
                  {content.url || 'Link URL not available'}
                </p>
              </div>
              {content.url && (
                <a 
                  href={content.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  Visit <LinkIcon className="h-3 w-3" />
                </a>
              )}
            </div>
            {content.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }} />
              </div>
            )}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Skill Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Complete this quiz to test your knowledge
                </p>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Quizzes are not yet available</AlertTitle>
              <AlertDescription>
                The quiz functionality will be implemented in a future update.
              </AlertDescription>
            </Alert>
          </div>
        );
        
      case 'document':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Document Resource</p>
                <p className="text-sm text-muted-foreground">
                  {content.url || 'Document not available for download'}
                </p>
              </div>
              {content.url && (
                <a 
                  href={content.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  Download <LinkIcon className="h-3 w-3" />
                </a>
              )}
            </div>
            {content.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }} />
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Learning Content</p>
                <p className="text-sm text-muted-foreground">
                  {content.contentType}
                </p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: formatTextContent(content.content) }} />
            </div>
          </div>
        );
    }
  };
  
  // Simple text formatting (in a real app, you'd use a proper MD/HTML renderer)
  const formatTextContent = (text: string) => {
    // Replace newlines with <br>
    return text.replace(/\n/g, '<br>');
  };
  
  return (
    <div className="space-y-2">
      {renderContent()}
    </div>
  );
}