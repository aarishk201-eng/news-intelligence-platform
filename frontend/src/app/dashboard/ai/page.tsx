import { AiChat } from "@/components/ai/AiChat";
import { Brain } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI Assistant' };

export default function AiAssistantPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">AI Assistant</h1>
            <p className="text-muted-foreground mt-1">
              Ask deep contextual questions across your entire news database.
            </p>
          </div>
        </div>
      </div>

      <AiChat />
    </div>
  );
}
