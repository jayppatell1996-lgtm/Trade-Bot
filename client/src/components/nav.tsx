import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, ArrowRightLeft, History, Trophy } from "lucide-react";

export function Nav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/trade", label: "Trade Simulator", icon: ArrowRightLeft },
    { href: "/history", label: "Trade History", icon: History },
  ];

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="font-mono text-lg font-bold tracking-tight">DraftOps</span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
