'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, TestTube, Shield, Database, AlertTriangle, Users, Check, X, Trash2, UserCheck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation, Language } from '../lib/i18n';
import logger from '../lib/logger';

interface AdminSettingsProps {
  language: Language;
  user: {
    uid: string;
    displayName: string;
    mail: string;
    role?: string;
    isLocal?: boolean;
  } | null;
  onClose?: () => void;
}

interface LDAPSettings {
  enabled: boolean;
  url: string;
  bindDN: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  tlsRejectUnauthorized: boolean;
}

// Removed KafkaSettings interface - not needed

interface User {
  username: string;
  displayName: string;
  email: string;
  status: 'pending' | 'active' | 'rejected';
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function AdminSettings({ language, user, onClose }: AdminSettingsProps) {
  const { t, getUserStatusText } = useTranslation(language);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external control if onClose is provided, otherwise use internal state
  const isOpen = onClose ? true : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));
  const handleOpen = () => setInternalIsOpen(true);
  const [loading, setLoading] = useState(false);
  const [testingLdap, setTestingLdap] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [ldapSettings, setLdapSettings] = useState<LDAPSettings>({
    enabled: true,
    url: '',
    bindDN: '',
    bindPassword: '',
    searchBase: '',
    searchFilter: '(sAMAccountName={{username}})',
    tlsRejectUnauthorized: false
  });
  
  const [activeTab, setActiveTab] = useState<'ldap' | 'users'>('ldap');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'warning';
  } | null>(null);
  
  // Removed kafkaSettings state - not needed

  // Check if user is local admin
  const isLocalAdmin = user?.isLocal && user?.uid === 'admin';
  const isAdmin = user?.role === 'admin' || isLocalAdmin;

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadSettings();
      if (activeTab === 'users') {
        loadUsers();
      }
    }
  }, [isOpen, isAdmin, activeTab]);

  // Helper function to show confirmation modal
  const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning', confirmText?: string) => {
    setConfirmAction({ title, message, onConfirm, confirmText, type });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const loadSettings = async () => {
    try {
      logger.debug('Loading admin settings from API...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        credentials: 'include'
      });
      
      logger.debug('Admin settings response status:', response.status);
      
      if (response.ok) {
        const settings = await response.json();
        logger.debug('Received settings from API:', settings);
        
        if (settings.ldap) {
          logger.debug('Setting LDAP settings:', settings.ldap);
          setLdapSettings(settings.ldap);
        } else {
          logger.debug('No LDAP settings in response, using defaults');
        }
        
        // Removed loading of kafka settings
        
        logger.debug('Final LDAP settings state:', settings.ldap);
      } else {
        logger.error('Failed to load settings, response not ok:', response.status);
        const errorText = await response.text();
        logger.error('Error response:', errorText);
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      console.log('👥 User data received:', data.users);
      setUsers(data.users || []);
    } catch (error) {
      logger.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const approveUser = async (username: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/users/${username}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve user');
      }
      
      await loadUsers();
      setMessage({ type: 'success', text: `User ${username} approved successfully` });
    } catch (error) {
      logger.error('Error approving user:', error);
      setMessage({ type: 'error', text: 'Failed to approve user' });
    }
  };

  const rejectUser = async (username: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/users/${username}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject user');
      }
      
      await loadUsers();
      setMessage({ type: 'success', text: `User ${username} rejected` });
    } catch (error) {
      logger.error('Error rejecting user:', error);
      setMessage({ type: 'error', text: 'Failed to reject user' });
    }
  };

  const deleteUser = (username: string) => {
    showConfirmation(
      t('confirmDelete'),
      t('confirmDeleteUser', { username }),
      async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
          const response = await fetch(`${apiUrl}/api/admin/users/${username}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete user');
          }
          
          await loadUsers();
          setMessage({ type: 'success', text: `User ${username} deleted` });
        } catch (error) {
          logger.error('Error deleting user:', error);
          setMessage({ type: 'error', text: 'Failed to delete user' });
        }
      },
      'danger',
      t('deleteUser')
    );
  };

  // Get status icon based on user status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const updateUserRole = async (username: string, role: 'user' | 'admin') => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/users/${username}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      await loadUsers();
      setMessage({ type: 'success', text: `User ${username} role updated to ${role}` });
    } catch (error) {
      logger.error('Error updating user role:', error);
      setMessage({ type: 'error', text: 'Failed to update user role' });
    }
  };

  const saveSettings = () => {
    showConfirmation(
      t('saveSettings'),
      t('confirmSaveSettings'),
      async () => {
        await performSaveSettings();
      },
      'warning',
      t('saveSettings')
    );
  };

  const performSaveSettings = async () => {

    setLoading(true);
    setMessage(null);
    
    try {
      logger.debug('Saving settings:', { ldap: ldapSettings });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ldap: ldapSettings
        })
      });
      
      logger.debug('Save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        logger.debug('Save successful:', result);
        setMessage({ type: 'success', text: t('settingsSaved') });
        setTimeout(() => {
          showConfirmation(
            t('restartRequired'),
            t('restartRequiredMessage'),
            () => {
              window.location.reload();
            },
            'warning',
            t('restart')
          );
        }, 2000);
      } else {
        const errorText = await response.text();
        logger.error('Save failed:', errorText);
        
        try {
          const error = JSON.parse(errorText) as { message?: string };
          setMessage({ type: 'error', text: error.message || t('settingsError') });
        } catch {
          setMessage({ type: 'error', text: `HTTP ${response.status}: ${errorText}` });
        }
      }
    } catch (error) {
      logger.error('Save error:', error);
      setMessage({ type: 'error', text: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const testLdapConnection = async () => {
    setTestingLdap(true);
    setMessage(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${apiUrl}/api/admin/test-ldap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(ldapSettings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: t('ldapTestSuccess') });
      } else {
        const error = await response.json() as { message?: string };
        setMessage({ type: 'error', text: error.message || t('ldapTestError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('ldapTestError') });
    } finally {
      setTestingLdap(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {!onClose && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          title={t('adminSettings')}
        >
          <Shield className="w-4 h-4 text-white" />
          {t('adminSettings')}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('adminSettings')}</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {message && (
                <div className={`p-4 rounded-md flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {message.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                  {message.text}
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b dark:border-gray-700">
              <div className="flex space-x-1 px-6">
                <button
                  onClick={() => setActiveTab('ldap')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'ldap'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Shield className="w-4 h-4 inline-block mr-2 text-gray-700 dark:text-gray-300" />
                  {t('ldapSettings')}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'users'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2 text-gray-700 dark:text-gray-300" />
                  {t('userManagement')}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'ldap' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('ldapConfiguration')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ldapSettings.enabled}
                        onChange={(e) => setLdapSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-gray-900 dark:text-gray-100">{t('ldapEnabled')}</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('ldapUrl')}</label>
                    <input
                      type="text"
                      value={ldapSettings.url}
                      onChange={(e) => setLdapSettings(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="ldap://192.168.1.100:389"
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      disabled={!ldapSettings.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('ldapBindDn')}</label>
                    <input
                      type="text"
                      value={ldapSettings.bindDN}
                      onChange={(e) => setLdapSettings(prev => ({ ...prev, bindDN: e.target.value }))}
                      placeholder="DOMAIN\\username"
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      disabled={!ldapSettings.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('ldapBindPassword')}</label>
                    <input
                      type="password"
                      value={ldapSettings.bindPassword}
                      onChange={(e) => setLdapSettings(prev => ({ ...prev, bindPassword: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      disabled={!ldapSettings.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('ldapSearchBase')}</label>
                    <input
                      type="text"
                      value={ldapSettings.searchBase}
                      onChange={(e) => setLdapSettings(prev => ({ ...prev, searchBase: e.target.value }))}
                      placeholder="dc=example,dc=com"
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      disabled={!ldapSettings.enabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('ldapSearchFilter')}</label>
                    <input
                      type="text"
                      value={ldapSettings.searchFilter}
                      onChange={(e) => setLdapSettings(prev => ({ ...prev, searchFilter: e.target.value }))}
                      placeholder="(sAMAccountName={{username}})"
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      disabled={!ldapSettings.enabled}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ldapSettings.tlsRejectUnauthorized}
                        onChange={(e) => setLdapSettings(prev => ({ ...prev, tlsRejectUnauthorized: e.target.checked }))}
                        className="rounded"
                        disabled={!ldapSettings.enabled}
                      />
                      <span className="text-gray-900 dark:text-gray-100">{t('ldapTlsRejectUnauthorized')}</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={testLdapConnection}
                      disabled={!ldapSettings.enabled || testingLdap}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                      <TestTube className="w-4 h-4 text-white" />
                      {testingLdap ? 'Testing...' : t('testLdapConnection')}
                    </button>
                  </div>
                </div>
              </div>
              ) : (
                /* User Management Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('userManagement')}</h3>
                    </div>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-md transition-colors"
                    >
                      {loadingUsers ? t('loading') : t('refresh')}
                    </button>
                  </div>

                  {loadingUsers ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingUsers')}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('userTableUsername')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('displayName')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('email')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('userStatusLabel')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('role')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('lastLogin')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {users.map((user) => (
                            <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{user.username}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{user.displayName}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{user.email || '-'}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {getStatusIcon(user.status)}
                                  {getUserStatusText(user.status)}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  value={user.role}
                                  onChange={(e) => updateUserRole(user.username, e.target.value as 'user' | 'admin')}
                                  className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                  disabled={user.status !== 'active'}
                                >
                                  <option value="user">{t('roleUser')}</option>
                                  <option value="admin">{t('roleAdmin')}</option>
                                </select>
                              </td>
                              <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString(language) : '-'}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex gap-1">
                                  {user.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => approveUser(user.username)}
                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title={t('approveUser')}
                                      >
                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                      </button>
                                      <button
                                        onClick={() => rejectUser(user.username)}
                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title={t('rejectUser')}
                                      >
                                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => deleteUser(user.username)}
                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title={t('deleteUser')}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {users.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noUsers')}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                <Save className="w-4 h-4 text-white" />
                {loading ? 'Saving...' : t('saveSettings')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {confirmAction.type === 'danger' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {confirmAction.title}
                </h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {confirmAction.message}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    confirmAction.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {confirmAction.confirmText || t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}