'use client';

import { useEffect, useState } from 'react';
import { Server, Database, Users, Activity, AlertCircle, Wifi, WifiOff, Search, X } from 'lucide-react';
import { StatusCard } from '@/components/StatusCard';
import { TopicDetails } from '@/components/TopicDetails';
import { ConsumerGroupDetails } from '@/components/ConsumerGroupDetails';
import { Settings } from '@/components/Settings';
import { ConnectionManager } from '@/components/ConnectionManager';
import { DraggableStatsCard } from '@/components/DraggableStatsCard';
import { DraggablePanel } from '@/components/DraggablePanel';
import Login from '@/components/Login';
import ProfileMenu from '@/components/ProfileMenu';
import PendingApproval from '@/components/PendingApproval';
import { getSocket } from '@/lib/socket';
import { KafkaStatus } from '@/lib/types';
import { Language, useTranslation } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function Home() {
  const [status, setStatus] = useState<KafkaStatus>({
    cluster: null,
    topics: [],
    consumerGroups: [],
    lastUpdated: null,
    error: null,
  });
  const [connected, setConnected] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [refreshRate, setRefreshRate] = useState(30);
  const [showBehindOnly, setShowBehindOnly] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [cardOrder, setCardOrder] = useState(['totalMessages', 'consumed', 'remaining', 'connection']);
  const [panelOrder, setPanelOrder] = useState(['topics', 'consumerGroups']);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const { t } = useTranslation(language);
  const { user, isLoading, pendingApproval, pendingMessage, authEnabled, login, logout, checkApprovalStatus } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Only initialize WebSocket if user is authenticated
    if (!user) {
      setConnected(false);
      // Reset dashboard status to initial state when user logs out
      setStatus({
        cluster: null,
        topics: [],
        consumerGroups: [],
        lastUpdated: null,
        error: null,
      });
      return;
    }

    console.log('🔄 Initializing WebSocket for authenticated user:', user.uid);

    // Reset to connecting state when user logs in
    setStatus({
      cluster: null,
      topics: [],
      consumerGroups: [],
      lastUpdated: null,
      error: null,
    });
    setConnected(false);

    // Add a delay to ensure session is fully established on server
    const timer = setTimeout(() => {
      console.log('🔌 Connecting to WebSocket...');
      const socket = getSocket();

      socket.on('connect', () => {
        setConnected(true);
        console.log('✅ Connected to WebSocket successfully');
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
        console.log('❌ Disconnected from WebSocket, reason:', reason);
        
        // If disconnect is due to authentication issues, show connecting state
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('🔄 WebSocket disconnected, will attempt to reconnect...');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('🚨 WebSocket connection error:', error);
        setConnected(false);
        
        // If connection error is due to authentication, the socket will retry automatically
        console.log('🔄 WebSocket connection failed, retrying...');
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
        setConnected(true);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
        setConnected(false);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket reconnection failed - max attempts reached');
        setConnected(false);
      });

      socket.on('status', (data: KafkaStatus) => {
        console.log('📊 Received status data via WebSocket:', {
          hasCluster: !!data.cluster,
          topicsCount: data.topics?.length || 0,
          consumerGroupsCount: data.consumerGroups?.length || 0,
          lastUpdated: data.lastUpdated,
          error: data.error
        });
        setStatus(data);
      });

      socket.on('refreshRateChanged', (newRate: number) => {
        setRefreshRate(newRate);
      });

      // Initial fetch
      console.log('🔄 Making initial HTTP fetch to /api/status...');
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/status`, {
        credentials: 'include'
      })
        .then(res => {
          console.log('📡 HTTP /api/status response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('📊 Received status data via HTTP:', {
            hasCluster: !!data.cluster,
            topicsCount: data.topics?.length || 0,
            consumerGroupsCount: data.consumerGroups?.length || 0,
            lastUpdated: data.lastUpdated,
            error: data.error
          });
          setStatus(data);
        })
        .catch(err => console.error('❌ Error fetching initial status:', err));
    }, 2000); // Increased to 2 seconds delay

    return () => {
      clearTimeout(timer);
    };
  }, [user]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleRefreshRateChange = (newRate: number) => {
    setRefreshRate(newRate);
    const socket = getSocket();
    socket.emit('setRefreshRate', newRate);
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const toggleFavorite = (topicName: string) => {
    const newFavorites = favoriteTopics.includes(topicName)
      ? favoriteTopics.filter(t => t !== topicName)
      : [...favoriteTopics, topicName];
    setFavoriteTopics(newFavorites);
    localStorage.setItem('favoriteTopics', JSON.stringify(newFavorites));
  };

  const handleConnectionChange = async (connection: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/change-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brokers: connection.brokers })
      });

      const result = await response.json();
      if (result.success) {
        setCurrentConnection(connection);
        // Force refresh status
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/status`, {
          credentials: 'include'
        });
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Failed to change connection:', error);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    console.log('Drag ended:', { activeId: active.id, overId: over?.id });

    if (active.id !== over?.id && over) {
      // Handle cards drag & drop
      if (cardOrder.includes(active.id)) {
        setCardOrder((items) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          console.log('Reordering cards:', { oldIndex, newIndex, from: active.id, to: over.id });
          const newOrder = arrayMove(items, oldIndex, newIndex);
          localStorage.setItem('cardOrder', JSON.stringify(newOrder));
          console.log('New card order:', newOrder);
          return newOrder;
        });
      }
      // Handle panels drag & drop
      else if (panelOrder.includes(active.id)) {
        setPanelOrder((items) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          console.log('Reordering panels:', { oldIndex, newIndex, from: active.id, to: over.id });
          const newOrder = arrayMove(items, oldIndex, newIndex);
          localStorage.setItem('panelOrder', JSON.stringify(newOrder));
          console.log('New panel order:', newOrder);
          return newOrder;
        });
      }
    }
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
    
    const savedFavorites = localStorage.getItem('favoriteTopics');
    if (savedFavorites) {
      setFavoriteTopics(JSON.parse(savedFavorites));
    }

    const savedCardOrder = localStorage.getItem('cardOrder');
    if (savedCardOrder) {
      setCardOrder(JSON.parse(savedCardOrder));
    }

    const savedPanelOrder = localStorage.getItem('panelOrder');
    if (savedPanelOrder) {
      setPanelOrder(JSON.parse(savedPanelOrder));
    }
  }, []);

  // Filter and sort topics based on showBehindOnly state, search query, and favorites
  const filteredTopics = (status.topics || []).filter(topic => {
    // Apply search filter
    if (topicSearchQuery && !topic.name.toLowerCase().includes(topicSearchQuery.toLowerCase())) {
      return false;
    }
    // Apply behind only filter
    if (showBehindOnly && (!topic.remainingMessages || topic.remainingMessages === 0)) {
      return false;
    }
    return true;
  });
  
  // Sort topics with favorites first
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    const aFav = favoriteTopics.includes(a.name);
    const bFav = favoriteTopics.includes(b.name);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // Statistics cards data
  const statsCards = {
    totalMessages: {
      id: 'totalMessages',
      title: t('totalMessages'),
      value: (status.topics || []).reduce((sum, topic) => sum + (topic.totalMessages || 0), 0).toLocaleString(),
      icon: <Database className="text-blue-500 dark:text-blue-400" size={24} />,
      textColor: 'text-gray-900 dark:text-white'
    },
    consumed: {
      id: 'consumed',
      title: t('consumed'),
      value: (status.topics || []).reduce((sum, topic) => sum + (topic.totalConsumed || Math.max(0, (topic.totalMessages || 0) - (topic.remainingMessages || 0))), 0).toLocaleString(),
      icon: <Activity className="text-green-500 dark:text-green-400" size={24} />,
      textColor: 'text-green-600 dark:text-green-400'
    },
    remaining: {
      id: 'remaining',
      title: t('remaining'),
      value: (status.topics || []).reduce((sum, topic) => sum + (topic.remainingMessages || 0), 0).toLocaleString(),
      icon: <Activity className="text-orange-500 dark:text-orange-400" size={24} />,
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    connection: {
      id: 'connection',
      title: t('connection'),
      value: connected ? t('live') : t('offline'),
      subtitle: `${t('updatesEvery')} ${refreshRate}${t('seconds')}`,
      icon: connected ? <Wifi className="text-green-500 dark:text-green-400" size={24} /> : <WifiOff className="text-red-500 dark:text-red-400" size={24} />,
      textColor: connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }
  };

  // Panel data structure
  const panels = {
    topics: {
      id: 'topics',
      title: t('topics'),
      icon: <Database size={24} />,
      colSpan: 'col-span-1'
    },
    consumerGroups: {
      id: 'consumerGroups', 
      title: t('consumerGroups'),
      icon: <Users size={24} />,
      colSpan: 'col-span-1'
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('connecting')}</p>
        </div>
      </div>
    );
  }

  // Show pending approval screen
  if (pendingApproval) {
    return <PendingApproval language={language} message={pendingMessage || ''} onLogout={logout} onRefresh={checkApprovalStatus} onLanguageChange={handleLanguageChange} />;
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={login} language={language} onLanguageChange={handleLanguageChange} />;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            {status.lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('lastUpdated')}: {new Date(status.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Show connection info for all users, but only allow admin to manage */}
            <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border dark:border-gray-700">
              <Server size={16} className="text-gray-600 dark:text-gray-300" />
              <span className="text-gray-600 dark:text-gray-300">
                {status.cluster?.connectionString || t('connecting')}
              </span>
            </div>
            <ProfileMenu
              language={language}
              user={user}
              onLogout={logout}
              onLanguageChange={handleLanguageChange}
              refreshRate={refreshRate}
              onRefreshRateChange={handleRefreshRateChange}
              darkMode={darkMode}
              onDarkModeToggle={handleDarkModeToggle}
              onShowConnectionManager={() => setShowConnectionManager(true)}
              currentConnection={currentConnection}
              onConnectionChange={handleConnectionChange}
              authEnabled={authEnabled}
            />
          </div>
        </div>

        {status.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
            <AlertCircle className="text-red-500 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">{status.error}</span>
          </div>
        )}

        {/* Draggable Main Panels */}
        <div className="mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 {t('dragPanelsTooltip')}
          </p>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={[...panelOrder, ...cardOrder]} strategy={rectSortingStrategy}>
            <SortableContext items={panelOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {panelOrder.map(panelId => {
                  const panel = panels[panelId as keyof typeof panels];
                  return (
                    <DraggablePanel key={panel.id} id={panel.id} dragText={t('dragPanelTooltip')}>
                      <div className={panel.colSpan}>
                        <StatusCard title={panel.title} icon={panel.icon}>
                          {panelId === 'topics' && (
                            <div className="min-h-[400px] flex flex-col">
                              <div className="mb-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-lg">
                                    {filteredTopics.length} {t('topics')}
                                    {topicSearchQuery && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-normal">
                                        ({t('filtered')})
                                      </span>
                                    )}
                                    {!showBehindOnly && status.totalTopics && status.totalTopics > status.topics.length && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-normal">({t('showing')} {status.topics.length})</span>
                                    )}
                                    {showBehindOnly && !topicSearchQuery && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-normal">({t('showBehind').toLowerCase()})</span>
                                    )}
                                  </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{t('showBehind')}</span>
                                  <button
                                    onClick={() => setShowBehindOnly(!showBehindOnly)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                                      showBehindOnly ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                  >
                                    <span className="sr-only">{t('showBehind')}</span>
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                                        showBehindOnly ? 'translate-x-5' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder={t('searchTopics')}
                                  value={topicSearchQuery}
                                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                                  className="w-full px-3 py-1.5 pl-9 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
                                {topicSearchQuery && (
                                  <button
                                    onClick={() => setTopicSearchQuery('')}
                                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto pr-2 flex-1 mt-3">
                                {sortedTopics.map(topic => (
                                  <TopicDetails 
                                    key={topic.name} 
                                    topic={topic} 
                                    language={language}
                                    darkMode={darkMode}
                                    isFavorite={favoriteTopics.includes(topic.name)}
                                    onToggleFavorite={() => toggleFavorite(topic.name)}
                                  />
                                ))}
                                {showBehindOnly && filteredTopics.length === 0 && (
                                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <div className="text-sm">✓ {t('caughtUp')}</div>
                                    <div className="text-xs mt-1">{t('noTopicsBehind')}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {panelId === 'consumerGroups' && (
                            <div className="min-h-[400px] flex flex-col">
                              <div className="mb-3 font-semibold text-lg">
                                {status.totalGroups || (status.consumerGroups || []).length} {t('groups')}
                                {status.totalGroups && status.totalGroups > (status.consumerGroups || []).length && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-normal">({t('showing')} {(status.consumerGroups || []).length})</span>
                                )}
                              </div>
                              <div className="max-h-[350px] overflow-y-auto pr-2 flex-1">
                                {(status.consumerGroups || []).map(group => (
                                  <ConsumerGroupDetails key={group.groupId} group={group} language={language} />
                                ))}
                              </div>
                            </div>
                          )}
                        </StatusCard>
                      </div>
                    </DraggablePanel>
                  );
                })}
              </div>
            </SortableContext>

            {/* Draggable Statistics Cards */}
            <div className="mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 {t('dragToReorder')}
              </p>
            </div>
            <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardOrder.map(cardId => {
                  const card = statsCards[cardId as keyof typeof statsCards];
                  return (
                    <DraggableStatsCard key={card.id} id={card.id} dragText={t('dragTooltip')}>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-4 border border-gray-100 dark:border-gray-700 transition-all duration-200 min-h-[100px] hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md cursor-pointer">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1 flex flex-col justify-between min-h-[60px]">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                              <p className={`text-2xl font-bold ${card.textColor}`}>
                                {card.value}
                              </p>
                            </div>
                            <div className="h-4 flex items-end">
                              {(card as any).subtitle && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">{(card as any).subtitle}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {card.icon}
                          </div>
                        </div>
                      </div>
                    </DraggableStatsCard>
                  );
                })}
              </div>
            </SortableContext>
          </SortableContext>
        </DndContext>
      </div>

      {/* Connection Manager Modal */}
      <ConnectionManager
        isOpen={showConnectionManager}
        onClose={() => setShowConnectionManager(false)}
        currentConnection={currentConnection}
        onConnectionChange={handleConnectionChange}
        language={language}
        darkMode={darkMode}
      />
    </main>
  );
}
