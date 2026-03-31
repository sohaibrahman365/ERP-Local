"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Car, Building2,
  DollarSign, UserCog, Settings, LogOut,
} from "lucide-react";
import { cn } from "@wise/ui";
import { useAuthStore } from "@/lib/store";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Real Estate", href: "/real-estate", icon: Building2 },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "HR & Payroll", href: "/hr", icon: UserCog },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenant, logout } = useAuthStore();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">WisePlatform</h1>
        {tenant && <p className="text-xs text-muted-foreground mt-1">{tenant.name}</p>}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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
