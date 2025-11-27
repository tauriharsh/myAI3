"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { 
  ArrowUp, Square, Loader2, Plus, 
  Sparkles, FileText, Code, Database
} from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { UploadButton } from "@/components/ai-elements/upload-button";
import { AI_NAME } from "@/config";
import { useState, useEffect } from "react";

const formSchema = z.object({
  message: z.string().min(1),
});

export default function ChatPage() {
  const { messages, status, stop, sendMessage, setMessages } = useChat();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (!data.message.trim()) return;
    sendMessage({ text: data.message });
    form.reset();
  }

  const handleSuggestion = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    form.reset();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden font-sans">
      
      {/* HEADER BAR */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-none tracking-tight text-slate-900 dark:text-white">{AI_NAME}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              onClick={handleNewSession}
              variant="outline"
              size="sm"
              className="gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          )}
          <UploadButton />
        </div>
      </header>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth relative z-0">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col">
          
          {/* HERO / EMPTY STATE */}
          {isClient && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
              
              <div className="text-center space-y-4">
                <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-blue-500/30">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Welcome to {AI_NAME}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-[600px] mx-auto">
                  Your intelligent assistant for AWS, SAP, and technical documentation. Ask me anything!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-4">
                <button 
                  onClick={(e) => handleSuggestion(e, "What is the migration strategy for SAP ECC to S/4HANA?")} 
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Database className="h-7 w-7 text-blue-600 dark:text-blue-400 mb-4" />
                    <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">SAP Migration</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Learn about ECC to S/4HANA migration strategies</div>
                  </div>
                </button>

                <button 
                  onClick={(e) => handleSuggestion(e, "What are the file size limits for AWS Lambda layers?")} 
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Code className="h-7 w-7 text-purple-600 dark:text-purple-400 mb-4" />
                    <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">AWS Lambda</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Check Lambda layer size limits and configurations</div>
                  </div>
                </button>

                <button 
                  onClick={(e) => handleSuggestion(e, "Analyze the security risks of public S3 buckets.")} 
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <FileText className="h-7 w-7 text-red-600 dark:text-red-400 mb-4" />
                    <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">Security Audit</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Analyze public S3 bucket security risks</div>
                  </div>
                </button>

                <button 
                  onClick={(e) => handleSuggestion(e, "Show me the architecture diagram for AWS Serverless.")} 
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Sparkles className="h-7 w-7 text-green-600 dark:text-green-400 mb-4" />
                    <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">Architecture</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">View serverless architecture diagrams</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // ACTIVE CHAT
            <div className="pb-32 pt-4">
              <MessageWall messages={messages} status={status} />
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING INPUT AREA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 dark:to-transparent z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 relative">
              <Controller
                name="message"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[56px] text-base pl-6 pr-4 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Ask me anything..."
                    disabled={status === "streaming" || status === "submitted"}
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                  />
                )}
              />
            </div>
            <div className="pr-2">
              {status === "streaming" || status === "submitted" ? (
                <Button 
                  size="icon" 
                  type="button" 
                  onClick={stop} 
                  variant="ghost" 
                  className="rounded-xl h-12 w-12 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Square className="h-5 w-5 fill-current" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  type="submit" 
                  className="rounded-xl h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <ArrowUp className="h-5 w-5 text-white" />
                </Button>
              )}
            </div>
          </form>
          
          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4 font-medium">
            {AI_NAME} can make mistakes. Please verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
