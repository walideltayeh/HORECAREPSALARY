import { useState, ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard,
  Store,
  BarChart3,
  DollarSign,
  Menu,
  User as UserIcon
} from 'lucide-react';

type SidebarLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  isActive: boolean;
};

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => (
  <li className="mb-2">
    <div 
      className={`flex items-center p-2 rounded cursor-pointer ${
        isActive 
          ? "bg-gray-700 text-white" 
          : "text-gray-300 hover:bg-gray-700"
      }`}
      onClick={() => {
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      <span className="mr-3">{icon}</span>
      {children}
    </div>
  </li>
);

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define type for KPI settings
  interface KpiSettings {
    id?: number;
    representativeName?: string;
    targetVisits?: number;
    targetContracts?: number;
    smallCafeCompensation?: number;
    mediumCafeCompensation?: number;
    largeCafeCompensation?: number;
    basicSalaryPercentage?: number;
    kpiSalaryPercentage?: number;
  }
  
  // Fetch KPI settings to get the representative name
  const { data: kpiSettings } = useQuery<KpiSettings>({
    queryKey: ['/api/kpi-settings'],
    queryFn: () => fetch('/api/kpi-settings').then(res => res.json()),
  });

  // Get initials for avatar display
  const getInitials = (name: string | undefined) => {
    if (!name) return 'SR'; // Default: Sales Rep
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get representative name or default
  const representativeName = kpiSettings?.representativeName || 'Sales Representative';
  const repInitials = getInitials(representativeName);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="bg-gray-800 text-white w-full md:w-64 md:flex md:flex-col md:min-h-screen flex-shrink-0 hidden md:block">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Horeca Salary</h1>
          <p className="text-sm text-gray-400">Rep Management System</p>
        </div>
        <nav className="flex-1 p-4">
          <ul>
            <SidebarLink 
              href="/" 
              icon={<LayoutDashboard size={20} />} 
              isActive={location === '/'}
            >
              Dashboard
            </SidebarLink>
            <SidebarLink 
              href="/cafes" 
              icon={<Store size={20} />} 
              isActive={location.startsWith('/cafes')}
            >
              Cafe Management
            </SidebarLink>
            <SidebarLink 
              href="/kpi-settings" 
              icon={<BarChart3 size={20} />} 
              isActive={location === '/kpi-settings'}
            >
              KPI Settings
            </SidebarLink>
            <SidebarLink 
              href="/salary" 
              icon={<DollarSign size={20} />} 
              isActive={location === '/salary'}
            >
              Salary Calculation
            </SidebarLink>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
              {repInitials}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{representativeName}</p>
              <p className="text-xs text-gray-400">Sales Rep</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile navbar */}
      <div className="md:hidden bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Horeca Salary</h1>
        <button className="text-white" onClick={toggleMobileMenu}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} bg-gray-800 text-white w-full absolute z-10 md:hidden`}>
        <nav className="p-4">
          <ul>
            <SidebarLink 
              href="/" 
              icon={<LayoutDashboard size={20} />} 
              isActive={location === '/'}
            >
              Dashboard
            </SidebarLink>
            <SidebarLink 
              href="/cafes" 
              icon={<Store size={20} />} 
              isActive={location.startsWith('/cafes')}
            >
              Cafe Management
            </SidebarLink>
            <SidebarLink 
              href="/kpi-settings" 
              icon={<BarChart3 size={20} />} 
              isActive={location === '/kpi-settings'}
            >
              KPI Settings
            </SidebarLink>
            <SidebarLink 
              href="/salary" 
              icon={<DollarSign size={20} />} 
              isActive={location === '/salary'}
            >
              Salary Calculation
            </SidebarLink>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
