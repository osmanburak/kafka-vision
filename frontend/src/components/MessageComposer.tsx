'use client';

import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
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

  if (!isOpen || !authEnabled || !isAdmin) return null;

  const handleSend = async () => {
    if (!messageValue.trim()) {
      setResult({ type: 'error', message: t('messageValueRequired') });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Validate JSON if it looks like JSON
      if (messageValue.trim().startsWith('{') || messageValue.trim().startsWith('[')) {
        try {
          JSON.parse(messageValue);
        } catch (e) {
          setResult({ type: 'error', message: t('invalidJson') });
          setSending(false);
          return;
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/admin/produce-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: topicName,
          key: messageKey || null,
          value: messageValue,
          partition: partition ? parseInt(partition) : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ 
          type: 'success', 
          message: `${t('messageSent')} - ${t('partition')}: ${data.partition}, ${t('offset')}: ${data.offset}` 
        });
        // Clear form on success
        setMessageKey('');
        setMessageValue('');
        setPartition('');
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

          {/* Message Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('messageValue')} <span className="text-red-500">*</span>
            </label>
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
          </div>

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
        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !messageValue.trim()}
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
                {t('sendMessage')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}