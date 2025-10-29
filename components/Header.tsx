import React from 'react';
import { SettingsIcon, BotIcon } from './icons';

interface HeaderProps {
  botName: string;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ botName, onSettingsClick }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-light-surface dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-full text-white">
          <BotIcon className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">{botName}</h1>
      </div>
      <button 
        onClick={onSettingsClick} 
        className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open settings"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </header>
  );
};

export default Header;
