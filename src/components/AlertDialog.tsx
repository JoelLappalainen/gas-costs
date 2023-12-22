import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function AlertDialog({
  open,
  setOpen,
  title,
  message,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2 text-center">
          {message}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

export default AlertDialog;
