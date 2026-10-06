import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileDropdownProps {
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8, // 8px margin
      left: rect.right - 256, // 256px is the dropdown width (w-64)
    };
  };

  const dropdownPosition = getDropdownPosition();

  return (
    <>
      {/* Dropdown Trigger */}
      <div 
        ref={triggerRef}
        className="hidden sm:flex items-center gap-3 bg-primary-foreground/10 rounded-lg px-3 py-2 border border-primary-foreground/20 cursor-pointer hover:bg-primary-foreground/20 transition-colors"
        onClick={toggleDropdown}
      >
        <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="text-left">
          <p className="text-primary-foreground font-medium text-sm">{user?.name || 'User'}</p>
          <p className="text-primary-foreground/80 text-xs">{user?.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-primary-foreground/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu - Rendered in Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-64 bg-card rounded-lg shadow-xl border border-border py-2"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-card-foreground">{user?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Theme Toggle */}
          {/* <div className="py-1">
            <button
              className="w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted flex items-center gap-3"
              onClick={() => {
                toggleTheme();
              }}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div> */}

          {/* Logout Option */}
          <div className="py-1 border-t border-border">
            <button
              className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/10 flex items-center gap-3"
              onClick={() => {
                closeDropdown();
                onLogout();
              }}
            >
              <LogOut className="w-4 h-4 text-primary" />
              Sign Out
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
