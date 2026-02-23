import { SignIn } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-neo-yellow flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-12 h-12 bg-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_theme(colors.neo-pink)]">
          <Zap className="text-neo-yellow w-8 h-8 fill-current" />
        </div>
        <span className="text-4xl font-black uppercase tracking-tighter">Supertime</span>
      </div>

      <SignIn appearance={{
        elements: {
          rootBox: "w-full max-w-md",
        }
      }} />
    </div>
  );
}
