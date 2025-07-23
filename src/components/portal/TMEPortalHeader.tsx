'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useAuth } from '@/contexts/AuthContext'

interface TMEPortalHeaderProps {
  title?: string;
  onGeneratePDF?: () => void;
  onPreview?: () => void;
}

export function TMEPortalHeader({ 
  title = "Cost Overview Generator",
  onGeneratePDF,
  onPreview
}: TMEPortalHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.department} • {user.designation}
                  </span>
                </div>
                
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserAvatar user={user} size="sm" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 