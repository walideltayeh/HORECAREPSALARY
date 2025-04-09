import { useState, useEffect } from 'react';
import { KpiSettings } from '@/components/kpi/KpiSettings';
import { PasswordProtection } from '@/components/kpi/PasswordProtection';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

// Password is hardcoded as specified by the requirements
const KPI_SETTINGS_PASSWORD = "AlFakher2025";
const KPI_AUTH_KEY = "kpiAuthStatus";

export default function KpiSettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check sessionStorage for auth status on component mount
  useEffect(() => {
    const savedAuthStatus = sessionStorage.getItem(KPI_AUTH_KEY);
    if (savedAuthStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
    // Store auth status in sessionStorage
    sessionStorage.setItem(KPI_AUTH_KEY, 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Remove auth status from sessionStorage
    sessionStorage.removeItem(KPI_AUTH_KEY);
  };

  return (
    <section id="kpi" className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">KPI Settings</h2>
        
        {isAuthenticated && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </Button>
        )}
      </div>
      
      {isAuthenticated ? (
        <KpiSettings />
      ) : (
        <PasswordProtection 
          onAuthenticated={handleAuthentication}
          password={KPI_SETTINGS_PASSWORD}
        />
      )}
    </section>
  );
}
