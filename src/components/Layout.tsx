import React from 'react';
import { BookOpen, Sun, Moon, Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onWriteClick: () => void;
  onLogoClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  theme,
  toggleTheme,
  onWriteClick,
  onLogoClick
}) => {
  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <div className="logo-section" onClick={onLogoClick}>
          <div className="logo-icon">
            <BookOpen size={24} />
          </div>
          <h1 className="logo-title gradient-text">하루기록</h1>
        </div>

        <div className="nav-actions">
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button className="btn-primary" onClick={onWriteClick}>
            <Plus size={20} />
            <span>새 일기 쓰기</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
