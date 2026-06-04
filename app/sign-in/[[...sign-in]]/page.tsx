import { SignIn } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 transition-colors">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center shadow-sm">
          <Zap className="text-background w-6 h-6 fill-current" />
        </div>
        <span className="text-3xl font-bold tracking-tight text-foreground">Supertime</span>
      </div>

      <SignIn appearance={{
        elements: {
          rootBox: "w-full max-w-md",
        }
      }} />
    </div>
  );
}
