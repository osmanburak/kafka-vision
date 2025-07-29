'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, FileText, Hash, Clock } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface Message {
  offset: string;
  timestamp: string;
  key: string | null;
  value: string | null;
  size: number;
}

interface MessageViewerProps {
  topic: string;
  partition: number;
  currentOffset: string;
  latestOffset: string;
  onClose: () => void;
  language: Language;
}

export function MessageViewer({ topic, partition, currentOffset, latestOffset, onClose, language }: MessageViewerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(language);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offsets for behind messages
      const startOffset = currentOffset === '-1' ? '0' : (parseInt(currentOffset) + 1).toString();
      const endOffset = latestOffset;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/messages/${encodeURIComponent(topic)}/${partition}?startOffset=${startOffset}&endOffset=${endOffset}&limit=20`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching messages');
    } finally {
      setLoading(false);
    }
  }, [topic, partition, currentOffset, latestOffset]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  const formatValue = (value: string | null) => {
    if (!value) return '<empty>';
    
    try {
      // Try to parse as JSON for pretty printing
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return as-is if not JSON
      return value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900/50 max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold dark:text-white">{t('behindMessages')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {topic} - {t('partition')} {partition} | {t('current')}: {currentOffset} → {t('latest')}: {latestOffset}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin mr-2 dark:text-gray-300" size={24} />
              <span className="dark:text-gray-300">{t('loadingMessages')}</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              Error: {error}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('noMessagesFound')}
            </div>
          )}

          {!loading && !error && messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.offset} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 dark:bg-gray-700/30">
                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Hash size={14} />
                      <span className="font-mono">{t('offset')}: {message.offset}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={14} />
                      <span>{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText size={14} />
                      <span>{message.size} {t('bytes')}</span>
                    </div>
                  </div>
                  
                  {message.key && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('key')}: </span>
                      <span className="font-mono text-sm dark:text-gray-200">{message.key}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('value')}:</span>
                    <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm font-mono overflow-x-auto dark:text-gray-200">
                      {formatValue(message.value)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          {t('showingUpTo')}
        </div>
      </div>
    </div>
  );
}