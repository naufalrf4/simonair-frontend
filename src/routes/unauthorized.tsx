import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/90 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-muted/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/70 via-destructive to-destructive/70"></div>
        <CardHeader className="text-center space-y-2 pb-0">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight text-destructive">
            403
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground text-center">
            Akses Ditolak
          </h2>
          <p className="mb-6 text-center text-muted-foreground">
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan
            hubungi administrator jika Anda memerlukan akses.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-6">
            <Button
            onClick={() => router.history.back()}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto cursor-pointer"
            asChild
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </div>
          </Button>
   
        </CardFooter>
      </Card>
    </div>
  );
}
