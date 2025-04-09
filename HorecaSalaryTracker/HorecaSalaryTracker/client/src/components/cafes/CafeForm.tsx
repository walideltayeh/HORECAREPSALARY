import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCafeSchema, InsertCafe } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { mexicoGovernorates, citiesByGovernorate } from '@/lib/mexicoLocations';

// Extended validation schema
const formSchema = insertCafeSchema.extend({
  hookahCount: z.coerce.number().min(1, "At least 1 hookah is required"),
  tableCount: z.coerce.number().min(1, "At least 1 table is required"),
  status: z.enum(["visited", "contracted", "pending"], {
    required_error: "Status is required",
  }),
  governorate: z.string({
    required_error: "Governorate is required",
  }),
});

type CafeFormValues = z.infer<typeof formSchema>;

interface CafeFormProps {
  onSuccess?: () => void;
  initialValues?: CafeFormValues;
  isEditing?: boolean;
  cafeId?: number;
}

export function CafeForm({ onSuccess, initialValues, isEditing = false, cafeId }: CafeFormProps) {
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialValues?.photoUrl || null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [availableCities, setAvailableCities] = useState<Array<{value: string, label: string}>>([]);
  
  const form = useForm<CafeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      name: '',
      area: '',
      governorate: '',
      ownerName: '',
      ownerNumber: '',
      hookahCount: 1,
      tableCount: 1,
      status: 'pending',
    },
  });
  
  // Initialize selectedGovernorate from initialValues if available
  useEffect(() => {
    if (initialValues?.governorate) {
      setSelectedGovernorate(initialValues.governorate);
    }
  }, [initialValues]);

  // Update available cities when governorate changes
  useEffect(() => {
    if (selectedGovernorate) {
      setAvailableCities(citiesByGovernorate[selectedGovernorate] || []);
      // Clear area field when governorate changes
      if (!isEditing) {
        form.setValue('area', '');
      }
    } else {
      setAvailableCities([]);
    }
  }, [selectedGovernorate, form, isEditing]);

  const saveCafeMutation = useMutation({
    mutationFn: async (values: CafeFormValues) => {
      // If we have a photo file, first upload it
      let photoUrl = initialValues?.photoUrl || null;
      
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        
        const photoRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!photoRes.ok) {
          throw new Error('Failed to upload photo');
        }
        
        const photoData = await photoRes.json();
        photoUrl = photoData.url;
      }
      
      // Now save the cafe with the photo URL
      if (isEditing && cafeId) {
        return apiRequest('PUT', `/api/cafes/${cafeId}`, { ...values, photoUrl });
      } else {
        return apiRequest('POST', '/api/cafes', { ...values, photoUrl });
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Cafe updated" : "Cafe added",
        description: isEditing ? "The cafe details have been updated successfully." : "The cafe has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cafes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      form.reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} cafe: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = (values: CafeFormValues) => {
    saveCafeMutation.mutate(values);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Cafe' : 'Add New Cafe'}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cafe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cafe name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Governorate</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedGovernorate(value);
                      }}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select governorate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mexicoGovernorates.map((gov) => (
                          <SelectItem key={gov.value} value={gov.value}>{gov.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City/Area</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                      disabled={availableCities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={availableCities.length === 0 ? "Select governorate first" : "Select city"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.value.toString()} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner's Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hookahCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Hookahs</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="Enter number" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      1-3: Small, 4-7: Medium, 7+: Large
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tableCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Tables</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="Enter number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending Visit</SelectItem>
                        <SelectItem value="visited">Visited</SelectItem>
                        <SelectItem value="contracted">Contracted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label htmlFor="cafePhoto" className="block text-sm font-medium mb-1">
                  Cafe Photo
                </Label>
                <div className="flex items-center justify-center w-full">
                  {photoPreview ? (
                    <div className="relative w-full h-32">
                      <img 
                        src={photoPreview} 
                        alt="Cafe Preview" 
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button 
                        type="button"
                        onClick={clearPhoto}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed hover:bg-gray-50 rounded">
                      <div className="flex flex-col items-center justify-center pt-7">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="pt-1 text-sm tracking-wider text-gray-400">
                          Upload photo
                        </p>
                      </div>
                      <input 
                        id="cafePhoto" 
                        type="file" 
                        accept="image/*" 
                        className="opacity-0" 
                        onChange={handlePhotoChange} 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-3"
                onClick={() => {
                  form.reset();
                  setPhotoFile(null);
                  setPhotoPreview(initialValues?.photoUrl || null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveCafeMutation.isPending}
              >
                {saveCafeMutation.isPending ? 'Saving...' : (isEditing ? 'Update Cafe' : 'Save Cafe')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
