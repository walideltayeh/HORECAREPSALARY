import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  onExportPdf,
  onExportExcel,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {actions}
        
        {onExportExcel && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportExcel}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
        )}
        
        {onExportPdf && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportPdf}
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}