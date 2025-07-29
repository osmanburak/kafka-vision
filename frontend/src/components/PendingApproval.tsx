'use client';

import React, { useState } from 'react';
import { UserCheck, LogOut, Clock, RefreshCw, Globe } from 'lucide-react';
import { useTranslation, Language } from '../lib/i18n';

interface PendingApprovalProps {
  language: Language;
  message: string;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onLanguageChange: (language: Language) => void;
}

export default function PendingApproval({ language, message, onLogout, onRefresh, onLanguageChange }: PendingApprovalProps) {
  const { t } = useTranslation(language);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <label htmlFor="language-select-pending" className="sr-only">
            {t('selectLanguage')}
          </label>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-600">
            <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <select
              id="language-select-pending"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-white dark:bg-gray-800 border-0 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 rounded"
            >
              <option value="en" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">English</option>
              <option value="tr" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">Türkçe</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">{t('pendingApprovalTitle')}</h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message || t('pendingApprovalMessage')}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 inline-block mr-2" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {t('pendingApprovalInfo')}
            </span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 text-white rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? t('checkingStatus') : t('checkStatus')}
            </button>
            
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}