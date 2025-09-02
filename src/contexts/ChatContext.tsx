import React, { createContext, useCallback, useEffect, useState } from 'react'
import { deleteChatfromDB, fetchChats } from '../services/ApiCallsforDB';

type FirstChatData = {
    text: string;
    files?: any[];
    messageId?: any;
} | null;

type OngoingChat = {
    chatId: string;
    aiMessageId: number;
    messageId: any;
    retry?: number;
};

type ChatContextType = {
    chats: any[];
    loading: boolean;
    error: boolean;
    setChats: React.Dispatch<React.SetStateAction<any[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<boolean>>;
    refreshChats: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    firstchat: FirstChatData;
    setFirstChat: React.Dispatch<React.SetStateAction<FirstChatData>>;
    updateChatTimestamp: (chatId: string) => void;
    pushOngoingChat: (chatId: string, aiMessageId: number, messageId: any, retry?: number) => void;
    popOngoingChat: (chatId: string, aiMessageId: number) => void;
    onGoingChat: OngoingChat[];
}

const chatContext = createContext<ChatContextType | undefined>(undefined)


function ChatContext({ children }: { children: React.ReactNode }) {

    const [chats, setChats] = useState([] as any[]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [firstchat, setFirstChat] = useState<FirstChatData>(null);
    const [onGoingChat, setOnGoingChat] = useState<OngoingChat[]>([]);

    const refreshChats = async () => {
        try {
            setLoading(true);
            //fetch chats
            const sortedChats = await fetchChats();

            setChats(sortedChats);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch chats:", err);
            setError(true);
            setLoading(false);
        }
    };

    const deleteChat = async (chatId: string) => {
        try {
            // const userId = "";
            await deleteChatfromDB(chatId);

            await refreshChats();
        } catch (err) {
            console.error("Failed to delete chat:", err);
            if (err instanceof Error && !err.message.includes("restart your server")) {
                setError(true);
            }
            throw err; // Re-throw so the caller can handle it
        }
    };

    const updateChatTimestamp = useCallback((chatId: string) => {
        setChats(prevChats => {
            const now = new Date().toISOString();

            // Find and update the chat
            const updated = prevChats.find(chat => chat._id === chatId);
            if (!updated) return prevChats;

            const newChat = { ...updated, createdAt: now };

            // Remove old instance and move to top
            const remainingChats = prevChats.filter(chat => chat._id !== chatId);

            return [newChat, ...remainingChats];
        });
    }, []);

    const pushOngoingChat = (chatId: string, aiMessageId: number, messageId: any, retry?: number) => {
        if (chatId != "") {
            setOnGoingChat(prev => [...prev, { chatId, aiMessageId, messageId, retry }]);
        }
    };

    const popOngoingChat = (chatId: string, aiMessageId: number) => {
        if (chatId != "") {
            setOnGoingChat(prev => prev.filter(chat => chat.chatId !== chatId || chat.aiMessageId !== aiMessageId));
        }
    };

    useEffect(() => {
        refreshChats();
    }, []);



    return (
        <chatContext.Provider value={{ chats, loading, error, setChats, setLoading, setError, refreshChats, deleteChat, firstchat, onGoingChat, setFirstChat, updateChatTimestamp, pushOngoingChat, popOngoingChat }}>
            {children}
        </chatContext.Provider>
    )
}

export default ChatContext;
export { chatContext };