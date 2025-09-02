import type { FileAttachment, Message } from "../types";
import { errorResolveForPromptWithRetry, userPromptGeneration } from "./prompGenerate";
import { authHeaders } from "../services/Auth";
const BaseURL = import.meta.env.VITE_DATABASE_BE_URL;

const saveAiMessage = async (
  chatId: string,
  userID: string,
  fullResponse: string,
  updateChatTimestamp: (chatId: string) => void,
  refreshChats: () => void,
  messageId?: string
) => {
  try {
    await fetch(`${BaseURL}/api/chats/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      } as any,
      body: JSON.stringify({
        answer: fullResponse,
        messageId: messageId
      }),
    });
    updateChatTimestamp(chatId);
    refreshChats();
  } catch (error) {
    console.error('Error saving AI response to database:', error);
  }
};

const saveUserMessage = async (
  chatId: string,
  userID: string,
  question: string,
  files: FileAttachment[],
  updateChatTimestamp: (chatId: string) => void,
) => {
  try {
    const response = await fetch(`${BaseURL}/api/chats/${chatId}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      } as any,
      body: JSON.stringify({
        question,
        files,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    updateChatTimestamp(chatId);
    return data;
  } catch (error) {
    console.error('Error saving user message:', error);
    return null;
  }
};

const saveModelMessage = async (
  chatId: string,
  userID: string,
  answer: string,
  messageId: any
) => {
  try {
    const response = await fetch(`${BaseURL}/api/chats/${chatId}/ai`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }as any,
      body: JSON.stringify({
        answer,
        messageId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving AI message:', error);
    return false;
  }
}


function getHistoryAroundMessage(
  allMessages: Message[],
  targetId: any,
  limit: number = 10
): Message[] {
  const idx = allMessages.findIndex((m) => m.messageId === targetId && m.sender === 'user');
  if (idx === -1) return []; // target not found

  // start index ensures we don’t go below 0
  const start = Math.max(0, idx - limit);
  // slice up to and including the target message
  return allMessages.slice(start, idx + 1);
}


// Function to detect orphan messages (user messages without AI responses)
const isOrphanMessage = (messages: Message[], msgIndex: number): boolean => {
  const currentMsg = messages[msgIndex];
  if (currentMsg.sender !== 'user') return false;

  // Check if the next message is an AI response
  const nextMsg = messages[msgIndex + 1];
  return !nextMsg || nextMsg.sender !== 'ai';
};

// Retry function for orphan messages
const handleRetryMessage = async (
  msgIndex: number,
  messages: Message[],
  geminiModel: any,
  url: string|undefined,
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setStreamingMessageId: (id: number | null) => void,
  pushOngoingChat: (chatId: string, aiMessageId: number, messageId: any, retry?: number) => void,
  popOngoingChat: (chatId: string, aiMessageId: number) => void,
  updateChatTimestamp: (chatId: string) => void,
  refreshChats: () => void,
  setRetryingMessageIndex: (index: number | null) => void,
  activeChatIdRef: any,
  setLoading: (loading: boolean) => void
): Promise<void> => {
  const userMessage = messages[msgIndex];
  if (!userMessage || userMessage.sender !== 'user' || !geminiModel) return;
  const aiMessageId = Date.now();

  try {
    // Set retry state to show inline typing indicator
    setRetryingMessageIndex(msgIndex);
    setLoading(true);
    // Generate unique IDs for the retry response
    const messageId = userMessage.messageId;

    // Prepare the prompt from the user message
    let prompt = userMessage.text as string || '';
    if (userMessage.files && userMessage.files.length > 0) {
      const fileInfo = userMessage.files.map(file => `File: ${file.name} (${file.type})`).join(', ');
      prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
    }


    //here is one ------------------------------------
    const history = getHistoryAroundMessage(messages, userMessage.messageId, 10);
    //------------------------------------
    // Create placeholder AI message and insert it after the user message
    const aiResponse: Message = {
      messageId: messageId,
      sender: 'ai',
      text: '',
      timestamp: aiMessageId
    };

    // Insert the AI response right after the user message
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages.splice(msgIndex + 1, 0, aiResponse);
      return newMessages;
    });

    // Add to ongoing chats for streaming
    pushOngoingChat(chatId, aiMessageId, messageId, msgIndex);
    setStreamingMessageId(messageId);

    // Call Gemini API with streaming
    const fullResponse = await userPromptGeneration(prompt,
      userMessage.files || [],
      messageId,
      aiMessageId,
      url,
      chatId,
      setMessages,
      activeChatIdRef,
      history
    );

    popOngoingChat(chatId, aiMessageId);
    // Save the AI response to database
    if (chatId && fullResponse) {
      await saveAiMessage(chatId, "", fullResponse, updateChatTimestamp, refreshChats, messageId);
    }

  } catch (error) {
    console.error('Error during retry:', error);

    const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;

    // Check if an AI message already exists after the user message
    if (activeChatIdRef.current === chatId) {
      errorResolveForPromptWithRetry(msgIndex, userMessage, errorText, aiMessageId, setMessages);
    }
    // Save error response to database
    if (chatId) {
      await saveAiMessage(chatId, "", errorText, updateChatTimestamp, refreshChats, userMessage.messageId);
    }
  } finally {
    // Clear retry state
    setLoading(false)
    setStreamingMessageId(null);
    setRetryingMessageIndex(null);
    popOngoingChat(chatId, aiMessageId);
  }
};

type OngoingChat = {
  chatId: string;
  aiMessageId: number;
  messageId: any;
  retry?: number;
};
const insertAiMessageAfterUser = (messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  ongoing: OngoingChat) => {
  const hasAiMessage = messages.some(msg => (msg.timestamp === ongoing.aiMessageId && msg.messageId === ongoing.messageId && msg.sender === 'ai'));
  if (!hasAiMessage && messages.length > 0) {
    console.log("idhr kitni bar aya");

    const aiResponse: Message = {
      messageId: ongoing.messageId,
      sender: 'ai',
      text: '',
      timestamp: ongoing.aiMessageId
    };
    setMessages(prev => {
      const userMsgIndex = prev.findIndex(
        msg => msg.messageId === ongoing.messageId && msg.sender === 'user'
      );

      if (userMsgIndex === -1) {
        // If user message not found, just append
        return [...prev, aiResponse];
      }

      const newMessages = [...prev];
      newMessages.splice(userMsgIndex + 1, 0, aiResponse);
      return newMessages;
    });
  }
}
export {
  saveAiMessage,
  saveUserMessage,
  saveModelMessage,
  isOrphanMessage,
  handleRetryMessage,
  insertAiMessageAfterUser
};