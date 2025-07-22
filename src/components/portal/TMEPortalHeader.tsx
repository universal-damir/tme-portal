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
  onOpenAIAssistant?: () => void;
  isAIAssistantOpen?: boolean;
}

export function TMEPortalHeader({ 
  title = "Cost Overview Generator",
  onGeneratePDF,
  onPreview,
  onOpenAIAssistant,
  isAIAssistantOpen = false
}: TMEPortalHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {onOpenAIAssistant && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isAIAssistantOpen ? "secondary" : "ghost"}
                  size="sm" 
                  onClick={onOpenAIAssistant}
                  className={`flex items-center gap-2 transition-all duration-200 relative ${
                    isAIAssistantOpen 
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-md" 
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  <Bot className={`h-4 w-4 transition-transform duration-200 ${
                    isAIAssistantOpen ? 'scale-110' : ''
                  }`} />
                  <span className="hidden sm:inline">AI Assistant</span>
                  {isAIAssistantOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open AI Assistant to help fill forms with natural language</p>
              </TooltipContent>
            </Tooltip>
          )}
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