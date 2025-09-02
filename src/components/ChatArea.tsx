import { useState, useRef, useEffect, type KeyboardEvent, useContext, useMemo, lazy, Suspense } from 'react';
import './ChatArea.css'
import '../helpers/markdown.css'
import Header from './Header';
import { useClickOutside } from '../hooks/useClickOutside';
import { useChat } from '../hooks/useChat';
import MessageList from '../helpers/MessageList';
// import InputArea from '../helpers/InputArea';
import { useNavigate, useParams } from 'react-router-dom';
// import type { Message } from '../types';
import type { FileAttachment, Message } from '../types';
import { chatContext } from '../contexts/ChatContext';
import useChatModel from '../hooks/useChatModel';
import { saveAiMessage, handleRetryMessage, isOrphanMessage, insertAiMessageAfterUser } from '../helpers/chatArea';
import { userPromptGeneration } from '../helpers/prompGenerate';
import { fetchMessagesAndSort } from '../services/ApiCallsforDB';
import { MCPServerContext } from '../contexts/MCPServerContext';
// import { SideContext } from '../contexts/SidebarContext';

const InputArea = lazy(() => import('../helpers/InputArea'));


export default function ChatArea() {
  const { id: chatId } = useParams();
  const activeChatIdRef = useRef(chatId);


  const Navigate = useNavigate();
  const { input, setInput, messages, loading, streamingMessageId, setStreamingMessageId, mcpOption, setMcpOption, handleSend, handlePaste,
    attachedFiles, removeAttachedFile, handleFileUpload, setMessages, setLoading, fileLoading } = useChat(chatId);
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLDivElement | null>(null);
  const geminiModel = useChatModel();
  const [initialMessageProcessed, setInitialMessageProcessed] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [retryingMessageIndex, setRetryingMessageIndex] = useState<number | null>(null);

  const options: string[] = ['Job Portal', 'Normal'];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const retryScrollRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useClickOutside(() => setOpen(false));
  const hasScrolledOnLoad = useRef<boolean>(false);
  const userScrollRef = useRef<boolean>(false);
  const selectedServer = useContext(MCPServerContext)?.selectedServer;


  useEffect(() => {
    // Only scroll if this chat is actively streaming or loading and NOT retrying
    const isThisChatStreaming = streamingMessageId !== null;
    const isThisChatLoading = loading;

    if ((isThisChatStreaming || isThisChatLoading) && retryingMessageIndex === null && !userScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, streamingMessageId, retryingMessageIndex]);

  useEffect(() => {
    userScrollRef.current = false;

    if (messages.length > 0 && !messagesLoading && !hasScrolledOnLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      hasScrolledOnLoad.current = true;
    }
  }, [messages.length, messagesLoading]);


  // const context = useContext(SideContext);
  // const setSelectedChatId = context?.setSelectedChatId;

  useEffect(() => {
    if (activeChatIdRef.current !== chatId) {
      setRetryingMessageIndex(null);
    }
    hasScrolledOnLoad.current = false;
  }, [chatId]);

  useEffect(() => {
    if (retryingMessageIndex !== null && retryScrollRef.current && !userScrollRef.current) {
      retryScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [messages, retryingMessageIndex]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!loading && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      userScrollRef.current = false; // Set to true to prevent auto-scroll during send
      handleSend(textareaRef);
    }
  };

  const checkIsOrphanMessage = (msgIndex: number): boolean => {
    return isOrphanMessage(messages, msgIndex);
  };

  const handleRetry = async (msgIndex: number) => {
    userScrollRef.current = false;
    const url = selectedServer?.url;
    await handleRetryMessage(
      msgIndex,
      messages,
      geminiModel,
      url,
      chatId as string,
      setMessages,
      setStreamingMessageId,
      pushOngoingChat,
      popOngoingChat,
      updateChatTimestamp,
      refreshChats,
      setRetryingMessageIndex,
      activeChatIdRef,
      setLoading
    );
    console.log("will this got called");

    setLoading(false);
    setStreamingMessageId(null);
    setRetryingMessageIndex(null);
  };

  const contextChat = useContext(chatContext);
  if (!contextChat) throw new Error("chatContext is undefined");
  const { firstchat, setFirstChat, updateChatTimestamp, refreshChats } = contextChat;

  const firstChatData = firstchat;
  const text = firstChatData?.text || '';
  const firstChatFiles = useMemo(() => firstChatData?.files || [], [firstChatData?.files]);
  const pushOngoingChat = contextChat?.pushOngoingChat;
  const popOngoingChat = contextChat?.popOngoingChat;
  const onGoingChat = contextChat?.onGoingChat;

  useEffect(() => {
    if (!chatId) {
      Navigate('/');
      return;
    }
    const ongoing = onGoingChat?.find(chat => chat.chatId === chatId);
    if (ongoing) {
      setLoading(true);
      setStreamingMessageId(ongoing.messageId);
      if (ongoing.retry) {
        setRetryingMessageIndex(ongoing.retry);
      }
      insertAiMessageAfterUser(messages, setMessages, ongoing);
    } else {
      setLoading(false);
      setStreamingMessageId(null);
      setRetryingMessageIndex(null);
    }
  }, [chatId, onGoingChat, Navigate, messages, setLoading, setMessages, setStreamingMessageId]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setMessagesLoading(true);

        //fetch call
        const sortedHistory = await fetchMessagesAndSort(chatId, text, firstChatFiles);

        if (!sortedHistory) {
          setMessagesLoading(false);
          Navigate('/');
          return;
        }

        const mappedMessages: Message[] = sortedHistory.map((item: any) => {
          const files: FileAttachment[] | undefined = item.files && item.files.length > 0
            ? item.files
            : undefined;
          return {
            messageId: item.messageId,
            sender: item.role === 'user' ? 'user' : 'ai',
            text: item.parts.length > 1 ? item.parts.map((p: any) => p.text) : item.parts[0]?.text || '',
            files,
            timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
          };
        });

        setMessages(mappedMessages);
        setMessagesLoading(false);
        if ((text || (firstChatFiles && firstChatFiles.length > 0)) && !initialMessageProcessed && geminiModel) {
          setInitialMessageProcessed(true);
          const aiMessageId = Date.now() + 1;;
          const messageId = firstChatData?.messageId;
          try {
            let prompt = text || '';
            if (firstChatFiles && firstChatFiles.length > 0) {
              const fileInfo = firstChatFiles.map(file => `File: ${file.name} (${file.type})`).join(', ');
              prompt = prompt ? `${prompt}\n\nAttached files: ${fileInfo}` : `Analyze these files: ${fileInfo}`;
            }
            const aiResponse: Message = {
              messageId: messageId,
              sender: 'ai',
              text: '',
              timestamp: aiMessageId
            };
            pushOngoingChat(chatId as any, aiMessageId, messageId);
            setMessages(prev => [...prev, aiResponse]);
            setLoading(true);

            const url = selectedServer?.url;
            const fullResponse = await userPromptGeneration(
              prompt,
              firstChatFiles,
              messageId,
              aiMessageId,
              url,
              chatId as any,
              setMessages,
              activeChatIdRef,
              []
            );

            popOngoingChat(chatId || "", aiMessageId);

            if (chatId && fullResponse && aiMessageId !== null) {
              await saveAiMessage(chatId, "", fullResponse, updateChatTimestamp, refreshChats, messageId);
            }
            setFirstChat(null);
          } catch (error) {
            const errorText = `Error: Failed to get response from Gemini. ${error instanceof Error ? error.message : 'Please try again.'}`;
            setMessages(prev =>
              prev.map(msg =>
                (msg.timestamp === aiMessageId && msg.messageId === messageId)
                  ? { ...msg, text: errorText }
                  : msg
              )
            );
            popOngoingChat(chatId || "", aiMessageId);
            if (chatId) {
              await saveAiMessage(chatId, "", errorText, updateChatTimestamp, refreshChats, messageId);
            }
            setFirstChat(null);
          } finally {
            popOngoingChat(chatId || "", aiMessageId);
            setFirstChat(null)
            setLoading(false);
          }
        }
      } catch (e) {
        console.log("Error fetching chat:", e);
        setMessagesLoading(false);
        Navigate('/');
      }
    };
    if (chatId) {
      fetchChat();
    }
  }, [chatId, text, firstChatFiles, mcpOption, geminiModel, initialMessageProcessed]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    event.target.value = '';
  };

  useEffect(() => {
    if (!chatId && !text && (!firstChatFiles || firstChatFiles.length === 0) && messages.length === 0) {
      Navigate("/");
    }
  }, [chatId, text, firstChatFiles, messages.length, Navigate]);

  useEffect(() => {
    if (!chatId) {
      Navigate("/");
      return;
    }
  }, [chatId, Navigate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 15; // 5px tolerance

    if (!isAtBottom) {
      userScrollRef.current = true;
    } else {
      userScrollRef.current = false;
    }
  };
  return (
    <div className="chat-area">
      <div className='header-area'>
        <Header />
      </div>
      <div className='messages-body' onScroll={handleScroll}>
        <MessageList
          messages={messages}
          loading={loading}
          messagesLoading={messagesLoading}
          streamingMessageId={streamingMessageId}
          messagesEndRef={messagesEndRef}
          isOrphanMessage={checkIsOrphanMessage}
          handleRetry={handleRetry}
          retryingMessageIndex={retryingMessageIndex}
          retryScrollRef={retryScrollRef}
        />
      </div>
      <div className="input-wrapper">
        <Suspense fallback={<div>Loading...</div>}>
          <InputArea
            input={input}
            setInput={setInput}
            textareaRef={textareaRef}
            scrollRef={userScrollRef}
            handleKeyDown={handleKeyDown}
            handlePaste={(e) => handlePaste(e, textareaRef)}
            loading={loading}
            handleSend={handleSend}
            mcpOption={mcpOption}
            setMcpOption={setMcpOption}
            options={options}
            open={open}
            setOpen={setOpen}
            dropdownRef={dropdownRef}
            attachedFiles={attachedFiles}
            removeAttachedFile={removeAttachedFile}
            handleFileChange={handleFileChange}
            fileLoading={fileLoading}
          />
        </Suspense>
      </div>
    </div>
  );
}