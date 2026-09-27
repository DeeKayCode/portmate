import React, { useState, useEffect } from 'react';
import { store } from './api/store';
import { NavTab, BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { ProfileModal } from './components/ProfileModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ItineraryView } from './views/ItineraryView';
import { AddPortMateView } from './views/AddPortMateView';
import { ConnectionOverviewView } from './views/ConnectionOverviewView';
import { ContractsView } from './views/ContractsView';
import { OfflineBanner } from './components/UIState';
import { User, Contract, Connection, NotificationItem, PortCall } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('itinerary');
  const [user, setUser] = useState<User>(store.getUser());
  const [contracts, setContracts] = useState<Contract[]>(store.getContracts());
  const [connections, setConnections] = useState<Connection[]>(store.getConnections());
  const [notifications, setNotifications] = useState<NotificationItem[]>(store.getNotifications());
  const [portCalls, setPortCalls] = useState<PortCall[]>(store.getPortCalls());

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    store.syncFromServer();

    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
      setContracts(store.getContracts());
      setConnections(store.getConnections());
      setNotifications(store.getNotifications());
      setPortCalls(store.getPortCalls());
    });

    const handleOnline = () => {
      setIsOffline(false);
      store.syncFromServer();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendPoke = (_overlapId: string) => {
    // Optimistic poke state update
    alert('Meeting intent sent! If your mate is interested, you will be notified.');
  };

  const handleConnectQR = (qrData: string) => {
    return store.addConnectionFromQR(qrData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-accent selection:text-white">
      {/* Mobile container - centered max 430px */}
      <div className="relative flex min-h-screen w-full max-w-mobile flex-col bg-slate-50 shadow-2xl overflow-x-hidden">
        {isOffline && <OfflineBanner />}

        {/* Persistent Top Navigation Bar */}
        <TopBar
          user={user}
          notifications={notifications}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          isOffline={isOffline}
        />

        {/* Main Active Tab Screen */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'itinerary' && (
            <ItineraryView portCalls={portCalls} onSendPoke={handleSendPoke} />
          )}

          {activeTab === 'add_mate' && (
            <AddPortMateView
              user={user}
              connections={connections}
              onConnectQR={handleConnectQR}
              onRemoveConnection={(id) => store.removeConnection(id)}
              onBlockUser={(id) => store.blockUser(id)}
            />
          )}

          {activeTab === 'overview' && (
            <ConnectionOverviewView
              connections={connections}
              portCalls={portCalls}
            />
          )}

          {activeTab === 'contracts' && (
            <ContractsView
              contracts={contracts}
              onAddContract={(c) => store.addContract(c)}
              onDeleteContract={(id) => store.deleteContract(id)}
            />
          )}
        </main>

        {/* Fixed 4-Tab Bottom Navigation Bar */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Modals */}
        <ProfileModal
          user={user}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUpdateUser={(p) => store.updateUser(p)}
        />

        <NotificationsModal
          notifications={notifications}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={() => store.markAllNotificationsRead()}
          onRespondPoke={(id, res) => store.respondToPoke(id, res)}
        />
      </div>
    </div>
  );
};

export default App;
