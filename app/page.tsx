"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { 
  ArrowUp, Square, Loader2, Plus, MessageSquare, 
  Server, Database, ShieldAlert, FileText, Zap
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
  const { messages, sendMessage, status, stop, setMessages, append } = useChat();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  // Helper to send a preset question
  const handleSuggestionClick = (text: string) => {
    append({ role: "user", content: text });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
        
        {/* --- LEFT SIDEBAR (Glassmorphic) --- */}
        <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-lg">
          <SidebarHeader className="p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold leading-none tracking-tight">{AI_NAME}</h2>
                <p className="text-[10px] text-muted-foreground mt-1">Enterprise Edition</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => window.location.reload()} className="hover:bg-primary/10 transition-colors">
                      <Plus className="mr-2 text-primary" />
                      <span className="font-medium">New Session</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled className="opacity-50">
                      <MessageSquare className="mr-2" />
                      <span>Chat History</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/40 text-xs text-muted-foreground/70">
             Licensed to {OWNER_NAME}
          </SidebarFooter>
        </Sidebar>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col h-full relative bg-grid-pattern">
          
          {/* HEADER BAR */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 z-10 glass-panel">
            <SidebarTrigger />
            <div className="w-px h-6 bg-border/50 mx-2" />
            <span className="text-sm font-medium text-muted-foreground">Tech Lead Assistant</span>
            <div className="flex-1" />
            <UploadButton />
          </header>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
             <div className="max-w-3xl mx-auto min-h-full flex flex-col">
               
               {/* EMPTY STATE: The "Hero" Dashboard */}
               {isClient && messages.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center -mt-20 animate-fade-in">
                    <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight mb-2">
                      Good Afternoon, {OWNER_NAME}
                    </h1>
                    <p className="text-muted-foreground mb-8 text-center max-w-md">
                      I can help you plan migrations, debug SAP/AWS errors, or analyze technical documents.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                      
                      {/* Suggestion Card 1 */}
                      <button 
                        onClick={() => handleSuggestionClick("What is the migration strategy for SAP ECC to S/4HANA?")}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
                          <Database className="h-4 w-4" />
                          <span>SAP Strategy</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          "What is the migration strategy for SAP ECC to S/4HANA?"
                        </div>
                      </button>

                      {/* Suggestion Card 2 */}
                      <button 
                        onClick={() => handleSuggestionClick("What are the file size limits for AWS Lambda layers?")}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all text-left group"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
                          <Server className="h-4 w-4" />
                          <span>AWS Limits</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          "What are the file size limits for AWS Lambda layers?"
                        </div>
                      </button>

                       {/* Suggestion Card 3 */}
                       <button 
                        onClick={() => handleSuggestionClick("Analyze the security risks of public S3 buckets.")}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all text-left group"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Security Audit</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          "Analyze the security risks of public S3 buckets."
                        </div>
                      </button>

                      {/* Suggestion Card 4 */}
                       <button 
                        onClick={() => handleSuggestionClick("Summarize the latest architecture diagram for Migration Hub.")}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all text-left group"
                      >
                         <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
                          <FileText className="h-4 w-4" />
                          <span>Architecture</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          "Summarize the latest architecture diagram for Migration Hub."
                        </div>
                      </button>

                    </div>
                 </div>
               ) : (
                 // ACTIVE CHAT
                 <div className="pb-32 pt-4">
                    <MessageWall messages={messages} status={status} />
                    {status === "submitted" && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-4 ml-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                 </div>
               )}

             </div>
          </div>

          {/* FLOATING INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-20">
            <div className="max-w-3xl mx-auto relative shadow-2xl rounded-2xl">
              <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex items-center gap-2 p-2 bg-card border border-border/60 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                 <div className="flex-1 relative">
                   <Input
                      {...form.register("message")}
                      className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[48px] text-base pl-4"
                      placeholder="Ask about AWS, SAP, or upload a doc..."
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
                       <Button size="icon" type="submit" className="rounded-xl h-10 w-10 transition-transform active:scale-95">
                         <ArrowUp className="h-5 w-5" />
                       </Button>
                    )}
                  </div>
              </form>
              <div className="text-center text-[10px] text-muted-foreground/60 mt-3 font-medium">
                Confidential Enterprise Environment. Do not share sensitive customer PII.
              </div>
            </div>
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}
