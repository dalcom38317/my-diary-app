import React from 'react';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Sun, Moon, Plus, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onWriteClick: () => void;
  onLogoClick: () => void;
  // 사용자 정보 및 로그아웃 연동 콜백 추가
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  theme,
  toggleTheme,
  onWriteClick,
  onLogoClick,
  user,
  onLogout
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
          {/* 테마 토글 버튼 */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* 로그인한 사용자 프로필 이미지 및 로그아웃 버튼 렌더링 */}
          {user && (
            <>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-main)'
                }}
              >
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="GitHub Profile" 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  referrerPolicy="no-referrer"
                />
                <span 
                  style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600, 
                    color: 'var(--text-main)',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={user.user_metadata.full_name || user.email}
                >
                  {user.user_metadata.full_name || user.email?.split('@')[0]}
                </span>
              </div>

              {/* 새 글 작성 */}
              <button className="btn-primary" onClick={onWriteClick} style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                <Plus size={16} />
                <span>기록하기</span>
              </button>

              {/* 로그아웃 버튼 */}
              <button 
                className="btn-icon" 
                onClick={onLogout}
                title="로그아웃"
                style={{ border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--mood-angry)' }}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
