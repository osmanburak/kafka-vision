'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface TopicCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  authEnabled: boolean;
  isAdmin: boolean;
  onTopicCreated?: () => void;
}

export function TopicCreator({ isOpen, onClose, language, authEnabled, isAdmin, onTopicCreated }: TopicCreatorProps) {
  const [topicName, setTopicName] = useState('');
  const [partitions, setPartitions] = useState('3');
  const [replicationFactor, setReplicationFactor] = useState('1');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation(language);

  const handleCreate = async () => {
    if (!topicName.trim()) {
      setResult({ type: 'error', message: t('topicNameRequired') });
      return;
    }

    // Validate topic name format
    const topicNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!topicNameRegex.test(topicName.trim())) {
      setResult({ type: 'error', message: t('invalidTopicName') });
      return;
    }

    const partitionCount = parseInt(partitions);
    const replicationCount = parseInt(replicationFactor);

    if (partitionCount < 1 || partitionCount > 100) {
      setResult({ type: 'error', message: t('invalidPartitionCount') });
      return;
    }

    if (replicationCount < 1 || replicationCount > 10) {
      setResult({ type: 'error', message: t('invalidReplicationFactor') });
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/admin/create-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          topicName: topicName.trim(),
          partitions: partitionCount,
          replicationFactor: replicationCount
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: 'success', message: t('topicCreated') });
        setTopicName('');
        setPartitions('3');
        setReplicationFactor('1');
        if (onTopicCreated) onTopicCreated();
        setTimeout(() => {
          onClose();
          setResult(null);
        }, 2000);
      } else {
        // Handle specific error messages with translations
        let errorMessage = t('createTopicError');
        if (response.status === 409 || (data.error && data.error.includes('already exists'))) {
          errorMessage = t('topicAlreadyExists');
        } else if (data.error && data.error.includes('replication factor')) {
          errorMessage = t('invalidReplicationFactor');
        }
        setResult({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      setResult({ type: 'error', message: t('createTopicError') });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen || !authEnabled || !isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-gray-100">{t('createTopic')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('topicName')} *
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder={t('topicNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('topicNameHint')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('partitions')} *
            </label>
            <input
              type="number"
              value={partitions}
              onChange={(e) => setPartitions(e.target.value)}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('partitionsHint')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('replicationFactor')} *
            </label>
            <input
              type="number"
              value={replicationFactor}
              onChange={(e) => setReplicationFactor(e.target.value)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('replicationFactorHint')}
            </p>
          </div>

          {result && (
            <div className={`p-3 rounded-md text-sm ${
              result.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {result.message}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isCreating}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !topicName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t('creating')}
              </>
            ) : (
              <>
                <Plus size={16} />
                {t('createTopic')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}