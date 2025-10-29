import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import SettingsPanel from './components/SettingsPanel';
import { ChatMessage, MessageSender, ChatSettings, UploadedFile, KnowledgeFile, SpeechRate } from './types';
import { generateResponse, generateSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audio';
import { parseFile } from './utils/fileParser';

// Polyfill for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    const defaultSettings: ChatSettings = {
      name: 'Gemini Pro',
      personality: 'A helpful and friendly AI assistant that is an expert in many fields.',
      theme: 'dark',
      voice: 'Zephyr',
      speechRate: 'medium',
      voiceSource: 'online',
    };
    if (savedSettings) {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
    return defaultSettings;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Knowledge Base State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(() => {
    const savedFiles = localStorage.getItem('knowledgeFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<{ [fileName: string]: number }>({});

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  // Text to Speech
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    document.documentElement.className = settings.theme;
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('knowledgeFiles', JSON.stringify(knowledgeFiles));
  }, [knowledgeFiles]);

  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;
    
    try {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (error) {
        console.error("Failed to play audio:", error);
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (settings.voiceSource === 'offline') {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any currently playing speech
            const utterance = new SpeechSynthesisUtterance(text);
            const rateMap: { [key in SpeechRate]: number } = { slow: 0.8, medium: 1.0, fast: 1.2 };
            utterance.rate = rateMap[settings.speechRate];
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Your browser does not support offline Text-to-Speech.");
        }
    } else {
        const audioData = await generateSpeech(text, settings.voice, settings.speechRate);
        if (audioData) {
            playAudio(audioData);
        }
    }
  }, [settings, playAudio]);

  const handleSendMessage = useCallback(async (text: string, files?: UploadedFile[]) => {
    if (!text.trim() && (!files || files.length === 0)) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: MessageSender.USER,
      text: text,
      timestamp: new Date().toISOString(),
      ...(files && files.length > 0 && { 
        files: files.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(new Blob([decode(file.base64)], { type: file.type }))
        }))
      })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const botResponseText = await generateResponse([...messages, userMessage], text, settings, files, knowledgeFiles);
        const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: MessageSender.BOT,
            text: botResponseText,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
        
        speakText(botResponseText);

    } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: MessageSender.BOT,
            text: "Sorry, I couldn't process your request. Please try again.",
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [messages, settings, speakText, knowledgeFiles]);
  
  const handleClearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    setIsSettingsOpen(false);
  }, []);

  // Knowledge Base Logic
  const handleAddKnowledgeFiles = useCallback(async (files: FileList) => {
      setIsParsingFiles(true);
      const filesToProcess = Array.from(files).filter(file => 
          !knowledgeFiles.some(kf => kf.name === file.name) && !parsingProgress[file.name]
      );
  
      if (filesToProcess.length === 0) {
          setIsParsingFiles(false);
          return;
      }
  
      const newParsingTasks: { [fileName: string]: number } = {};
      filesToProcess.forEach(file => { newParsingTasks[file.name] = 0; });
      setParsingProgress(prev => ({ ...prev, ...newParsingTasks }));
  
      const parsingPromises = filesToProcess.map(file => {
          const onProgress = (percent: number) => {
              setParsingProgress(prev => ({ ...prev, [file.name]: percent }));
          };
          return parseFile(file, onProgress)
              .then(content => ({ name: file.name, content }))
              .catch(error => {
                  console.error(`Failed to parse ${file.name}:`, error);
                  alert(`Could not parse file: ${file.name}. It might be unsupported or corrupted.`);
                  return null;
              });
      });
  
      const results = await Promise.all(parsingPromises);
      const successfullyParsed = results.filter((r): r is KnowledgeFile => r !== null);
  
      setKnowledgeFiles(prev => [...prev, ...successfullyParsed]);
      
      setParsingProgress(prev => {
          const newProgress = { ...prev };
          filesToProcess.forEach(file => { delete newProgress[file.name]; });
          return newProgress;
      });
  
      // A check to see if other files are still parsing from a previous batch
      if (Object.keys(parsingProgress).length - filesToProcess.length === 0) {
          setIsParsingFiles(false);
      }
  }, [knowledgeFiles, parsingProgress]);

  const handleRemoveKnowledgeFile = useCallback((fileName: string) => {
    setKnowledgeFiles(prev => prev.filter(f => f.name !== fileName));
  }, []);


  // Speech Recognition Logic
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    };
    recognition.onresult = (event: any) => {
        const finalTranscript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTranscript(finalTranscript);
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-light-bg dark:bg-dark-bg flex flex-col font-sans">
      <Header botName={settings.name} onSettingsClick={() => setIsSettingsOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow messages={messages} isLoading={isLoading} onPlayAudio={speakText} />
        <ChatInput 
            onSendMessage={handleSendMessage}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            transcript={transcript}
        />
      </div>
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onClearHistory={handleClearHistory}
        knowledgeFiles={knowledgeFiles}
        onAddKnowledgeFiles={handleAddKnowledgeFiles}
        onRemoveKnowledgeFile={handleRemoveKnowledgeFile}
        isParsingFiles={isParsingFiles}
        parsingProgress={parsingProgress}
      />
    </div>
  );
};

export default App;
