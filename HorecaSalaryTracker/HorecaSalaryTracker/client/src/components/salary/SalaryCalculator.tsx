import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { MonthlyPerformance } from '@shared/schema';
import { format } from 'date-fns';
import { exportToPdf, exportToExcel, formatCurrency } from '@/lib/exportUtils';

// Helper to generate months for dropdown
const generateMonthOptions = () => {
  const options = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    options.push({ value, label });
  }
  
  return options;
};

export function SalaryCalculator() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const monthOptions = generateMonthOptions();
  
  const { data: performance, isLoading: isLoadingPerformance } = useQuery<MonthlyPerformance>({
    queryKey: [`/api/performance/${selectedMonth}`],
  });
  
  const { data: kpiSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/kpi-settings'],
  });
  
  // Don't require the history endpoint to work since it's causing errors
  const { data: performanceHistory } = useQuery({
    queryKey: ['/api/performance/history'],
    retry: 1, // Don't retry too many times if there's an error
    // Even if this fails, we won't block the rendering
    enabled: true
  });
  
  const isLoading = isLoadingPerformance || isLoadingSettings;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[600px]" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }
  
  if (!performance || !kpiSettings) {
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
      No performance data available for the selected month.
    </div>;
  }
  
  // Calculate percentages
  const visitTargetTotal = kpiSettings.targetLargeVisit + kpiSettings.targetMediumVisit + kpiSettings.targetSmallVisit;
  const visitActualTotal = performance.largeVisits + performance.mediumVisits + performance.smallVisits;
  const visitPercentage = visitTargetTotal > 0 ? Math.round((visitActualTotal / visitTargetTotal) * 100) : 0;
  
  const contractTargetTotal = kpiSettings.targetLargeContract + kpiSettings.targetMediumContract + kpiSettings.targetSmallContract;
  const contractActualTotal = performance.largeContracts + performance.mediumContracts + performance.smallContracts;
  const contractPercentage = contractTargetTotal > 0 ? Math.round((contractActualTotal / contractTargetTotal) * 100) : 0;
  
  // Calculate contract bonuses
  const largeCafeBonus = performance.largeContracts * kpiSettings.largeCafeBonus;
  const mediumCafeBonus = performance.mediumContracts * kpiSettings.mediumCafeBonus;
  const smallCafeBonus = performance.smallContracts * kpiSettings.smallCafeBonus;
  const totalContractBonus = largeCafeBonus + mediumCafeBonus + smallCafeBonus;
  
  // Calculate remaining values
  const baseSalary = performance.baseSalary;
  const kpiBonus = performance.kpiBonus;
  const totalSalary = performance.totalSalary;
  const maxKpiBonus = kpiSettings.totalTargetSalary * (100 - kpiSettings.baseSalaryPercentage) / 100;
  const kpiBonusPercentage = maxKpiBonus > 0 ? Math.round((kpiBonus / maxKpiBonus) * 100) : 0;
  const targetSalary = kpiSettings.totalTargetSalary;
  const totalSalaryPercentage = targetSalary > 0 ? Math.round((totalSalary / targetSalary) * 100) : 0;
  
  // Function to format as currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };
  
  // Export to PDF
  const handleExportToPdf = () => {
    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'Report';
    
    exportToPdf({
      title: 'Salary Report',
      representativeName: kpiSettings.representativeName,
      subtitle: `Month: ${monthLabel}`,
      tables: [
        {
          title: 'Visit Performance',
          head: [['Cafe Size', 'Actual', 'Target', 'Completion']],
          body: [
            ['Large Cafes', performance.largeVisits, kpiSettings.targetLargeVisit, `${Math.round((performance.largeVisits / kpiSettings.targetLargeVisit) * 100)}%`],
            ['Medium Cafes', performance.mediumVisits, kpiSettings.targetMediumVisit, `${Math.round((performance.mediumVisits / kpiSettings.targetMediumVisit) * 100)}%`],
            ['Small Cafes', performance.smallVisits, kpiSettings.targetSmallVisit, `${Math.round((performance.smallVisits / kpiSettings.targetSmallVisit) * 100)}%`],
            ['Overall Visits', visitActualTotal, visitTargetTotal, `${visitPercentage}%`]
          ]
        },
        {
          title: 'Contract Performance',
          head: [['Cafe Size', 'Actual', 'Target', 'Completion']],
          body: [
            ['Large Cafes', performance.largeContracts, kpiSettings.targetLargeContract, `${Math.round((performance.largeContracts / kpiSettings.targetLargeContract) * 100)}%`],
            ['Medium Cafes', performance.mediumContracts, kpiSettings.targetMediumContract, `${Math.round((performance.mediumContracts / kpiSettings.targetMediumContract) * 100)}%`],
            ['Small Cafes', performance.smallContracts, kpiSettings.targetSmallContract, `${Math.round((performance.smallContracts / kpiSettings.targetSmallContract) * 100)}%`],
            ['Overall Contracts', contractActualTotal, contractTargetTotal, `${contractPercentage}%`]
          ]
        },
        {
          title: 'Bonus Breakdown',
          head: [['Category', 'Description', 'Amount']],
          body: [
            ['Contract Bonuses', `Large Cafe Contracts (${performance.largeContracts} × $${kpiSettings.largeCafeBonus})`, formatCurrency(largeCafeBonus)],
            ['', `Medium Cafe Contracts (${performance.mediumContracts} × $${kpiSettings.mediumCafeBonus})`, formatCurrency(mediumCafeBonus)],
            ['', `Small Cafe Contracts (${performance.smallContracts} × $${kpiSettings.smallCafeBonus})`, formatCurrency(smallCafeBonus)],
            ['Visit Percentage', `KPI Visit Bonus (${visitPercentage >= kpiSettings.visitThreshold ? visitPercentage : 0}%)`, formatCurrency(kpiBonus - totalContractBonus)],
            ['Total KPI Bonus', '', formatCurrency(kpiBonus)]
          ]
        },
        {
          title: 'Salary Summary',
          head: [['Component', 'Amount', 'Percentage']],
          body: [
            ['Base Salary', formatCurrency(baseSalary), `${kpiSettings.baseSalaryPercentage}%`],
            ['KPI Bonus', formatCurrency(kpiBonus), `${kpiBonusPercentage}%`],
            ['Total Salary', formatCurrency(totalSalary), `${totalSalaryPercentage}% of target`]
          ]
        }
      ]
    });
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'Report';
    
    // Create data arrays for performance metrics
    const visitData = [
      ['Visit Performance', 'Actual', 'Target', 'Completion'],
      ['Large Cafes', performance.largeVisits, kpiSettings.targetLargeVisit, `${Math.round((performance.largeVisits / kpiSettings.targetLargeVisit) * 100)}%`],
      ['Medium Cafes', performance.mediumVisits, kpiSettings.targetMediumVisit, `${Math.round((performance.mediumVisits / kpiSettings.targetMediumVisit) * 100)}%`],
      ['Small Cafes', performance.smallVisits, kpiSettings.targetSmallVisit, `${Math.round((performance.smallVisits / kpiSettings.targetSmallVisit) * 100)}%`],
      ['Overall Visits', visitActualTotal, visitTargetTotal, `${visitPercentage}%`],
      ['', '', '', ''],
      ['Contract Performance', 'Actual', 'Target', 'Completion'],
      ['Large Cafes', performance.largeContracts, kpiSettings.targetLargeContract, `${Math.round((performance.largeContracts / kpiSettings.targetLargeContract) * 100)}%`],
      ['Medium Cafes', performance.mediumContracts, kpiSettings.targetMediumContract, `${Math.round((performance.mediumContracts / kpiSettings.targetMediumContract) * 100)}%`],
      ['Small Cafes', performance.smallContracts, kpiSettings.targetSmallContract, `${Math.round((performance.smallContracts / kpiSettings.targetSmallContract) * 100)}%`],
      ['Overall Contracts', contractActualTotal, contractTargetTotal, `${contractPercentage}%`],
      ['', '', '', ''],
      ['Bonus Breakdown', '', '', ''],
      ['Category', 'Description', 'Amount', ''],
      ['Contract Bonuses', `Large Cafe Contracts (${performance.largeContracts} × $${kpiSettings.largeCafeBonus})`, formatCurrency(largeCafeBonus), ''],
      ['', `Medium Cafe Contracts (${performance.mediumContracts} × $${kpiSettings.mediumCafeBonus})`, formatCurrency(mediumCafeBonus), ''],
      ['', `Small Cafe Contracts (${performance.smallContracts} × $${kpiSettings.smallCafeBonus})`, formatCurrency(smallCafeBonus), ''],
      ['Visit Percentage', `KPI Visit Bonus (${visitPercentage >= kpiSettings.visitThreshold ? visitPercentage : 0}%)`, formatCurrency(kpiBonus - totalContractBonus), ''],
      ['Total KPI Bonus', '', formatCurrency(kpiBonus), ''],
      ['', '', '', ''],
      ['Salary Summary', '', '', ''],
      ['Component', 'Amount', 'Percentage', ''],
      ['Base Salary', formatCurrency(baseSalary), `${kpiSettings.baseSalaryPercentage}%`, ''],
      ['KPI Bonus', formatCurrency(kpiBonus), `${kpiBonusPercentage}%`, ''],
      ['Total Salary', formatCurrency(totalSalary), `${totalSalaryPercentage}% of target`, ''],
    ];
    
    exportToExcel({
      title: 'Salary Report',
      representativeName: kpiSettings.representativeName,
      subtitle: `Month: ${monthLabel}`,
      sheets: [
        {
          name: 'Salary Report',
          data: visitData
        }
      ]
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Monthly Performance Metrics</h3>
              {kpiSettings.representativeName && (
                <div className="text-sm font-medium">Representative: <span className="text-blue-600">{kpiSettings.representativeName}</span></div>
              )}
            </div>
            <div className="h-px bg-gray-200 w-full my-3"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Visit Metrics */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Visit Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Large Cafes</span>
                      <span className="font-medium">{performance.largeVisits}/{kpiSettings.targetLargeVisit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.largeVisits / kpiSettings.targetLargeVisit) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Medium Cafes</span>
                      <span className="font-medium">{performance.mediumVisits}/{kpiSettings.targetMediumVisit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.mediumVisits / kpiSettings.targetMediumVisit) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Small Cafes</span>
                      <span className="font-medium">{performance.smallVisits}/{kpiSettings.targetSmallVisit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.smallVisits / kpiSettings.targetSmallVisit) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">Overall Visit Completion</span>
                      <span className="font-medium">{visitActualTotal}/{visitTargetTotal} ({visitPercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          visitPercentage >= kpiSettings.visitThreshold 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${visitPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contract Metrics */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Contract Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Large Cafes</span>
                      <span className="font-medium">{performance.largeContracts}/{kpiSettings.targetLargeContract}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.largeContracts / kpiSettings.targetLargeContract) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Medium Cafes</span>
                      <span className="font-medium">{performance.mediumContracts}/{kpiSettings.targetMediumContract}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.mediumContracts / kpiSettings.targetMediumContract) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Small Cafes</span>
                      <span className="font-medium">{performance.smallContracts}/{kpiSettings.targetSmallContract}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((performance.smallContracts / kpiSettings.targetSmallContract) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">Overall Contract Completion</span>
                      <span className="font-medium">{contractActualTotal}/{contractTargetTotal} ({contractPercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-amber-500 h-2.5 rounded-full" 
                        style={{ width: `${contractPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Bonus Breakdown</h3>
            <div className="border rounded-lg p-4 mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900" rowSpan={3}>Contract Bonuses</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        Large Cafe Contracts ({performance.largeContracts} × ${kpiSettings.largeCafeBonus})
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(largeCafeBonus)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        Medium Cafe Contracts ({performance.mediumContracts} × ${kpiSettings.mediumCafeBonus})
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(mediumCafeBonus)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        Small Cafe Contracts ({performance.smallContracts} × ${kpiSettings.smallCafeBonus})
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(smallCafeBonus)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Visit Percentage</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        KPI Visit Bonus ({visitPercentage >= kpiSettings.visitThreshold ? visitPercentage : 0}% of ${formatCurrency(maxKpiBonus - totalContractBonus)} allocation)
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(kpiBonus - totalContractBonus)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">Total KPI Bonus</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-bold">
                        {formatCurrency(kpiBonus)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Select Month</Label>
                <Select 
                  value={selectedMonth} 
                  onValueChange={setSelectedMonth}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportToPdf} variant="outline">
                  <FileText size={16} className="mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportToExcel} variant="outline">
                  <FileSpreadsheet size={16} className="mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Salary Summary</h3>
            <div className="flex flex-col space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700 mb-1">Base Salary ({kpiSettings.baseSalaryPercentage}%)</div>
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(baseSalary)}</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-sm text-amber-700 mb-1">KPI Bonus ({100 - kpiSettings.baseSalaryPercentage}%)</div>
                <div className="text-2xl font-bold text-amber-800">{formatCurrency(kpiBonus)}</div>
                <div className="text-xs text-amber-600 mt-1">{kpiBonusPercentage}% of max possible {formatCurrency(maxKpiBonus)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 mb-1">Total Earnings</div>
                <div className="text-3xl font-bold text-green-800">{formatCurrency(totalSalary)}</div>
                <div className="text-xs text-green-600 mt-1">{totalSalaryPercentage}% of target {formatCurrency(targetSalary)}</div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Monthly Trend</h4>
                <div className="h-32">
                  <div className="h-full w-full flex items-end space-x-1">
                    {Array.isArray(performanceHistory) && performanceHistory.length > 0 ? 
                      performanceHistory.slice(-6).map((month, index) => {
                        const percentage = Math.round((month.totalSalary / targetSalary) * 100);
                        // Safely handle month format
                        const monthDate = new Date(month.month);
                        const monthName = !isNaN(monthDate.getTime()) ? 
                          format(monthDate, 'MMM') : 
                          `M${index+1}`;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="h-24 bg-gray-200 w-6 rounded-t flex flex-col-reverse">
                              <div 
                                className="bg-blue-500 w-full rounded-t" 
                                style={{ height: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{monthName}</div>
                          </div>
                        );
                      })
                    : (
                      // Show current month data when history isn't available
                      <div className="w-full flex items-center justify-start">
                        <div className="flex-0 flex flex-col items-center mr-4">
                          <div className="h-24 bg-gray-200 w-10 rounded-t flex flex-col-reverse">
                            <div 
                              className="bg-blue-500 w-full rounded-t" 
                              style={{ height: `${Math.min(100, totalSalaryPercentage)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(), 'MMM')}
                          </div>
                        </div>
                        <div className="flex-1 pl-2">
                          <p className="text-sm text-gray-500">
                            Performance history is currently unavailable.<br/>
                            Showing current month only.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
