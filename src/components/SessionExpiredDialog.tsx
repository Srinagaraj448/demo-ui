import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onRedirectToLogin: () => void;
}

export const SessionExpiredDialog: React.FC<SessionExpiredDialogProps> = ({
  isOpen,
  onRedirectToLogin
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Session Expired
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600">
            Your session has expired. Please log in again to continue using the application.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onRedirectToLogin}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
          >
            OK, Login Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 