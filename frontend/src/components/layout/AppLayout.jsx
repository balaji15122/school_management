import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileDrawer, BottomNavBar } from './MobileNav';

const AppLayout = ({ title = 'Dashboard', actions, children }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Desktop Sidebar (hidden via CSS media query on < 960px) */}
      <div className="desktop-sidebar-container">
        <Sidebar />
      </div>

      {/* Mobile Drawer (rendered conditionally) */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Header
          title={title}
          actions={actions}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        />

        <main
          className="app-main-content"
          style={{
            flex: 1,
            padding: '20px 24px',
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on desktop >= 960px via CSS) */}
      <BottomNavBar />
    </div>
  );
};

export default AppLayout;
