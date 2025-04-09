import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Cafe, getCafeSize } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';

// Badge component for cafe size
interface SizeBadgeProps {
  size: 'small' | 'medium' | 'large';
}

const SizeBadge = ({ size }: SizeBadgeProps) => {
  const colors = {
    small: 'bg-purple-100 text-purple-800',
    medium: 'bg-yellow-100 text-yellow-800',
    large: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[size]}`}>
      {size.charAt(0).toUpperCase() + size.slice(1)}
    </span>
  );
};

// Badge component for cafe status
interface StatusBadgeProps {
  status: 'visited' | 'contracted' | 'pending';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const colors = {
    visited: 'bg-gray-100 text-gray-800',
    contracted: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
  };

  const labels = {
    visited: 'Visited',
    contracted: 'Contracted',
    pending: 'Pending',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

interface CafeListProps {
  onEdit: (cafe: Cafe) => void;
}

export function CafeList({ onEdit }: CafeListProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all_sizes');
  const [statusFilter, setStatusFilter] = useState<string>('all_statuses');
  const [deletingCafeId, setDeletingCafeId] = useState<number | null>(null);
  
  const { data: cafes, isLoading } = useQuery<Cafe[]>({
    queryKey: ['/api/cafes'],
  });

  const deleteCafeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/cafes/${id}`),
    onSuccess: () => {
      toast({
        title: "Cafe deleted",
        description: "The cafe has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cafes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      setDeletingCafeId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete cafe: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle filtering of cafes
  const filteredCafes = cafes?.filter(cafe => {
    // Apply search filter
    const matchesSearch = search === '' || 
      cafe.name.toLowerCase().includes(search.toLowerCase()) ||
      cafe.area.toLowerCase().includes(search.toLowerCase()) ||
      cafe.ownerName.toLowerCase().includes(search.toLowerCase());
    
    // Apply size filter
    const cafeSize = getCafeSize(cafe.hookahCount);
    const matchesSize = sizeFilter === 'all_sizes' || cafeSize === sizeFilter;
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all_statuses' || cafe.status === statusFilter;
    
    return matchesSearch && matchesSize && matchesStatus;
  }) || [];
  
  // Get KPI settings to retrieve representative name for exports
  const { data: kpiSettings } = useQuery({
    queryKey: ['/api/kpi-settings'],
  });

  const handleDelete = (cafeId: number) => {
    setDeletingCafeId(cafeId);
  };

  const confirmDelete = () => {
    if (deletingCafeId) {
      deleteCafeMutation.mutate(deletingCafeId);
    }
  };
  
  // Export to PDF
  const handleExportToPdf = () => {
    if (!filteredCafes.length) return;
    
    exportToPdf({
      title: 'Cafe List',
      representativeName: kpiSettings?.representativeName,
      tables: [
        {
          head: [['Cafe Name', 'Area', 'Size', 'Owner Name', 'Owner Number', 'Status', 'Tables', 'Hookahs']],
          body: filteredCafes.map(cafe => [
            cafe.name,
            cafe.area,
            getCafeSize(cafe.hookahCount),
            cafe.ownerName,
            cafe.ownerNumber,
            cafe.status,
            cafe.tableCount,
            cafe.hookahCount
          ])
        }
      ]
    });
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    if (!filteredCafes.length) return;
    
    const cafeData = [
      ['Cafe Name', 'Area', 'Size', 'Owner Name', 'Owner Number', 'Status', 'Tables', 'Hookahs'],
      ...filteredCafes.map(cafe => [
        cafe.name,
        cafe.area,
        getCafeSize(cafe.hookahCount),
        cafe.ownerName,
        cafe.ownerNumber,
        cafe.status,
        cafe.tableCount,
        cafe.hookahCount
      ])
    ];
    
    exportToExcel({
      title: 'Cafe List',
      representativeName: kpiSettings?.representativeName,
      sheets: [
        {
          name: 'Cafes',
          data: cafeData
        }
      ]
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Cafe List</h3>
        
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div className="mb-3 md:mb-0">
            <Input 
              type="text"
              placeholder="Search cafes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={sizeFilter}
              onValueChange={setSizeFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sizes">All Sizes</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                <SelectItem value="visited">Visited</SelectItem>
                <SelectItem value="contracted">Contracted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cafe Name</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCafes.length > 0 ? (
                  filteredCafes.map((cafe) => (
                    <TableRow key={cafe.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 mr-3">
                            {cafe.photoUrl ? (
                              <img 
                                src={cafe.photoUrl} 
                                alt={cafe.name}
                                className="h-10 w-10 rounded-full object-cover" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                                {cafe.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cafe.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{cafe.area}</TableCell>
                      <TableCell>
                        <SizeBadge size={getCafeSize(cafe.hookahCount)} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {cafe.ownerName}<br/>
                        <span className="text-xs">{cafe.ownerNumber}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cafe.status as 'visited' | 'contracted' | 'pending'} />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onEdit(cafe)}
                          >
                            <Pencil size={16} className="mr-1" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDelete(cafe.id)}
                              >
                                <Trash2 size={16} className="mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the cafe "{cafe.name}" and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={confirmDelete}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No cafes found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredCafes.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredCafes.length}</span> results
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportToPdf} variant="outline" size="sm">
                <FileText size={16} className="mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleExportToExcel} variant="outline" size="sm">
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
