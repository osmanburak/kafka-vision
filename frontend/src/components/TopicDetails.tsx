'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Eye, Star } from 'lucide-react';
import { Topic } from '@/lib/types';
import { Language, useTranslation } from '@/lib/i18n';
import { MessageViewer } from './MessageViewer';

interface TopicDetailsProps {
  topic: Topic;
  language: Language;
  darkMode?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function TopicDetails({ topic, language, darkMode, isFavorite, onToggleFavorite }: TopicDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewingMessages, setViewingMessages] = useState<{ partition: number; current: string; latest: string } | null>(null);
  const { t } = useTranslation(language);
  
  return (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
              >
                <Star size={16} className={isFavorite ? 'fill-current' : ''} />
              </button>
            )}
            <span className="font-medium dark:text-gray-100">{topic.name}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
            {topic.partitions !== undefined && (
              <div>{t('partitions')}: {topic.partitions}</div>
            )}
            {topic.totalMessages !== undefined && (
              <div>{t('total')}: {topic.totalMessages.toLocaleString()}</div>
            )}
            {(topic.totalConsumed !== undefined || (topic.totalMessages !== undefined && topic.remainingMessages !== undefined)) && (
              <div className="text-blue-600 dark:text-blue-400">
                {t('consumed')}: {(topic.totalConsumed || Math.max(0, (topic.totalMessages || 0) - (topic.remainingMessages || 0))).toLocaleString()}
              </div>
            )}
            {topic.hasActiveConsumers !== undefined && (
              <div className={`font-medium ${
                !topic.hasActiveConsumers ? 'text-gray-500 dark:text-gray-400' :
                topic.remainingMessages === 0 ? 'text-green-600 dark:text-green-400' : 
                (topic.remainingMessages || 0) > 1000000 ? 'text-red-600 dark:text-red-400' : 
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                {!topic.hasActiveConsumers ? `No ${t('consumer').toLowerCase()}s` :
                 topic.remainingMessages === 0 ? `✓ ${t('caughtUp')}` : 
                 `${(topic.remainingMessages || 0).toLocaleString()} ${t('behind')}`}
              </div>
            )}
          </div>
        </div>
        <div className="ml-2 dark:text-gray-300">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {expanded && topic.partitionDetails && (
        <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded p-3">
          <div className="text-sm font-medium mb-2 flex items-center dark:text-gray-200">
            <Info size={14} className="mr-1 dark:text-gray-400" />
            {t('partition')} Details
          </div>
          <div className="space-y-2">
            {/* Header */}
            <div className="text-xs font-medium grid grid-cols-8 gap-2 py-1 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <div>{t('partition')}</div>
              <div>{t('low')}</div>
              <div>{t('latest')}</div>
              <div>{t('current')}</div>
              <div>{t('diff')}</div>
              <div>{t('messages')}</div>
              <div>{t('consumer')}</div>
              <div></div>
            </div>
            
            {/* Data rows */}
            {topic.partitionDetails.map((partition) => {
              // Get the first consumer group's offset info for this partition
              const consumerInfo = partition.consumerOffsets ? Object.entries(partition.consumerOffsets)[0] : null;
              const rawCurrentOffset = consumerInfo ? consumerInfo[1].currentOffset : null;
              const currentOffset = rawCurrentOffset === '-1' ? t('noMessages') : (rawCurrentOffset || 'N/A');
              const consumerGroup = consumerInfo ? consumerInfo[0] : t('none');
              
              // Check if partition is empty (no messages in queue)
              const isEmptyPartition = parseInt(partition.low) === parseInt(partition.high);
              const messageCount = isEmptyPartition ? t('noMessages') : parseInt(partition.messages).toLocaleString();
              
              // Calculate lag: 
              // - If partition is empty (low = high), lag = 0
              // - If there's a consumer, use the consumer's lag
              // - If no consumer, lag = 0 (no one is consuming, so no lag)
              const lag = isEmptyPartition ? 0 : (consumerInfo ? consumerInfo[1].lag : 0);
              
              return (
                <div key={partition.partition} className="text-sm grid grid-cols-8 gap-2 py-1 border-b border-gray-200 last:border-0">
                  <div className="font-medium">P{partition.partition}</div>
                  <div className="text-gray-600">{partition.low}</div>
                  <div className="text-gray-600">{partition.high}</div>
                  <div className="text-blue-600">{currentOffset}</div>
                  <div className={`font-medium ${lag > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {lag.toLocaleString()}
                  </div>
                  <div className="text-gray-600">{messageCount}</div>
                  <div className="text-xs text-gray-500 truncate" title={consumerGroup}>
                    {consumerGroup.length > 8 ? consumerGroup.substring(0, 8) + '...' : consumerGroup}
                  </div>
                  <div>
                    {lag > 0 && (
                      <button
                        onClick={() => setViewingMessages({
                          partition: partition.partition,
                          current: rawCurrentOffset || '-1',
                          latest: partition.high
                        })}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={t('viewBehindMessages')}
                      >
                        <Eye size={14} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {t('total')} {t('messages').toLowerCase()}: {topic.totalMessages?.toLocaleString()} | 
            {t('consumed')}: {(topic.totalConsumed || 0).toLocaleString()} | 
            {t('status')}: {!topic.hasActiveConsumers ? `No active ${t('consumer').toLowerCase()}s` : 
                     topic.remainingMessages === 0 ? `Fully ${t('caughtUp').toLowerCase()}` : 
                     `${(topic.remainingMessages || 0).toLocaleString()} ${t('messages').toLowerCase()} ${t('behind')}`}
          </div>
        </div>
      )}
      
      {topic.error && (
        <div className="text-sm text-red-500 mt-1">{topic.error}</div>
      )}
      
      {viewingMessages && (
        <MessageViewer
          topic={topic.name}
          partition={viewingMessages.partition}
          currentOffset={viewingMessages.current}
          latestOffset={viewingMessages.latest}
          onClose={() => setViewingMessages(null)}
          language={language}
        />
      )}
    </div>
  );
}