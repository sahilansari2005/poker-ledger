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

function ResponsiveDialog({ ...props }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <Drawer.Root data-slot="responsive-dialog" shouldScaleBackground {...props} />
  }

  return <Dialog data-slot="responsive-dialog" {...props} />
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs" />
        <Drawer.Content
          data-slot="responsive-dialog-content"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-2xl border border-border/50 bg-popover p-4 pb-6 text-popover-foreground shadow-xl outline-none",
            className
          )}
          {...props}
        >
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {showCloseButton && (
            <Drawer.Close asChild>
              <Button variant="ghost" className="absolute top-3 right-3" size="icon-sm">
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

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  DialogHeader as ResponsiveDialogHeader,
  DialogFooter as ResponsiveDialogFooter,
  DialogTitle as ResponsiveDialogTitle,
  DialogDescription as ResponsiveDialogDescription,
}
