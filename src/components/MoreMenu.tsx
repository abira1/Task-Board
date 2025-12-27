import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BuildingIcon, 
  BarChart3Icon, 
  UsersIcon, 
  LogOutIcon,
  UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from './ui/sheet';
import { Separator } from './ui/separator';
import { AvatarComponent, AvatarImage, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';

interface MoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ open, onOpenChange }) => {
  const { user, logout, isAdmin } = useAuth();

  const MenuItem = ({ to, icon: Icon, label, onClick }: any) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
      onOpenChange(false);
    };

    if (onClick) {
      return (
        <button
          onClick={handleClick}
          className="flex items-center w-full p-4 hover:bg-[#f5f0e8] transition-colors active:bg-[#f5eee8] rounded-lg"
          data-testid={`more-menu-${label.toLowerCase().replace(' ', '-')}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center mr-3">
            <Icon className="h-5 w-5 text-[#7a7067]" />
          </div>
          <span className="text-base text-[#3a3226] font-medium">{label}</span>
        </button>
      );
    }

    return (
      <NavLink
        to={to}
        onClick={() => onOpenChange(false)}
        className="flex items-center p-4 hover:bg-[#f5f0e8] transition-colors active:bg-[#f5eee8] rounded-lg"
        data-testid={`more-menu-${label.toLowerCase().replace(' ', '-')}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center mr-3">
          <Icon className="h-5 w-5 text-[#7a7067]" />
        </div>
        <span className="text-base text-[#3a3226] font-medium">{label}</span>
      </NavLink>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[70vh] rounded-t-2xl"
        data-testid="more-menu-sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-['Caveat',_cursive] text-[#3a3226]">
            More Options
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(70vh-80px)]">
          {/* User Profile Section */}
          <div className="flex items-center p-4 bg-[#f5f0e8] rounded-lg mb-4">
            <AvatarComponent className="w-12 h-12 mr-3">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-[#d4a5a5] text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </AvatarComponent>
            <div>
              <p className="text-base font-medium text-[#3a3226]">{user?.name}</p>
              <p className="text-sm text-[#7a7067] capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Menu Items */}
          <div className="space-y-2">
            <MenuItem 
              to="/leads" 
              icon={BuildingIcon} 
              label="Lead Management" 
            />
            
            <MenuItem 
              to="/progress" 
              icon={BarChart3Icon} 
              label="Progress Tracker" 
            />

            {isAdmin() && (
              <MenuItem 
                to="/team" 
                icon={UsersIcon} 
                label="Team Management" 
              />
            )}

            <Separator className="my-4" />

            <MenuItem 
              icon={LogOutIcon} 
              label="Logout" 
              onClick={logout}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MoreMenu;
