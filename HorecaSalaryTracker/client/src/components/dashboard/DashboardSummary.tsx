import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { MonthlyPerformance } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSummary() {
  const { data: performanceData, isLoading } = useQuery<MonthlyPerformance>({
    queryKey: ['/api/performance/current'],
  });

  const { data: kpiSettings } = useQuery({
    queryKey: ['/api/kpi-settings'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!performanceData || !kpiSettings) {
    return <div>No data available</div>;
  }

  // Calculate total visits and targets
  const totalVisits = 
    (performanceData.largeVisits || 0) + 
    (performanceData.mediumVisits || 0) + 
    (performanceData.smallVisits || 0);
  
  const totalVisitTargets = 
    (kpiSettings.targetLargeVisit || 0) + 
    (kpiSettings.targetMediumVisit || 0) + 
    (kpiSettings.targetSmallVisit || 0);
  
  const visitPercentage = totalVisitTargets > 0 
    ? Math.round((totalVisits / totalVisitTargets) * 100) 
    : 0;

  // Calculate total contracts and targets
  const totalContracts = 
    (performanceData.largeContracts || 0) + 
    (performanceData.mediumContracts || 0) + 
    (performanceData.smallContracts || 0);
  
  const totalContractTargets = 
    (kpiSettings.targetLargeContract || 0) + 
    (kpiSettings.targetMediumContract || 0) + 
    (kpiSettings.targetSmallContract || 0);
  
  const contractPercentage = totalContractTargets > 0 
    ? Math.round((totalContracts / totalContractTargets) * 100) 
    : 0;

  // Calculate salary percentage
  const targetSalary = kpiSettings.totalTargetSalary || 3000;
  const salaryProgress = targetSalary > 0 
    ? Math.round((performanceData.totalSalary / targetSalary) * 100) 
    : 0;

  // Calculate contract bonus values
  const largeContractBonus = (performanceData.largeContracts || 0) * (kpiSettings.largeCafeBonus || 100);
  const mediumContractBonus = (performanceData.mediumContracts || 0) * (kpiSettings.mediumCafeBonus || 75);
  const smallContractBonus = (performanceData.smallContracts || 0) * (kpiSettings.smallCafeBonus || 50);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Salary Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Current Salary</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">This Month</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm font-medium">{salaryProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${salaryProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold mt-3">
            <span>${performanceData.totalSalary.toLocaleString()}</span>
            <span className="text-gray-400">/ ${targetSalary.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Base: </span>
            <span className="font-medium">${performanceData.baseSalary.toLocaleString()} ({kpiSettings.baseSalaryPercentage}%)</span>
            <span className="text-gray-500 ml-2">KPI: </span>
            <span className="font-medium">${performanceData.kpiBonus.toLocaleString()} ({100 - kpiSettings.baseSalaryPercentage}%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Visits Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Visits</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              visitPercentage >= kpiSettings.visitThreshold 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {visitPercentage}% Complete
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-500">{performanceData.largeVisits}</div>
              <div className="text-xs text-gray-500">Large</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-500">{performanceData.mediumVisits}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-500">{performanceData.smallVisits}</div>
              <div className="text-xs text-gray-500">Small</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Target completion</span>
              <span className="font-medium">{totalVisits}/{totalVisitTargets}</span>
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
        </CardContent>
      </Card>

      {/* Contracts Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Contracts</h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {contractPercentage}% Complete
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-amber-500">{performanceData.largeContracts}</div>
              <div className="text-xs text-gray-500">Large</div>
              <div className="text-xs text-green-600">+${largeContractBonus}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-amber-500">{performanceData.mediumContracts}</div>
              <div className="text-xs text-gray-500">Medium</div>
              <div className="text-xs text-green-600">+${mediumContractBonus}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-amber-500">{performanceData.smallContracts}</div>
              <div className="text-xs text-gray-500">Small</div>
              <div className="text-xs text-green-600">+${smallContractBonus}</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Target completion</span>
              <span className="font-medium">{totalContracts}/{totalContractTargets}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-amber-500 h-2.5 rounded-full" 
                style={{ width: `${contractPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
