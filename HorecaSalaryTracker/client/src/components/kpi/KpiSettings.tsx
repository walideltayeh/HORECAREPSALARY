import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertKpiSettingsSchema, InsertKpiSettings } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

// Extended validation schema
const formSchema = insertKpiSettingsSchema.extend({
  targetLargeVisit: z.coerce.number().min(0, "Must be a positive number"),
  targetMediumVisit: z.coerce.number().min(0, "Must be a positive number"),
  targetSmallVisit: z.coerce.number().min(0, "Must be a positive number"),
  targetLargeContract: z.coerce.number().min(0, "Must be a positive number"),
  targetMediumContract: z.coerce.number().min(0, "Must be a positive number"),
  targetSmallContract: z.coerce.number().min(0, "Must be a positive number"),
  visitThreshold: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
  contractThreshold: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
  largeCafeBonus: z.coerce.number().min(0, "Must be a positive number"),
  mediumCafeBonus: z.coerce.number().min(0, "Must be a positive number"),
  smallCafeBonus: z.coerce.number().min(0, "Must be a positive number"),
  baseSalaryPercentage: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
  totalTargetSalary: z.coerce.number().min(0, "Must be a positive number"),
  visitKpiPercentage: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
  contractKpiPercentage: z.coerce.number().min(0).max(100, "Must be between 0 and 100"),
  representativeName: z.string(),
});

type KpiSettingsFormValues = z.infer<typeof formSchema>;

export function KpiSettings() {
  const { toast } = useToast();
  
  const { data: kpiSettings, isLoading } = useQuery<KpiSettingsFormValues>({
    queryKey: ['/api/kpi-settings'],
  });

  const form = useForm<KpiSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetLargeVisit: 15,
      targetMediumVisit: 20,
      targetSmallVisit: 25,
      targetLargeContract: 8,
      targetMediumContract: 12,
      targetSmallContract: 10,
      visitThreshold: 80,
      contractThreshold: 80,
      largeCafeBonus: 100,
      mediumCafeBonus: 75,
      smallCafeBonus: 50,
      baseSalaryPercentage: 30,
      totalTargetSalary: 3000,
      visitKpiPercentage: 50,
      contractKpiPercentage: 50,
      representativeName: '',
    },
  });

  // Update form with fetched data
  useEffect(() => {
    if (kpiSettings) {
      // If contractThreshold isn't in the fetched data, add a default value
      form.reset({
        ...kpiSettings,
        contractThreshold: kpiSettings.contractThreshold ?? 80
      });
    }
  }, [kpiSettings, form]);

  // Watch values for calculations
  const baseSalaryPercentage = form.watch('baseSalaryPercentage');
  const totalTargetSalary = form.watch('totalTargetSalary');
  const visitKpiPercentage = form.watch('visitKpiPercentage');
  const contractKpiPercentage = form.watch('contractKpiPercentage');
  
  // Calculate derived values
  const calculatedBaseSalary = Math.round(totalTargetSalary * (baseSalaryPercentage / 100));
  const calculatedKpiSalary = totalTargetSalary - calculatedBaseSalary;
  
  // Calculate KPI distribution
  const calculatedVisitKpi = Math.round(calculatedKpiSalary * (visitKpiPercentage / 100));
  const calculatedContractKpi = Math.round(calculatedKpiSalary * (contractKpiPercentage / 100));

  const saveSettingsMutation = useMutation({
    mutationFn: (values: KpiSettingsFormValues) => 
      apiRequest('POST', '/api/kpi-settings', values),
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "KPI settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: KpiSettingsFormValues) => {
    saveSettingsMutation.mutate(values);
  };

  if (isLoading) {
    return <Skeleton className="h-[800px] w-full" />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Target Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visit Targets */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Visit Targets</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="targetLargeVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Large Cafe Visits</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetMediumVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium Cafe Visits</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetSmallVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Small Cafe Visits</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contract Targets */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Contract Targets</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="targetLargeContract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Large Cafe Contracts</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetMediumContract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium Cafe Contracts</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetSmallContract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Small Cafe Contracts</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter target" 
                                className="rounded-r-none"
                                {...field} 
                              />
                            </FormControl>
                            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              per month
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Compensation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visit Compensation */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Performance Thresholds</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="visitThreshold"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Minimum Visit Threshold</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[value]}
                                onValueChange={(vals) => onChange(vals[0])}
                                className="flex-1"
                                {...field}
                              />
                            </FormControl>
                            <span className="ml-3 text-sm font-medium text-gray-700">{value}%</span>
                          </div>
                          <FormDescription className="text-xs text-gray-500">
                            If visits are less than {value}% of target, rep gets zero compensation for visits.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contractThreshold"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Minimum Contract Threshold</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[value]}
                                onValueChange={(vals) => onChange(vals[0])}
                                className="flex-1"
                                {...field}
                              />
                            </FormControl>
                            <span className="ml-3 text-sm font-medium text-gray-700">{value}%</span>
                          </div>
                          <FormDescription className="text-xs text-gray-500">
                            If contracts are less than {value}% of target, rep gets zero compensation for contracts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contract Compensation */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Contract Compensation</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="largeCafeBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Large Cafe Contract Bonus</FormLabel>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              $
                            </span>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter bonus amount" 
                                className="rounded-l-none"
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mediumCafeBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium Cafe Contract Bonus</FormLabel>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              $
                            </span>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter bonus amount" 
                                className="rounded-l-none"
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="smallCafeBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Small Cafe Contract Bonus</FormLabel>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              $
                            </span>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="Enter bonus amount" 
                                className="rounded-l-none"
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Representative Information</h3>
              <div className="border rounded-lg p-4 mb-4">
                <FormField
                  control={form.control}
                  name="representativeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representative Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter representative name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        The name of the representative who will receive the salary.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            
              <h3 className="text-lg font-semibold mb-3">Salary Structure</h3>
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="baseSalaryPercentage"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Base Salary Percentage</FormLabel>
                        <div className="flex items-center">
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[value]}
                              onValueChange={(vals) => onChange(vals[0])}
                              {...field}
                            />
                          </FormControl>
                          <span className="ml-3 text-sm font-medium text-gray-700">{value}%</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      KPI-Based Salary Percentage
                    </FormLabel>
                    <div className="flex items-center">
                      <Slider
                        disabled
                        value={[100 - baseSalaryPercentage]}
                        min={0}
                        max={100}
                        step={5}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {100 - baseSalaryPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="totalTargetSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Target Monthly Salary</FormLabel>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            $
                          </span>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              placeholder="Enter target salary" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-3">KPI Distribution</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="visitKpiPercentage"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Visit KPI Percentage</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[value]}
                                onValueChange={(vals) => {
                                  onChange(vals[0]);
                                  // Update contract percentage to ensure total is 100%
                                  form.setValue('contractKpiPercentage', 100 - vals[0]);
                                }}
                                className="flex-1"
                                {...field}
                              />
                            </FormControl>
                            <span className="ml-3 text-sm font-medium text-gray-700">{value}%</span>
                          </div>
                          <FormDescription className="text-xs text-gray-500">
                            Percentage of KPI Bonus allocated to Visit targets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contractKpiPercentage"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Contract KPI Percentage</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[value]}
                                onValueChange={(vals) => {
                                  onChange(vals[0]);
                                  // Update visit percentage to ensure total is 100%
                                  form.setValue('visitKpiPercentage', 100 - vals[0]);
                                }}
                                className="flex-1"
                                {...field}
                              />
                            </FormControl>
                            <span className="ml-3 text-sm font-medium text-gray-700">{value}%</span>
                          </div>
                          <FormDescription className="text-xs text-gray-500">
                            Percentage of KPI Bonus allocated to Contract targets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Base Salary:</span>
                    <span className="text-sm font-medium">${calculatedBaseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Maximum KPI Bonus:</span>
                    <span className="text-sm font-medium">${calculatedKpiSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Visit KPI Portion:</span>
                    <span className="text-sm font-medium">${calculatedVisitKpi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Contract KPI Portion:</span>
                    <span className="text-sm font-medium">${calculatedContractKpi.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (kpiSettings) {
                    form.reset({
                      ...kpiSettings,
                      contractThreshold: kpiSettings.contractThreshold ?? 80
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
