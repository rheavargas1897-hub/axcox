import React from "react"
import {
  LayoutDashboard,
  CalendarClock,
  Route,
  ShoppingCart,
  Users,
  Megaphone,
  Ticket,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "../lib/utils"

const menuItems = [
  { label: "\u552E\u7968\u770B\u677F", icon: LayoutDashboard, href: "/" },
  { label: "\u73ED\u6B21\u7BA1\u7406", icon: CalendarClock, href: "/schedules" },
  { label: "\u8DEF\u7EBF\u7BA1\u7406", icon: Route, href: "/routes" },
  { label: "\u8D2D\u7968\u8BA2\u5355", icon: ShoppingCart, href: "/orders" },
  { label: "\u4E58\u5BA2\u7BA1\u7406", icon: Users, href: "/passengers" },
  { label: "\u8425\u9500\u6D3B\u52A8", icon: Megaphone, href: "/marketing" },
]

export function AppSidebar() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/"
  const [expanded, setExpanded] = React.useState(true)

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Ticket className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold text-sidebar-foreground">{"\u5BA2\u8FD0\u552E\u7968"}</span>
      </div>

      {/* Menu Section */}
      <nav className="flex-1 overflow-y-auto py-3">
        <button
          onClick={function() { setExpanded(!expanded) }}
          className="flex items-center justify-between w-full px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span>{"\u552E\u7968\u7BA1\u7406"}</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {expanded && (
          <ul className="mt-1">
            {menuItems.map(function(item) {
              var isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
            {"\u7BA1"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{"\u7BA1\u7406\u5458"}</p>
            <p className="text-[10px] text-muted-foreground truncate">admin@transport.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
