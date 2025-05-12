import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  LineChart, 
  List, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Wallet,
  BarChart4,
  Star,
  Users,
  Coins,
  BarChart2,
  Briefcase
} from "lucide-react";
import { Section } from "@/lib/types";

interface SidebarLinkProps {
  icon: React.ElementType;
  label: string;
  section: Section;
  active?: boolean;
  collapsed?: boolean;
  onClick?: (section: Section) => void;
}

const SidebarLink = ({ 
  icon: Icon, 
  label, 
  section,
  active = false, 
  collapsed = false,
  onClick 
}: SidebarLinkProps) => {
  return (
    <button
      onClick={() => onClick && onClick(section)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md w-full transition-all duration-200",
        active 
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center"
      )}
    >
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
};

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section, params?: any) => void;
  className?: string;
}

export default function Sidebar({ activeSection, onNavigate, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56",
        className
      )}
    >
      <div className="p-4">
        <div className={cn(
          "flex items-center gap-2",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-md bg-primary/90 flex items-center justify-center">
            <BarChart4 size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <h1 className="font-semibold text-xl text-sidebar-foreground">Risk<span className="text-primary">Agent</span></h1>
          )}
        </div>
      </div>

      <div className="absolute top-4 -right-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="px-2 mt-6 space-y-6">
        <div className="space-y-1">
          <SidebarLink 
            icon={LayoutDashboard} 
            label="Dashboard" 
            section="dashboard"
            active={activeSection === 'dashboard'}
            collapsed={collapsed}
            onClick={onNavigate}
          />
          <SidebarLink 
            icon={List} 
            label="Portfolio List" 
            section="portfolios"
            active={activeSection === 'portfolios'}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        </div>

        <div className="pt-4 border-t border-sidebar-border">
          <p className={cn(
            "text-xs uppercase text-sidebar-foreground/60 mb-2 px-3",
            collapsed && "text-center"
          )}>
            {collapsed ? "Assets" : "Asset-Übersicht"}
          </p>
          <div className="space-y-1">
            <SidebarLink 
              icon={Briefcase} 
              label="Alle Assets" 
              section="assets"
              active={activeSection === 'assets'}
              collapsed={collapsed}
              onClick={onNavigate}
            />
            <SidebarLink 
              icon={Coins} 
              label="Kryptowährungen" 
              section="crypto-assets"
              active={activeSection === 'crypto-assets'}
              collapsed={collapsed}
              onClick={onNavigate}
            />
            <SidebarLink 
              icon={BarChart2} 
              label="Aktien" 
              section="stock-assets"
              active={activeSection === 'stock-assets'}
              collapsed={collapsed}
              onClick={onNavigate}
            />
            <SidebarLink 
              icon={TrendingUp} 
              label="ETFs" 
              section="etf-assets"
              active={activeSection === 'etf-assets'}
              collapsed={collapsed}
              onClick={onNavigate}
            />
          </div>
        </div>

        
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-3">
        <SidebarLink 
          icon={Settings} 
          label="Settings" 
          section="dashboard"
          active={false}
          collapsed={collapsed}
          onClick={onNavigate}
        />
      </div>
    </div>
  );
}
