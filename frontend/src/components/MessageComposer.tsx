'use client';

import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Hash } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  language: Language;
  authEnabled: boolean;
  isAdmin: boolean;
}

export function MessageComposer({ isOpen, onClose, topicName, language, authEnabled, isAdmin }: MessageComposerProps) {
  const { t } = useTranslation(language);
  const [messageKey, setMessageKey] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [partition, setPartition] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Batch mode states
  const [batchMode, setBatchMode] = useState(false);
  const [messageCount, setMessageCount] = useState('1');
  const [batchMessages, setBatchMessages] = useState('');
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  if (!isOpen || !authEnabled || !isAdmin) return null;

  const handleSend = async () => {
    // Prepare messages based on mode
    let messagesToSend: { key: string; value: string; partition?: number }[] = [];
    
    if (batchMode) {
      // Batch mode: parse messages from textarea
      const lines = batchMessages.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setResult({ type: 'error', message: t('batchMessagesRequired') });
        return;
      }
      
      messagesToSend = lines.map(line => ({
        key: messageKey,
        value: line.trim(),
        partition: partition ? parseInt(partition) : undefined
      }));
    } else {
      // Single mode: check for message count
      if (!messageValue.trim()) {
        setResult({ type: 'error', message: t('messageValueRequired') });
        return;
      }
      
      const count = parseInt(messageCount) || 1;
      if (count < 1 || count > 1000) {
        setResult({ type: 'error', message: t('invalidMessageCount') });
        return;
      }
      
      // Validate JSON if it looks like JSON
      if (messageValue.trim().startsWith('{') || messageValue.trim().startsWith('[')) {
        try {
          JSON.parse(messageValue);
        } catch (e) {
          setResult({ type: 'error', message: t('invalidJson') });
          return;
        }
      }
      
      for (let i = 0; i < count; i++) {
        messagesToSend.push({
          key: messageKey,
          value: messageValue,
          partition: partition ? parseInt(partition) : undefined
        });
      }
    }

    setSending(true);
    setResult(null);
    setSendProgress({ current: 0, total: messagesToSend.length });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/admin/produce-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: topicName,
          messages: messagesToSend
        })
      });

      if (response.ok) {
        const data = await response.json();
        const successCount = data.successCount || messagesToSend.length;
        setResult({ 
          type: 'success', 
          message: batchMode || parseInt(messageCount) > 1 
            ? t('messagesSent', { count: successCount.toString() })
            : t('messageSent')
        });
        // Clear form on success
        setMessageKey('');
        setMessageValue('');
        setBatchMessages('');
        setPartition('');
        setMessageCount('1');
        setSendProgress({ current: 0, total: 0 });
      } else {
        const error = await response.json();
        setResult({ type: 'error', message: error.message || t('sendMessageError') });
      }
    } catch (error) {
      setResult({ type: 'error', message: t('sendMessageError') });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">
            {t('sendMessageTo')} <span className="text-orange-500">{topicName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {result && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              result.type === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {result.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {/* Batch Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('batchMode')}
              </span>
              <button
                type="button"
                onClick={() => setBatchMode(!batchMode)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                style={{ backgroundColor: batchMode ? '#f97316' : '#d1d5db' }}
              >
                <span className="sr-only">{t('batchMode')}</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    batchMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {batchMode ? t('batchModeOn') : t('batchModeOff')}
            </span>
          </div>

          {/* Message Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('messageKey')} <span className="text-gray-500">({t('optional')})</span>
            </label>
            <input
              type="text"
              value={messageKey}
              onChange={(e) => setMessageKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t('messageKeyPlaceholder')}
            />
          </div>

          {/* Message Value(s) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {batchMode ? t('messageValues') : t('messageValue')} <span className="text-red-500">*</span>
            </label>
            {batchMode ? (
              <>
                <textarea
                  value={batchMessages}
                  onChange={(e) => setBatchMessages(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                  placeholder={t('batchMessagesPlaceholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('batchMessagesHint')}
                </p>
              </>
            ) : (
              <>
                <textarea
                  value={messageValue}
                  onChange={(e) => setMessageValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  placeholder={t('messageValuePlaceholder')}
                  rows={8}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('messageValueHint')}
                </p>
              </>
            )}
          </div>

          {/* Message Count (for single mode) */}
          {!batchMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('messageCount')}
              </label>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={messageCount}
                  onChange={(e) => setMessageCount(e.target.value)}
                  min="1"
                  max="1000"
                  className="w-32 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="1"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('messageCountHint')}
                </span>
              </div>
            </div>
          )}

          {/* Partition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('partition')} <span className="text-gray-500">({t('optional')})</span>
            </label>
            <input
              type="number"
              value={partition}
              onChange={(e) => setPartition(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t('partitionPlaceholder')}
              min="0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t dark:border-gray-700">
          {/* Progress indicator */}
          {sending && sendProgress.total > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
              <span>{t('sendingProgress', { current: sendProgress.current.toString(), total: sendProgress.total.toString() })}</span>
            </div>
          )}
          
          <div className="flex justify-end gap-3 flex-1">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || (batchMode ? !batchMessages.trim() : !messageValue.trim())}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {batchMode || parseInt(messageCount) > 1 ? t('sendMessages') : t('sendMessage')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}