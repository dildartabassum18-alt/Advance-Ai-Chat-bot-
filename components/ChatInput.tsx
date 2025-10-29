import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { SendIcon, MicIcon, PaperclipIcon } from './icons';
import { UploadedFile } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, files: UploadedFile[]) => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
}

type UploadableFile = {
    name: string;
    type: string;
    progress: number;
    base64: string | null;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isListening, onStartListening, onStopListening, transcript }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (transcript) {
        setText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  const isUploading = files.some(f => f.base64 === null);

  const handleSend = () => {
    if (isUploading) return;
    const messageToSend = text.trim();
    const filesToSend = files
      .filter(f => f.base64 !== null)
      .map(({ name, type, base64 }) => ({ name, type, base64: base64! }));

    if (messageToSend || filesToSend.length > 0) {
      onSendMessage(messageToSend, filesToSend);
      setText('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileList = Array.from(selectedFiles);
    const existingFileNames = new Set(files.map(f => f.name));
    
    // FIX: Explicitly type `file` as `File` to resolve type inference issues.
    const newFilesToProcess = fileList.filter((file: File) => !existingFileNames.has(file.name));

    // FIX: Explicitly type `file` as `File` to resolve type inference issues.
    const newUploadables: UploadableFile[] = newFilesToProcess.map((file: File) => ({
        name: file.name,
        type: file.type,
        progress: 0,
        base64: null
    }));

    setFiles(prev => [...prev, ...newUploadables]);

    // FIX: Explicitly type `file` as `File` to resolve type inference issues.
    newFilesToProcess.forEach((file: File) => {
        const reader = new FileReader();

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                setFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: percent } : f));
            }
        };

        reader.onload = (e) => {
            const base64 = (e.target?.result as string)?.split(',')[1] || null;
            setFiles(prev => prev.map(f => f.name === file.name ? { ...f, base64: base64, progress: 100 } : f));
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", file.name, error);
            alert(`Error reading file: ${file.name}`);
            setFiles(prev => prev.filter(f => f.name !== file.name));
        };

        reader.readAsDataURL(file);
    });

  };

  const removeFile = (fileName: string) => {
      setFiles(prev => prev.filter(f => f.name !== fileName));
  }

  return (
    <div className="px-6 py-4 bg-light-surface dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700">
      {files.length > 0 && (
        <div className="mb-2 space-y-2 max-h-32 overflow-y-auto">
          {files.map(file => (
            <div key={file.name} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
              <div className="flex justify-between items-center">
                <span className="truncate" title={file.name}>Attached: {file.name}</span>
                <button onClick={() => removeFile(file.name)} className="text-red-500 font-bold ml-2 flex-shrink-0">&times;</button>
              </div>
              {file.progress < 100 && (
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 bg-light-bg dark:bg-dark-bg p-2 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
            id="file-upload"
            multiple
        />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Attach file">
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or use the mic..."
          className="flex-1 bg-transparent resize-none outline-none max-h-40 py-2.5 px-2 text-light-text dark:text-dark-text placeholder:text-light-text-secondary placeholder:dark:text-dark-text-secondary"
          rows={1}
        />
        <button onClick={isListening ? onStopListening : onStartListening} className={`p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isListening ? 'text-red-500 animate-pulse-fast' : ''}`} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
          <MicIcon className="w-6 h-6" />
        </button>
        <button onClick={handleSend} className="p-3 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" aria-label="Send message" disabled={(!text.trim() && files.length === 0) || isUploading}>
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
