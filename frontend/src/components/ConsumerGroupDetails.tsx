'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Users, User } from 'lucide-react';
import { ConsumerGroup } from '@/lib/types';
import { Language, useTranslation } from '@/lib/i18n';

interface ConsumerGroupDetailsProps {
  group: ConsumerGroup;
  language: Language;
}

export function ConsumerGroupDetails({ group, language }: ConsumerGroupDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const { t, translateState } = useTranslation(language);
  
  return (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="font-medium text-sm dark:text-gray-100">{group.groupId}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {translateState(group.state || 'Unknown')} • {group.memberCount || 0} {t('members').toLowerCase()}
          </div>
        </div>
        <div className="ml-2 dark:text-gray-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded p-3">
          {/* Group Info */}
          <div className="mb-3">
            <div className="text-sm font-medium mb-2 flex items-center">
              <Users size={14} className="mr-1" />
              Group Information
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>{t('protocol')}: {group.protocol || 'N/A'}</div>
              <div>{t('state')}: <span className={`font-medium ${
                group.state === 'Stable' ? 'text-green-600' : 
                group.state === 'Rebalancing' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>{translateState(group.state || 'Unknown')}</span></div>
              {group.coordinator && (
                <div>{t('coordinator')}: {group.coordinator.host}:{group.coordinator.port} (Node {group.coordinator.nodeId})</div>
              )}
            </div>
          </div>

          {/* Members */}
          {group.members && group.members.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center">
                <User size={14} className="mr-1" />
                {t('members')} ({group.members.length})
              </div>
              <div className="space-y-2">
                {group.members.map((member, index) => (
                  <div key={member.memberId} className="text-xs bg-white rounded p-2 border border-gray-200">
                    <div className="font-medium text-gray-700">{t('members').slice(0, -1)} {index + 1}</div>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <div>{t('clientId')}: {member.clientId}</div>
                      <div>{t('clientHost')}: {member.clientHost}</div>
                      <div>{t('memberId')}: <span className="font-mono text-xs">{member.memberId.slice(0, 20)}...</span></div>
                      {member.assignments.length > 0 && (
                        <div>{t('assignments')}: {member.assignments.join(', ')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.members && group.members.length === 0 && (
            <div className="text-xs text-gray-500 italic">No active {t('members').toLowerCase()}</div>
          )}
        </div>
      )}
      
      {group.error && (
        <div className="text-xs text-red-500 mt-1">{group.error}</div>
      )}
    </div>
  );
}