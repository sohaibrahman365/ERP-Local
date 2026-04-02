"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Car, Building2,
  DollarSign, UserCog, Settings, LogOut, ChevronDown, ChevronRight,
  FileText, CreditCard, BookOpen, Landmark,
  Clock, CalendarOff, Wallet, UsersRound,
  Shield, MapPin, Building,
} from "lucide-react";
import { cn } from "@wise/ui";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Real Estate", href: "/real-estate", icon: Building2 },
  {
    label: "Finance", href: "/finance", icon: DollarSign,
    children: [
      { label: "Overview", href: "/finance", icon: DollarSign },
      { label: "Invoices", href: "/finance/invoices", icon: FileText },
      { label: "Payments", href: "/finance/payments", icon: CreditCard },
      { label: "Accounts", href: "/finance/accounts", icon: Landmark },
      { label: "Journal Entries", href: "/finance/journal-entries", icon: BookOpen },
    ],
  },
  {
    label: "HR & Payroll", href: "/hr", icon: UserCog,
    children: [
      { label: "Overview", href: "/hr", icon: UserCog },
      { label: "Employees", href: "/hr/employees", icon: UsersRound },
      { label: "Attendance", href: "/hr/attendance", icon: Clock },
      { label: "Leave", href: "/hr/leave", icon: CalendarOff },
      { label: "Payroll", href: "/hr/payroll", icon: Wallet },
    ],
  },
  {
    label: "Settings", href: "/settings", icon: Settings,
    children: [
      { label: "General", href: "/settings", icon: Settings },
      { label: "Users", href: "/settings/users", icon: Users },
      { label: "Roles", href: "/settings/roles", icon: Shield },
      { label: "Departments", href: "/settings/departments", icon: Building },
      { label: "Locations", href: "/settings/locations", icon: MapPin },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenant, logout } = useAuthStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        initial[item.href] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (href: string) => {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">WisePlatform</h1>
        {tenant && <p className="text-xs text-muted-foreground mt-1">{tenant.name}</p>}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isExpanded = expanded[item.href];

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleExpand(item.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors w-full",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors",
                            childActive
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-destructive w-full rounded-md"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
