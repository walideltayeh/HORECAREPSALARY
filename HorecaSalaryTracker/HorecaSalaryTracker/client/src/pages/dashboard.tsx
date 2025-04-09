import { useQuery } from '@tanstack/react-query';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { exportToPdf, exportToExcel } from '@/lib/exportUtils';

export default function Dashboard() {
  const { data: performanceData } = useQuery({
    queryKey: ['/api/performance/current'],
  });

  const { data: kpiSettings } = useQuery({
    queryKey: ['/api/kpi-settings'],
  });
  
  const { data: activities } = useQuery({
    queryKey: ['/api/activities'],
  });
  
  // Export to PDF
  const handleExportToPdf = () => {
    if (!performanceData || !kpiSettings) return;
    
    const visitProgressData = [
      ['Size', 'Completed', 'Target', 'Percentage'],
      ['Large Cafes', performanceData.largeVisits, kpiSettings.targetLargeVisit, 
       `${Math.round((performanceData.largeVisits / kpiSettings.targetLargeVisit) * 100)}%`],
      ['Medium Cafes', performanceData.mediumVisits, kpiSettings.targetMediumVisit, 
       `${Math.round((performanceData.mediumVisits / kpiSettings.targetMediumVisit) * 100)}%`],
      ['Small Cafes', performanceData.smallVisits, kpiSettings.targetSmallVisit, 
       `${Math.round((performanceData.smallVisits / kpiSettings.targetSmallVisit) * 100)}%`]
    ];
    
    const contractProgressData = [
      ['Size', 'Completed', 'Target', 'Percentage', 'Bonus'],
      ['Large Cafes', performanceData.largeContracts, kpiSettings.targetLargeContract, 
       `${Math.round((performanceData.largeContracts / kpiSettings.targetLargeContract) * 100)}%`,
       `$${performanceData.largeContracts * kpiSettings.largeCafeBonus}`],
      ['Medium Cafes', performanceData.mediumContracts, kpiSettings.targetMediumContract, 
       `${Math.round((performanceData.mediumContracts / kpiSettings.targetMediumContract) * 100)}%`,
       `$${performanceData.mediumContracts * kpiSettings.mediumCafeBonus}`],
      ['Small Cafes', performanceData.smallContracts, kpiSettings.targetSmallContract, 
       `${Math.round((performanceData.smallContracts / kpiSettings.targetSmallContract) * 100)}%`,
       `$${performanceData.smallContracts * kpiSettings.smallCafeBonus}`]
    ];
    
    const salaryData = [
      ['Component', 'Amount', 'Percentage'],
      ['Base Salary', `$${performanceData.baseSalary}`, `${kpiSettings.baseSalaryPercentage}%`],
      ['KPI Bonus', `$${performanceData.kpiBonus}`, `${100 - kpiSettings.baseSalaryPercentage}%`],
      ['Total Salary', `$${performanceData.totalSalary}`, 
       `${Math.round((performanceData.totalSalary / kpiSettings.totalTargetSalary) * 100)}% of target`]
    ];
    
    const recentActivitiesData = activities?.slice(0, 10).map(activity => [
      new Date(activity.timestamp).toLocaleDateString(),
      activity.activityType,
      activity.description
    ]) || [];
    
    exportToPdf({
      title: 'Performance Dashboard',
      representativeName: kpiSettings.representativeName,
      tables: [
        {
          title: 'Visit Progress',
          head: [['Size', 'Completed', 'Target', 'Percentage']],
          body: visitProgressData.slice(1)
        },
        {
          title: 'Contract Progress',
          head: [['Size', 'Completed', 'Target', 'Percentage', 'Bonus']],
          body: contractProgressData.slice(1)
        },
        {
          title: 'Salary Summary',
          head: [['Component', 'Amount', 'Percentage']],
          body: salaryData.slice(1)
        },
        {
          title: 'Recent Activities',
          head: [['Date', 'Type', 'Description']],
          body: recentActivitiesData
        }
      ]
    });
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    if (!performanceData || !kpiSettings) return;
    
    const dashboardData = [
      ['Performance Dashboard', '', '', '', ''],
      ['', '', '', '', ''],
      ['Visit Progress', '', '', '', ''],
      ['Size', 'Completed', 'Target', 'Percentage', ''],
      ['Large Cafes', performanceData.largeVisits, kpiSettings.targetLargeVisit, 
       `${Math.round((performanceData.largeVisits / kpiSettings.targetLargeVisit) * 100)}%`, ''],
      ['Medium Cafes', performanceData.mediumVisits, kpiSettings.targetMediumVisit, 
       `${Math.round((performanceData.mediumVisits / kpiSettings.targetMediumVisit) * 100)}%`, ''],
      ['Small Cafes', performanceData.smallVisits, kpiSettings.targetSmallVisit, 
       `${Math.round((performanceData.smallVisits / kpiSettings.targetSmallVisit) * 100)}%`, ''],
      ['', '', '', '', ''],
      ['Contract Progress', '', '', '', ''],
      ['Size', 'Completed', 'Target', 'Percentage', 'Bonus'],
      ['Large Cafes', performanceData.largeContracts, kpiSettings.targetLargeContract, 
       `${Math.round((performanceData.largeContracts / kpiSettings.targetLargeContract) * 100)}%`,
       `$${performanceData.largeContracts * kpiSettings.largeCafeBonus}`],
      ['Medium Cafes', performanceData.mediumContracts, kpiSettings.targetMediumContract, 
       `${Math.round((performanceData.mediumContracts / kpiSettings.targetMediumContract) * 100)}%`,
       `$${performanceData.mediumContracts * kpiSettings.mediumCafeBonus}`],
      ['Small Cafes', performanceData.smallContracts, kpiSettings.targetSmallContract, 
       `${Math.round((performanceData.smallContracts / kpiSettings.targetSmallContract) * 100)}%`,
       `$${performanceData.smallContracts * kpiSettings.smallCafeBonus}`],
      ['', '', '', '', ''],
      ['Salary Summary', '', '', '', ''],
      ['Component', 'Amount', 'Percentage', '', ''],
      ['Base Salary', `$${performanceData.baseSalary}`, `${kpiSettings.baseSalaryPercentage}%`, '', ''],
      ['KPI Bonus', `$${performanceData.kpiBonus}`, `${100 - kpiSettings.baseSalaryPercentage}%`, '', ''],
      ['Total Salary', `$${performanceData.totalSalary}`, 
       `${Math.round((performanceData.totalSalary / kpiSettings.totalTargetSalary) * 100)}% of target`, '', '']
    ];
    
    const activitiesData = activities?.slice(0, 10).map(activity => [
      new Date(activity.timestamp).toLocaleDateString(),
      activity.activityType,
      activity.description,
      '',
      ''
    ]) || [];
    
    if (activitiesData.length > 0) {
      dashboardData.push(['', '', '', '', '']);
      dashboardData.push(['Recent Activities', '', '', '', '']);
      dashboardData.push(['Date', 'Type', 'Description', '', '']);
      dashboardData.push(...activitiesData);
    }
    
    exportToExcel({
      title: 'Performance Dashboard',
      representativeName: kpiSettings.representativeName,
      sheets: [
        {
          name: 'Dashboard',
          data: dashboardData
        }
      ]
    });
  };
  
  return (
    <section id="dashboard" className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
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
      <DashboardSummary />
      <DashboardCharts />
    </section>
  );
}
