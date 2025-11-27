import { UIMessage, ToolCallPart, ToolResultPart } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";
import { ToolCall, ToolResult } from "./tool-call";
import { Bot } from "lucide-react";

export function AssistantMessage({ message, status, isLastMessage, durations, onDurationChange }: { message: UIMessage; status?: string; isLastMessage?: boolean; durations?: Record<string, number>; onDurationChange?: (key: string, duration: number) => void }) {
    return (
        <div className="w-full mb-6">
            <div className="flex gap-3 items-start">
                {/* Avatar */}
                <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 text-sm flex flex-col gap-4">
                    {message.parts.map((part, i) => {
                        const isStreaming = status === "streaming" && isLastMessage && i === message.parts.length - 1;
                        const durationKey = `${message.id}-${i}`;
                        const duration = durations?.[durationKey];

                        if (part.type === "text") {
                            return (
                                <div key={`${message.id}-${i}`} className="prose prose-slate dark:prose-invert max-w-none">
                                    <Response>{part.text}</Response>
                                </div>
                            );
                        } else if (part.type === "reasoning") {
                            return (
                                <ReasoningPart
                                    key={`${message.id}-${i}`}
                                    part={part}
                                    isStreaming={isStreaming}
                                    duration={duration}
                                    onDurationChange={onDurationChange ? (d) => onDurationChange(durationKey, d) : undefined}
                                />
                            );
                        } else if (
                            part.type.startsWith("tool-") || part.type === "dynamic-tool"
                        ) {
                            if ('state' in part && part.state === "output-available") {
                                return (
                                    <ToolResult
                                        key={`${message.id}-${i}`}
                                        part={part as unknown as ToolResultPart}
                                    />
                                );
                            } else {
                                return (
                                    <ToolCall
                                        key={`${message.id}-${i}`}
                                        part={part as unknown as ToolCallPart}
                                    />
                                );
                            }
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    )
}
