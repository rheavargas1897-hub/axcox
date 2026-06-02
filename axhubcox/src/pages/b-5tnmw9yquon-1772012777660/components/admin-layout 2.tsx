import React from "react"
import { AppSidebar } from "../components/app-sidebar"
import { Bell, Download, Search } from "lucide-react"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-12 px-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={"\u641C\u7D22\u529F\u80FD..."}
                className="h-7 w-52 rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Downloads">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="relative p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
              {"\u7279"}
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
