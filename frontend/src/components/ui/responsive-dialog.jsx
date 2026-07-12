"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ResponsiveDialogModeContext = React.createContext(false)

function useResponsiveDialogMode() {
  return React.useContext(ResponsiveDialogModeContext)
}

function ResponsiveDialog({ children, ...props }) {
  const isMobile = useIsMobile()

  return (
    <ResponsiveDialogModeContext.Provider value={isMobile}>
      {isMobile ? (
        <Drawer.Root
          data-slot="responsive-dialog"
          // Scaling the background creates a transform containing block that traps position:fixed.
          shouldScaleBackground={false}
          {...props}
        >
          {children}
        </Drawer.Root>
      ) : (
        <Dialog data-slot="responsive-dialog" {...props}>
          {children}
        </Dialog>
      )}
    </ResponsiveDialogModeContext.Provider>
  )
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  const isMobile = useResponsiveDialogMode()

  if (isMobile) {
    return (
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs" />
        <Drawer.Content
          data-slot="responsive-dialog-content"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[min(90dvh,100dvh)] flex-col rounded-t-xl border border-border/60 bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-xl outline-none",
            className
          )}
          {...props}
        >
          <div className="mx-auto mt-3 mb-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
            {children}
          </div>
          {showCloseButton && (
            <Drawer.Close asChild>
              <Button
                variant="ghost"
                className="absolute top-3 right-3 touch-manipulation"
                size="icon-sm"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </Drawer.Close>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    )
  }

  return (
    <DialogContent className={className} showCloseButton={showCloseButton} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogBody({ className, ...props }) {
  const isMobile = useResponsiveDialogMode()

  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn(
        isMobile && "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
        className
      )}
      {...props}
    />
  )
}

function ResponsiveDialogFooter({ className, ...props }) {
  const isMobile = useResponsiveDialogMode()

  return (
    <DialogFooter
      className={cn(
        isMobile &&
          "mt-auto shrink-0 border-t border-border/20 bg-popover pt-4 pb-4",
        className
      )}
      {...props}
    />
  )
}

function ResponsiveDialogHeader({ className, ...props }) {
  const isMobile = useResponsiveDialogMode()

  return (
    <DialogHeader
      className={cn(isMobile && "shrink-0 pr-10 text-left", className)}
      {...props}
    />
  )
}

function ResponsiveDialogTitle({ className, ...props }) {
  const isMobile = useResponsiveDialogMode()

  if (isMobile) {
    return (
      <Drawer.Title
        data-slot="responsive-dialog-title"
        className={cn("text-2xl leading-tight font-semibold", className)}
        {...props}
      />
    )
  }

  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({ className, ...props }) {
  const isMobile = useResponsiveDialogMode()

  if (isMobile) {
    return (
      <Drawer.Description
        data-slot="responsive-dialog-description"
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    )
  }

  return <DialogDescription className={className} {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogModeContext,
  useResponsiveDialogMode,
}
