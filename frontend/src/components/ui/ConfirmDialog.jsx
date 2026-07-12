import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          {description ? (
            <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
          ) : null}
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="w-full sm:w-auto"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
