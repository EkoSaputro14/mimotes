"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import AppSidebar from "./app-sidebar";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function MobileNav({ open, onOpenChange, user }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false} className="w-[280px] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <AppSidebar
          user={user}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
