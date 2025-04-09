import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, ShieldAlert, ShieldCheck, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PasswordProtectionProps {
  onAuthenticated: () => void;
  password: string;
}

export function PasswordProtection({ onAuthenticated, password }: PasswordProtectionProps) {
  const [inputPassword, setInputPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate a small delay to show the loading state
    setTimeout(() => {
      if (inputPassword === password) {
        setIsError(false);
        toast({
          title: "Access granted",
          description: "You now have access to KPI settings",
          variant: "default",
        });
        onAuthenticated();
      } else {
        setIsError(true);
        setIsSubmitting(false);
        toast({
          title: "Access denied",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
      }
    }, 600);
  };

  return (
    <motion.div 
      className="flex items-center justify-center min-h-[calc(100vh-200px)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isError ? (
                <ShieldAlert className="h-8 w-8 text-red-500" />
              ) : (
                <Lock className="h-8 w-8 text-primary" />
              )}
            </div>
          </motion.div>
          <CardTitle className="text-2xl font-bold text-center">
            KPI Settings Access
          </CardTitle>
          <CardDescription className="text-center">
            Enter the password to manage KPI settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (isError) setIsError(false);
                  }}
                  className={`pl-10 ${isError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  autoComplete="off"
                  ref={inputRef}
                  disabled={isSubmitting}
                />
              </div>
              {isError && (
                <motion.p 
                  className="text-sm text-red-500 flex items-center gap-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ShieldAlert className="h-3 w-3" />
                  Incorrect password. Please try again.
                </motion.p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !inputPassword.trim()}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Authenticate
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}