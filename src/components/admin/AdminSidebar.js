import React from 'react';
import {
  LayoutDashboard,
  Archive,
  BarChart3,
  Folder,
  Users,
  Settings,
  HelpCircle,
  MoreVertical,
  Zap,
  Building2,
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const mainMenuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'properties', icon: Building2, label: 'Properties' },
    { id: 'investments', icon: BarChart3, label: 'Investments' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'transactions', icon: Archive, label: 'Transactions' },
  ];

  const documentItems = [
    { id: 'organizations', icon: Folder, label: 'Organizations' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border overflow-y-auto scrollbar-hide flex flex-col h-screen">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/logo1.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Admin Panel</p>
            </div>
          </div>
          <button className="w-full bg-sidebar-primary text-sidebar-primary-foreground rounded-lg py-2.5 px-3 text-sm font-semibold hover:bg-sidebar-primary/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
            <Zap className="w-4 h-4" />
            Quick Create
          </button>
        </div>

        {/* Main Menu */}
        <nav className="space-y-1">
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-md'
                  : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Documents Section */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-widest pl-1">
            Management
          </p>
          <nav className="space-y-1">
            {documentItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-md'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Section - Fixed */}
      <div className="border-t border-sidebar-border/50 p-6 space-y-3">
        <button
          type="button"
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>Get Help</span>
        </button>

        {/* User Profile */}
        <div className="border-t border-sidebar-border/50 pt-3 mt-3">
          <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer group">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sidebar-primary/80 to-sidebar-primary/60 flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">Admin</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">admin@hmr.com</p>
              </div>
            </div>
            <MoreVertical className="w-4 h-4 text-sidebar-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

