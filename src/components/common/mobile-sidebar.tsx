import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/common/sidebar";
import { useAuth } from "@/features/authentication/context/AuthContext";

export function MobileSidebar() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80 max-w-[90vw]">
        <Sidebar isInsideSheet />
      </SheetContent>
    </Sheet>
  );
}
