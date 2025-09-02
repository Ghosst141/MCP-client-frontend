import type { FileAttachment, Message } from "../types";
const BaseURL = import.meta.env.VITE_DATABASE_BE_URL;

const userPromptGeneration = async (
    prompt: string,
    currentFiles: FileAttachment[],
    messageId: any,
    aiMessageId: number | null,
    url: string|undefined,
    sendingToChatId: string,
    setMessages: (value: React.SetStateAction<Message[]>) => void,
    activeChatIdRef: React.RefObject<string | undefined>,
    history: Message[]
) => {
    let fullResponse = '';
    const llm = localStorage.getItem('selected_llm');
    const model = localStorage.getItem('selected_model');
    const apiKey = localStorage.getItem(`${model?.toLowerCase()}_api_key`);
    console.log("sended url",url);

    const result = await fetch(`${BaseURL}/api/mcp/askModel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model: llm, apiKey, history, files: currentFiles, url }),
    });

    const data = await result.json();

    if (data.success === false && data.error) {
        fullResponse = `Error: ${data.error}`;
    } else {
        fullResponse = data.content;
    }
    if (activeChatIdRef.current === sendingToChatId) {
        setMessages(prev =>
            prev.map(msg =>
                (msg.timestamp === aiMessageId && msg.messageId === messageId)
                    ? { ...msg, text: fullResponse }
                    : msg
            )
        );
    }

    return fullResponse;
}

const errorResolveForPrompt = (
    messageId: any,
    errorText: string,
    errorResponse: Message,
    messages: Message[],
    setMessages: (value: React.SetStateAction<Message[]>) => void,
) => {
    const isPresent = messages.findIndex((msg) => {
        return msg.messageId === messageId && msg.sender === 'ai';
    });
    if (isPresent === -1) {
        console.log("hi");

        setMessages(prev => [...prev, errorResponse]);
    }
    else {
        console.log("bye");

        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[isPresent]["text"] = errorText;
            return newMessages;
        });
    }
}

const errorResolveForPromptWithRetry = (
    msgIndex: number,
    userMessage: Message,
    errorText: string,
    aiMessageId: number,
    setMessages: (value: React.SetStateAction<Message[]>) => void
) => {
    setMessages(prev => {
        const newMessages = [...prev];
        const nextMsg = newMessages[msgIndex + 1];
        if (nextMsg && nextMsg.sender === 'ai' && nextMsg.messageId === userMessage.messageId) {
            // Update the existing AI message's text
            newMessages[msgIndex + 1] = {
                ...nextMsg,
                text: errorText
            };
        } else {
            // Insert a new error AI message
            const aiResponse: Message = {
                messageId: userMessage.messageId,
                sender: 'ai',
                text: errorText,
                timestamp: aiMessageId
            };
            newMessages.splice(msgIndex + 1, 0, aiResponse);
        }
        return newMessages;
    });
}

export { userPromptGeneration, errorResolveForPrompt, errorResolveForPromptWithRetry }