const models = [
    {
        name: "ChatGPT",
        description: "OpenAI's conversational AI",
        icon: "⊗",
        llms: [
            { name: "gpt-5" },
            { name: "gpt-5-mini" },
            { name: "gpt-5-nano" },
            { name: "gpt-5-chat" },
            { name: "gpt-4.1" },
            { name: "gpt-4.1-mini" },
            { name: "gpt-4.1-nano" },
            { name: "gpt-4o" },
            { name: "gpt-4o-mini" },
            { name: "o3" },
            { name: "o3-mini" },
            { name: "o3-mini-high" },
            { name: "o3-pro" },
            { name: "o4-mini" },
            { name: "o4-mini-high" }
        ]
    },
    {
        name: "Gemini",
        description: "Google's AI model",
        icon: "💎",
        llms: [
            { name: "gemini-1.5-flash" },
            { name: "gemini-1.5-pro" },
            { name: "gemini-1.5-flash-8b" },
            { name: "gemini-2.5-pro" },
            { name: "gemini-2.5-flash" },
            { name: "gemini-2.5-flash-lite" },
            { name: "gemini-live-2.5-flash-preview" },
            { name: "gemini-2.5-flash-preview-native-audio-dialog" },
            { name: "gemini-2.5-flash-exp-native-audio-thinking-dialog" },
            { name: "gemini-2.5-flash-preview-tts" },
            { name: "gemini-2.5-pro-preview-tts" },
            { name: "gemini-2.0-flash" },
            { name: "gemini-2.0-flash-lite" }
        ]
    },
    {
        name: "Claude",
        description: "Anthropic's AI assistant",
        icon: "🤖",
        llms: [
            { name: "claude-opus-4-1-20250805" },
            { name: "claude-opus-4-20250514" },
            { name: "claude-sonnet-4-20250514" },
            { name: "claude-3-7-sonnet-20250219" },
            { name: "claude-3-5-haiku-20241022" },
            { name: "claude-3-5-sonnet-20241022" },
            { name: "claude-3-haiku-20240307" }
        ]
    },
    {
        name: "DALL-E",
        description: "AI for generating images from text",
        icon: "🖼️",
        llms: [
            { name: "dall-e-2" },
            { name: "dall-e-3" }
        ]
    },
    {
        name: "Grok",
        description: "AI for code generation",
        icon: "🦙",
        llms: [
            { name: "grok-1" },
            { name: "grok-1.5" },
            { name: "grok-2" },
            { name: "grok-2-mini" },
            { name: "grok-3" },
            { name: "grok-3-mini" },
            { name: "grok-4" },
            { name: "grok-4-heavy" }
        ]
    }
]

const openAIModels = [
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5-chat",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "o3",
    "o3-mini",
    "o3-mini-high",
    "o3-pro",
    "o4-mini",
    "o4-mini-high",
    "dall-e-2",
    "dall-e-3"
];

const geminiModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-live-2.5-flash-preview",
    "gemini-2.5-flash-preview-native-audio-dialog",
    "gemini-2.5-flash-exp-native-audio-thinking-dialog",
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
];

const claudeModels = [
    "claude-opus-4-1-20250805",
    "claude-opus-4-20250514",
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
    "claude-3-haiku-20240307"
];

const grokModels = [
    "grok-1",
    "grok-1.5",
    "grok-2",
    "grok-2-mini",
    "grok-3",
    "grok-3-mini",
    "grok-4",
    "grok-4-heavy"
];

export { models, openAIModels, geminiModels, claudeModels, grokModels };

// const userPromptGeneration = async (
//     prompt: string,
//     messageId: any,
//     aiMessageId: number | null,
//     geminiModel: any,
//     sendingToChatId: string,
//     setMessages: (value: React.SetStateAction<Message[]>) => void,
//     activeChatIdRef: React.RefObject<string | undefined>,
// ) => {
//     let fullResponse = '';
//     let throttleBuffer = '';
//     let throttleTimeout: any = null;

//     const flushBuffer = (setMessages: any, aiMessageId: number, messageId: any) => {
//         if (throttleBuffer) {
//             setMessages((prev: Message[]) =>
//                 prev.map(msg =>
//                     (msg.timestamp === aiMessageId && msg.messageId === messageId && msg.sender === 'ai')
//                         ? { ...msg, text: fullResponse }
//                         : msg
//                 )
//             );
//             throttleBuffer = '';
//         }
//     };

//     const result = await geminiModel.generateContentStream(prompt);

//     for await (const chunk of result.stream) {
//         const chunkText = chunk.text();
//         fullResponse += chunkText;
//         throttleBuffer += chunkText;

//         if (activeChatIdRef.current === sendingToChatId) {
//             if (!throttleTimeout) {
//                 throttleTimeout = setTimeout(() => {
//                     flushBuffer(setMessages, aiMessageId!, messageId);
//                     throttleTimeout = null;
//                 }, 50); // 50ms; adjust for smoothness
//             }
//         }
//     }

//     // Ensure final flush after streaming ends
//     if (activeChatIdRef.current === sendingToChatId) {
//         flushBuffer(setMessages, aiMessageId!, messageId);
//         if (throttleTimeout) {
//             clearTimeout(throttleTimeout);
//             throttleTimeout = null;
//         }
//     }
//     return fullResponse;
// };

// const userPromptGeneration = async (
//     prompt: string,
//     messageId: any,
//     aiMessageId: number | null,
//     geminiModel: any,
//     sendingToChatId: string,
//     setMessages: (value: React.SetStateAction<Message[]>) => void,
//     activeChatIdRef: React.RefObject<string | undefined>,

// ) => {
//     let fullResponse = '';
//     const result = await geminiModel.generateContentStream(prompt);
//     for await (const chunk of result.stream) {
//         const chunkText = chunk.text();
//         fullResponse += chunkText;

//         if (activeChatIdRef.current === sendingToChatId) {
//             setMessages(prev =>
//                 prev.map(msg =>
//                     (msg.timestamp === aiMessageId && msg.messageId === messageId)
//                         ? { ...msg, text: fullResponse }
//                         : msg
//                 )
//             );
//         }
//     }

//     return fullResponse;
// }

// const userPromptGeneration = async (
//     prompt: string,
//     messageId: any,
//     aiMessageId: number | null,
//     geminiModel: any,
//     sendingToChatId: string,
//     setMessages: (value: React.SetStateAction<Message[]>) => void,
//     activeChatIdRef: React.RefObject<string | undefined>,

// ) => {
//     let fullResponse = '';
//     const result = await fetch('http://localhost:3001/api/ask-gemini', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ prompt })
//     });
//     const data = await result.json();

//     fullResponse = data?.result;
//     if (activeChatIdRef.current === sendingToChatId) {
//         setMessages(prev =>
//             prev.map(msg =>
//                 (msg.timestamp === aiMessageId && msg.messageId === messageId)
//                     ? { ...msg, text: fullResponse }
//                     : msg
//             )
//         );
//     }

//     return fullResponse;
// }