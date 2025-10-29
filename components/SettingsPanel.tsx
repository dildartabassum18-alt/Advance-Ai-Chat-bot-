import React, { useRef, useState, ChangeEvent } from 'react';
import { ChatSettings, KnowledgeFile } from '../types';
import { CloseIcon, TrashIcon, UploadCloudIcon, FileTextIcon } from './icons';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSettingsChange: (newSettings: ChatSettings) => void;
  onClearHistory: () => void;
  knowledgeFiles: KnowledgeFile[];
  onAddKnowledgeFiles: (files: FileList) => void;
  onRemoveKnowledgeFile: (fileName: string) => void;
  isParsingFiles: boolean;
  parsingProgress: { [fileName: string]: number };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    isOpen, onClose, settings, onSettingsChange, onClearHistory,
    knowledgeFiles, onAddKnowledgeFiles, onRemoveKnowledgeFile, isParsingFiles, parsingProgress
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        onAddKnowledgeFiles(event.target.files);
        // Reset file input to allow selecting the same file again
        event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text shadow-2xl p-6 flex flex-col gap-6 transform animate-slide-in overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Close settings">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Personalization Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Personalization</h3>
          <div>
            <label htmlFor="bot-name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Chatbot Name</label>
            <input type="text" id="bot-name" value={settings.name} onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition" />
          </div>
          <div>
            <label htmlFor="bot-personality" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Personality</label>
            <textarea id="bot-personality" rows={3} value={settings.personality} onChange={(e) => handleFieldChange('personality', e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
              placeholder="e.g., A helpful and friendly assistant." />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Theme</label>
            <div className="flex items-center gap-2">
              <button onClick={() => handleFieldChange('theme', 'light')} className={`px-3 py-1 rounded-md text-sm ${settings.theme === 'light' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Light</button>
              <button onClick={() => handleFieldChange('theme', 'dark')} className={`px-3 py-1 rounded-md text-sm ${settings.theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Dark</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Voice Source</label>
            <div className="flex items-center gap-2">
              <button onClick={() => handleFieldChange('voiceSource', 'online')} className={`px-3 py-1 rounded-md text-sm ${settings.voiceSource === 'online' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Online</button>
              <button onClick={() => handleFieldChange('voiceSource', 'offline')} className={`px-3 py-1 rounded-md text-sm ${settings.voiceSource === 'offline' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Offline</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${settings.voiceSource === 'offline' ? 'text-gray-400 dark:text-gray-500' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Voice</label>
            <div className="flex items-center gap-2">
              <button onClick={() => handleFieldChange('voice', 'Zephyr')} disabled={settings.voiceSource === 'offline'} className={`px-3 py-1 rounded-md text-sm ${settings.voice === 'Zephyr' && settings.voiceSource === 'online' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>Male</button>
              <button onClick={() => handleFieldChange('voice', 'Kore')} disabled={settings.voiceSource === 'offline'} className={`px-3 py-1 rounded-md text-sm ${settings.voice === 'Kore' && settings.voiceSource === 'online' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>Female</button>
            </div>
          </div>
          {settings.voiceSource === 'offline' && <p className="text-xs text-right text-yellow-600 dark:text-yellow-400">Voice selection is disabled for offline mode.</p>}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Speech Rate</label>
            <div className="flex items-center gap-2">
              <button onClick={() => handleFieldChange('speechRate', 'slow')} className={`px-3 py-1 rounded-md text-sm ${settings.speechRate === 'slow' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Slow</button>
              <button onClick={() => handleFieldChange('speechRate', 'medium')} className={`px-3 py-1 rounded-md text-sm ${settings.speechRate === 'medium' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Medium</button>
              <button onClick={() => handleFieldChange('speechRate', 'fast')} className={`px-3 py-1 rounded-md text-sm ${settings.speechRate === 'fast' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Fast</button>
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700"/>

        {/* Knowledge Base Section */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">Knowledge Base ({knowledgeFiles.length})</h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Upload documents (PDF, DOCX, TXT, XLSX) for the AI to reference in its answers.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,.docx,.txt,.xlsx"/>
            <button onClick={() => fileInputRef.current?.click()} disabled={isParsingFiles}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                <UploadCloudIcon className="w-5 h-5" />
                {isParsingFiles ? 'Processing Files...' : 'Upload Documents'}
            </button>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {Object.entries(parsingProgress).map(([name, percent]) => (
                    <div key={name} className="p-2 bg-light-bg dark:bg-dark-bg rounded-md">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="truncate" title={name}>{name}</span>
                            <span className="flex-shrink-0 ml-2">{percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                        </div>
                    </div>
                ))}
                {knowledgeFiles.map(file => (
                    <div key={file.name} className="flex items-center justify-between p-2 bg-light-bg dark:bg-dark-bg rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileTextIcon className="w-5 h-5 flex-shrink-0 text-primary"/>
                            <span className="text-sm truncate" title={file.name}>{file.name}</span>
                        </div>
                        <button onClick={() => onRemoveKnowledgeFile(file.name)} className="text-red-500 hover:text-red-700 p-1" aria-label={`Remove ${file.name}`}>
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {knowledgeFiles.length === 0 && Object.keys(parsingProgress).length === 0 && (
                    <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-4">No documents uploaded.</p>
                )}
            </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700"/>

        {/* Danger Zone Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Danger Zone</h3>
          <button onClick={() => { if (window.confirm('Are you sure you want to clear the entire chat history? This cannot be undone.')) onClearHistory(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <TrashIcon className="w-5 h-5" />
            Clear Chat History
          </button>
        </div>

        <div className="mt-auto text-xs text-center text-gray-400 dark:text-gray-500 pt-4">
          <p>Powered by Google's Gemini API.</p>
          <p>Chat & knowledge history stored locally.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
