'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Settings as SettingsIcon, LogOut, ChevronDown, Server } from 'lucide-react';
import { useTranslation, Language } from '../lib/i18n';
import AdminSettings from './AdminSettings';
import { Settings } from './Settings';

interface ProfileMenuProps {
  language: Language;
  user: {
    uid: string;
    displayName: string;
    mail: string;
    isLocal?: boolean;
  };
  onLogout: () => void;
  onLanguageChange: (language: Language) => void;
  refreshRate: number;
  onRefreshRateChange: (rate: number) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onShowConnectionManager: () => void;
  currentConnection: any;
  onConnectionChange: (connection: any) => void;
  authEnabled: boolean;
}

export default function ProfileMenu({
  language,
  user,
  onLogout,
  onLanguageChange,
  refreshRate,
  onRefreshRateChange,
  darkMode,
  onDarkModeToggle,
  onShowConnectionManager,
  currentConnection,
  onConnectionChange,
  authEnabled
}: ProfileMenuProps) {
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isLocalAdmin = user?.isLocal && user?.uid === 'admin';
  const isAdmin = user?.role === 'admin' || isLocalAdmin;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Don't auto-close settings modal - user must click X or Close button
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.uid.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
            {getInitials()}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user.displayName || user.uid}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.mail || (isLocalAdmin ? 'Local Admin' : 'User')}
            </div>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2 z-50">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  {getInitials()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.displayName || user.uid}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.mail || (isLocalAdmin ? 'Local Admin' : 'User')}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Settings */}
              <button
                onClick={() => {
                  setShowSettings(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <SettingsIcon size={16} />
                {t('settings')}
              </button>

              {/* Connection Manager - Always available for switching Kafka clusters */}
              <button
                onClick={() => {
                  onShowConnectionManager();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Server size={16} className="text-green-600 dark:text-green-400" />
                {t('connectionManager')}
              </button>

              {/* Admin Settings - Only for admin users when auth is enabled */}
              {isAdmin && authEnabled && (
                <button
                  onClick={() => {
                    setShowAdminSettings(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  {t('adminSettings')}
                </button>
              )}

              {/* Logout - Only show when authentication is enabled */}
              {authEnabled && (
                <>
                  <div className="my-2 border-t dark:border-gray-700"></div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal - Clean and Direct */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {t('settings')}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Language Setting */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('language')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onLanguageChange('en')}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${
                      language === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => onLanguageChange('tr')}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${
                      language === 'tr'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Türkçe
                  </button>
                </div>
              </div>

              {/* Refresh Rate Setting */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('refreshRate')}
                </label>
                <select
                  value={refreshRate}
                  onChange={(e) => onRefreshRateChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={5}>5 {t('seconds')}</option>
                  <option value={10}>10 {t('seconds')}</option>
                  <option value={15}>15 {t('seconds')}</option>
                  <option value={30}>30 {t('seconds')}</option>
                  <option value={60}>60 {t('seconds')}</option>
                </select>
              </div>

              {/* Dark Mode Setting */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('darkMode')}
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </span>
                  <button
                    onClick={onDarkModeToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showAdminSettings && isAdmin && (
        <div>
          <AdminSettings 
            language={language} 
            user={user}
            onClose={() => setShowAdminSettings(false)}
          />
        </div>
      )}
    </>
  );
}