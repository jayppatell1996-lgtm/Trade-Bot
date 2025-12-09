import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-card/50 backdrop-blur border-destructive/50">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button className="mt-4" variant="outline">Return Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
