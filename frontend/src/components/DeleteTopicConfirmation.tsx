'use client';

import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface DeleteTopicConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  language: Language;
  authEnabled: boolean;
  isAdmin: boolean;
  onConfirm: () => void;
}

export function DeleteTopicConfirmation({ 
  isOpen, 
  onClose, 
  topicName, 
  language, 
  authEnabled, 
  isAdmin, 
  onConfirm 
}: DeleteTopicConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const { t } = useTranslation(language);

  const handleConfirm = async () => {
    if (confirmationInput !== topicName) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/admin/delete-topic`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          topicName: topicName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onConfirm();
        handleClose();
      } else {
        // Handle error - could show error in the modal or pass to parent
        console.error('Delete topic error:', data.error);
      }
    } catch (error) {
      console.error('Delete topic error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationInput('');
    onClose();
  };

  if (!isOpen || !authEnabled || !isAdmin) return null;

  const isConfirmationValid = confirmationInput === topicName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              {t('deleteTopicTitle')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">
              {t('deleteTopicWarning')}
            </p>
          </div>

          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {t('deleteTopicConfirmText')} <strong className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{topicName}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('deleteTopicTypeConfirm')}:
            </p>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={topicName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              <strong>{t('warning')}:</strong> {t('deleteTopicConsequences')}
            </p>
            <ul className="mt-2 text-yellow-700 dark:text-yellow-300 text-sm list-disc list-inside space-y-1">
              <li>{t('deleteTopicConsequence1')}</li>
              <li>{t('deleteTopicConsequence2')}</li>
              <li>{t('deleteTopicConsequence3')}</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmationValid}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t('deleting')}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {t('deleteTopicConfirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}