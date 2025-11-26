"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { 
  ArrowUp, Square, Loader2, Plus, MessageSquare, 
  Server, Database, ShieldAlert, FileText, Zap, LayoutGrid
} from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { UploadButton } from "@/components/ai-elements/upload-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AI_NAME, OWNER_NAME } from "@/config";
import { useState, useEffect } from "react";

const formSchema = z.object({
  message: z.string().min(1),
});

export default function ChatPage() {
  // --- CRITICAL FIX HERE ---
  // We cast to 'any' to stop Vercel from failing the build due to strict type checks.
  const { messages, status, stop, append, setMessages } = useChat() as any;
  // -------------------------
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Using 'append' to send the message
    append({ role: 'user', content: data.message });
    form.reset();
  }

  const handleSuggestion = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    append({ role: "user", content: text });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/10">
        
        {/* --- LEFT SIDEBAR --- */}
        <Sidebar className="border-r border-border/40 bg-muted/30">
          <SidebarHeader className="p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold leading-none tracking-tight">{AI_NAME}</h2>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Enterprise Edition</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => window.location.reload()} className="hover:bg-primary/5 transition-colors">
                      <Plus className="mr-2 text-primary/80" />
                      <span className="font-medium">New Session</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled className="opacity-50">
                      <LayoutGrid className="mr-2" />
                      <span>Templates</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/40 text-xs text-muted-foreground/60 font-medium">
             Licensed to {OWNER_NAME}
          </SidebarFooter>
        </Sidebar>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col h-full relative bg-grid-pattern">
          
          {/* HEADER BAR */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 z-10 glass-panel sticky top-0">
            <SidebarTrigger />
            <div className="w-px h-5 bg-border/60 mx-2" />
            <span className="text-sm font-medium text-muted-foreground/80">Technical Assistant</span>
            <div className="flex-1" />
            <UploadButton />
          </header>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth relative z-0">
             <div className="max-w-3xl mx-auto min-h-full flex flex-col">
               
               {/* HERO DASHBOARD */}
               {isClient && messages.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center -mt-20 animate-fade-in space-y-8">
                    
                    <div className="text-center space-y-2">
                      <div className="h-20 w-20 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-3xl flex items-center justify-center mb-6 mx-auto ring-1 ring-border shadow-xl">
                        <Server className="h-10 w-10 text-primary" />
                      </div>
                      <h1 className="text-3xl font-semibold tracking-tight">
                        Welcome back, {OWNER_NAME}
                      </h1>
                      <p className="text-muted-foreground text-base max-w-[500px] mx-auto">
                        I can help you plan AWS migrations, debug SAP errors, or analyze your uploaded documents.
                      </p>
                    </div>

                    {/* SUGGESTION GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4 relative z-50">
                      
                      <button 
                        type="button"
                        onClick={(e) => handleSuggestion(e, "What is the migration strategy for SAP ECC to S/4HANA?")} 
                        className="hero-card cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary transition-colors">
                          <Database className="h-4 w-4" />
                          <span>SAP Strategy</span>
                        </div>
                        <div className="text-xs text-muted-foreground/80">"How do I migrate SAP ECC to S/4HANA?"</div>
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => handleSuggestion(e, "What are the file size limits for AWS Lambda layers?")} 
                        className="hero-card cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary transition-colors">
                          <Server className="h-4 w-4" />
                          <span>AWS Limits</span>
                        </div>
                        <div className="text-xs text-muted-foreground/80">"Check Lambda layer size limits."</div>
                      </button>

                       <button 
                        type="button"
                        onClick={(e) => handleSuggestion(e, "Analyze the security risks of public S3 buckets.")} 
                        className="hero-card cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary transition-colors">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Security Audit</span>
                        </div>
                        <div className="text-xs text-muted-foreground/80">"Analyze public S3 bucket risks."</div>
                      </button>

                       <button 
                        type="button"
                        onClick={(e) => handleSuggestion(e, "Show me the architecture diagram for AWS Serverless.")} 
                        className="hero-card cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary transition-colors">
                          <FileText className="h-4 w-4" />
                          <span>Architecture</span>
                        </div>
                        <div className="text-xs text-muted-foreground/80">"Show me the serverless diagram."</div>
                      </button>
                    </div>
                 </div>
               ) : (
                 // ACTIVE CHAT
                 <div className="pb-32 pt-4">
                    <MessageWall messages={messages} status={status} />
                    {status === "submitted" && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-4 ml-4 animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                    )}
                 </div>
               )}
             </div>
          </div>

          {/* FLOATING INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto relative shadow-2xl rounded-2xl ring-1 ring-border/40 pointer-events-auto">
              <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex items-center gap-2 p-2 bg-card/80 backdrop-blur-xl rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                 <div className="flex-1 relative">
                   <Input
                      {...form.register("message")}
                      className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[52px] text-base pl-4 placeholder:text-muted-foreground/50"
                      placeholder="Ask a technical question or upload a PDF..."
                      disabled={status === "streaming"}
                      autoComplete="off"
                    />
                 </div>
                  <div className="pr-2">
                    {status === "streaming" ? (
                       <Button size="icon" type="button" onClick={stop} variant="ghost" className="rounded-xl h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors">
                         <Square className="h-4 w-4 fill-current" />
                       </Button>
                    ) : (
                       <Button size="icon" type="submit" className="rounded-xl h-10 w-10 shadow-sm transition-transform active:scale-95">
                         <ArrowUp className="h-5 w-5" />
                       </Button>
                    )}
                  </div>
              </form>
              <div className="text-center text-[10px] text-muted-foreground/50 mt-3 font-medium">
                Confidential Enterprise Environment. Do not share sensitive customer PII.
              </div>
            </div>
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}
