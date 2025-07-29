'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Server, Trash2, Edit2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface KafkaConnection {
  id: string;
  name: string;
  brokers: string;
  label: string;
  color: string;
  lastConnected?: Date;
  isActive?: boolean;
}

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentConnection?: KafkaConnection;
  onConnectionChange: (connection: KafkaConnection) => void;
  language: 'en' | 'tr';
  darkMode: boolean;
}

export function ConnectionManager({ 
  isOpen, 
  onClose, 
  currentConnection,
  onConnectionChange,
  language,
  darkMode 
}: ConnectionManagerProps) {
  const { t } = useTranslation(language);
  const [connections, setConnections] = useState<KafkaConnection[]>([]);
  const [editingConnection, setEditingConnection] = useState<KafkaConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Load saved connections
  useEffect(() => {
    const savedConnections = localStorage.getItem('kafkaConnections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    } else {
      // Default connection from environment
      const defaultConnection: KafkaConnection = {
        id: 'default',
        name: 'Default',
        brokers: process.env.NEXT_PUBLIC_DEFAULT_KAFKA_BROKERS || '192.168.1.189:9092',
        label: 'default',
        color: 'blue',
        isActive: true
      };
      setConnections([defaultConnection]);
    }
  }, []);

  // Save connections to localStorage
  const saveConnections = (conns: KafkaConnection[]) => {
    localStorage.setItem('kafkaConnections', JSON.stringify(conns));
    setConnections(conns);
  };

  const handleAddConnection = () => {
    const newConnection: KafkaConnection = {
      id: Date.now().toString(),
      name: '',
      brokers: '',
      label: 'development',
      color: 'green'
    };
    setEditingConnection(newConnection);
    setIsAdding(true);
  };

  const handleSaveConnection = () => {
    if (!editingConnection || !editingConnection.name || !editingConnection.brokers) return;

    let updatedConnections: KafkaConnection[];
    if (isAdding) {
      updatedConnections = [...connections, editingConnection];
    } else {
      updatedConnections = connections.map(conn => 
        conn.id === editingConnection.id ? editingConnection : conn
      );
    }
    
    saveConnections(updatedConnections);
    setEditingConnection(null);
    setIsAdding(false);
  };

  const handleDeleteConnection = (id: string) => {
    if (connections.length === 1) return; // Keep at least one connection
    const updatedConnections = connections.filter(conn => conn.id !== id);
    saveConnections(updatedConnections);
  };

  const handleTestConnection = async (connection: KafkaConnection) => {
    setTestingConnection(connection.id);
    setTestResults(prev => ({ ...prev, [connection.id]: { success: false, message: 'Testing...' } }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brokers: connection.brokers })
      });

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Authentication required - please refresh the page');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [connection.id]: {
          success: result.success,
          message: result.message || (result.success ? 'Connected successfully' : 'Connection failed')
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [connection.id]: {
          success: false,
          message: error instanceof Error ? error.message : 'Connection test failed'
        }
      }));
    }
    
    setTestingConnection(null);
  };

  const handleConnectTo = (connection: KafkaConnection) => {
    // Update active status
    const updatedConnections = connections.map(conn => ({
      ...conn,
      isActive: conn.id === connection.id,
      lastConnected: conn.id === connection.id ? new Date() : conn.lastConnected
    }));
    saveConnections(updatedConnections);
    onConnectionChange(connection);
    onClose();
  };

  const labelColors = {
    production: 'red',
    staging: 'yellow',
    development: 'green',
    test: 'purple',
    default: 'blue'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('connectionManager')}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
          >
            <X className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
          {/* Add Connection Button */}
          <button
            onClick={handleAddConnection}
            className={`w-full mb-4 p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${
              darkMode 
                ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300' 
                : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'
            }`}
          >
            <Plus size={20} />
            <span>{t('addConnection')}</span>
          </button>

          {/* Connection List */}
          <div className="space-y-4">
            {connections.map(connection => (
              <div
                key={connection.id}
                className={`p-4 rounded-lg border transition-all ${
                  connection.isActive 
                    ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                    : darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {editingConnection?.id === connection.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingConnection.name}
                      onChange={(e) => setEditingConnection({ ...editingConnection, name: e.target.value })}
                      placeholder={t('connectionName')}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={editingConnection.brokers}
                      onChange={(e) => setEditingConnection({ ...editingConnection, brokers: e.target.value })}
                      placeholder={t('brokerAddresses')}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <select
                      value={editingConnection.label}
                      onChange={(e) => setEditingConnection({ ...editingConnection, label: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="production">{t('production' as any)}</option>
                      <option value="staging">{t('staging' as any)}</option>
                      <option value="development">{t('development' as any)}</option>
                      <option value="test">{t('test' as any)}</option>
                      <option value="default">{t('default' as any)}</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveConnection}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        {t('save')}
                      </button>
                      <button
                        onClick={() => { setEditingConnection(null); setIsAdding(false); }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Server className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {connection.name}
                            {connection.isActive && (
                              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                {t('active')}
                              </span>
                            )}
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {connection.brokers}
                          </p>
                          <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full bg-${labelColors[connection.label as keyof typeof labelColors]}-100 text-${labelColors[connection.label as keyof typeof labelColors]}-800`}>
                            {t(connection.label as any)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingConnection(connection)}
                          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                          <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                        {connections.length > 1 && (
                          <button
                            onClick={() => handleDeleteConnection(connection.id)}
                            className={`p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors`}
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Test Result */}
                    {testResults[connection.id] && (
                      <div className={`mt-2 p-2 rounded-lg text-sm flex items-center gap-2 ${
                        testResults[connection.id].success
                          ? darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                          : darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {testResults[connection.id].success ? (
                          <CheckCircle size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        {testResults[connection.id].message}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleTestConnection(connection)}
                        disabled={testingConnection === connection.id}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          darkMode
                            ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {testingConnection === connection.id ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          t('testConnection')
                        )}
                      </button>
                      {!connection.isActive && (
                        <button
                          onClick={() => handleConnectTo(connection)}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          {t('connect')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}