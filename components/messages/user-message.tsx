import { UIMessage } from "ai";
import { Response } from "@/components/ai-elements/response";

export function UserMessage({ message }: { message: UIMessage }) {
    return (
        <div className="whitespace-pre-wrap w-full flex justify-end mb-4">
            <div className="max-w-[80%] w-fit px-5 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <div className="text-sm">
                    {message.parts.map((part, i) => {
                        switch (part.type) {
                            case "text":
                                return <Response key={`${message.id}-${i}`} className="text-white [&_a]:text-blue-100 [&_a:hover]:text-white">{part.text}</Response>;
                        }
                    })}
                </div>
            </div>
        </div>
    )
}
