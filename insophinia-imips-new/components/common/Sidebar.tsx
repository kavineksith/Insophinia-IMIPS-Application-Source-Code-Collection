
import React, { Fragment } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page, Role } from '../../types';
import { ChartPieIcon, ArchiveBoxIcon, UsersIcon, ChatBubbleLeftRightIcon, BuildingOffice2Icon, EnvelopeIcon, ShoppingCartIcon, ClipboardDocumentListIcon, Cog6ToothIcon, DocumentChartBarIcon, CommandLineIcon, TicketIcon, UserGroupIcon, ShieldCheckIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const navItems = [
    { name: Page.Dashboard, icon: ChartPieIcon, roles: [Role.Admin, Role.Manager, Role.Staff] },
    { name: Page.Inventory, icon: ArchiveBoxIcon, roles: [Role.Admin, Role.Manager, Role.Staff] },
    { name: Page.Catalog, icon: ShoppingCartIcon, roles: [Role.Admin, Role.Manager, Role.Staff] },
    { name: Page.Orders, icon: ClipboardDocumentListIcon, roles: [Role.Admin, Role.Manager, Role.Staff] },
    { name: Page.Inquiries, icon: ChatBubbleLeftRightIcon, roles: [Role.Admin, Role.Manager, Role.Staff] },
    { name: Page.Discounts, icon: TicketIcon, roles: [Role.Admin, Role.Manager] },
    { name: Page.Email, icon: EnvelopeIcon, roles: [Role.Admin, Role.Manager] },
    { name: Page.Newsletters, icon: PaperAirplaneIcon, roles: [Role.Admin, Role.Manager] },
    { name: Page.Users, icon: UsersIcon, roles: [Role.Admin] },
    { name: Page.Reports, icon: DocumentChartBarIcon, roles: [Role.Admin, Role.Manager] },
    { name: Page.ActivityLog, icon: UserGroupIcon, roles: [Role.Admin, Role.Manager] },
    { name: Page.Security, icon: ShieldCheckIcon, roles: [Role.Admin] },
    { name: Page.Settings, icon: Cog6ToothIcon, roles: [Role.Admin] },
    { name: Page.Logs, icon: CommandLineIcon, roles: [Role.Admin] },
  ];
  
  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsOpen(false); // Close sidebar on navigation
  };

  const NavLink: React.FC<{ name: Page, icon: React.ElementType }> = ({ name, icon: Icon }) => {
    const isActive = currentPage === name;
    return (
      <li
        onClick={() => handleNavClick(name)}
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? 'bg-brand-accent text-white shadow-lg'
            : 'text-gray-300 hover:bg-brand-secondary hover:text-white'
        }`}
      >
        <Icon className="h-6 w-6 mr-4" />
        <span className="font-medium">{name}</span>
      </li>
    );
  };

  const sidebarContent = (
    <div className="w-64 bg-brand-primary text-white flex flex-col h-full">
      <div className="flex items-center justify-center p-6 border-b border-brand-secondary">
        <BuildingOffice2Icon className="h-10 w-10 mr-3" />
        <h1 className="text-xl font-bold tracking-wider">Insophinia IMIPS</h1>
      </div>
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <ul>
          {navItems.map(item =>
            user && item.roles.includes(user.role) && (
              <NavLink key={item.name} name={item.name} icon={item.icon} />
            )
          )}
        </ul>
      </nav>
    </div>
  );

  return (
    <Fragment>
      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
        aria-hidden={!isOpen}
      >
        {sidebarContent}
      </div>
      
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        {sidebarContent}
      </div>
    </Fragment>
  );
};

export default Sidebar;
