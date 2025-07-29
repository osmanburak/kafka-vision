'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Clock, Moon, Sun } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface SettingsProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  refreshRate: number;
  onRefreshRateChange: (rate: number) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export function Settings({ language, onLanguageChange, refreshRate, onRefreshRateChange, darkMode, onDarkModeToggle }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation(language);

  const refreshRateOptions = [
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '60s' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <SettingsIcon size={20} className="dark:text-gray-300" />
        <span className="text-sm font-medium dark:text-gray-200">{t('settings')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-gray-900/50 z-50">
          <div className="p-4 space-y-4">
            {/* Language Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('language')}</label>
              </div>
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>

            {/* Refresh Rate Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('refreshRate')}</label>
              </div>
              <select
                value={refreshRate}
                onChange={(e) => onRefreshRateChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {refreshRateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('darkMode')}</label>
                </div>
                <button
                  onClick={onDarkModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}