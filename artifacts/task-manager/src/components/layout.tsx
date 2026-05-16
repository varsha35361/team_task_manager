import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, FolderGit2, Users } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/projects", label: "Projects", icon: FolderGit2 },
    { href: "/members", label: "Members", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="font-mono font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-sm" />
            TASKFLOW
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
