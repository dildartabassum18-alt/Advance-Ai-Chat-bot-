import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types';
import { BotIcon, UserIcon, VolumeUpIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
  onPlayAudio: (text: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onPlayAudio }) => {
  const isUser = message.sender === MessageSender.USER;
  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${isUser ? 'bg-primary text-white rounded-br-none' : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-bl-none shadow-sm'}`}>
        {message.text && <p className="text-base whitespace-pre-wrap">{message.text}</p>}
        {message.files && message.files.length > 0 && (
          <div className={`mt-2 grid gap-2 ${message.files.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {message.files.map(file => (
              <div key={file.name}>
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="max-w-xs max-h-48 rounded-lg object-cover" />
                ) : (
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                    Attached file: {file.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className={`text-xs mt-2 flex items-center ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
              <button onClick={() => onPlayAudio(message.text)} className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <VolumeUpIcon className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary"/>
              </button>
          )}
          <span className={`${isUser ? 'text-indigo-200' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <BotIcon className="w-5 h-5" />
        </div>
        <div className="max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-bl-none shadow-sm">
            <div className="flex items-center justify-center gap-1.5 h-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);


interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPlayAudio: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onPlayAudio }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} onPlayAudio={onPlayAudio} />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  );
};

export default ChatWindow;
