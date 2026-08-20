import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NotificationProvider } from '../../contexts/NotificationContext';

export default function MainLayout() {
  return (
    <NotificationProvider>
      <div className="app-layout">
        <Header />
        <Sidebar />
        <div className="main-content">
          <div className="app-content-bg"></div>
          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
