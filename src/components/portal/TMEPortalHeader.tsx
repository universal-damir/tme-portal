'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Bot } from 'lucide-react'

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                asChild 
                size="sm" 
                className="hidden sm:flex dark:text-foreground"
              >
                <a
                  href="https://tme-services.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Help
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get help and documentation for using the portal</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
} 