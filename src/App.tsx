import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { Layout } from './components/Layout';
import { DiaryStats } from './components/DiaryStats';
import { DiaryCalendar } from './components/DiaryCalendar';
import { DiaryList } from './components/DiaryList';
import { DiaryForm } from './components/DiaryForm';
import { DiaryDetail } from './components/DiaryDetail';
import { getEntries, saveEntry, deleteEntry, getStats } from './services/diaryService';
import type { DiaryEntry, DiaryStats as StatsType, MoodType } from './types';
import { BookOpen } from 'lucide-react';

// 로컬 시간 기준 YYYY-MM-DD 문자열 생성 헬퍼
const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Supabase 로그인 유저 상태
  const [user, setUser] = useState<User | null>(null);

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<StatsType>({
    totalEntries: 0,
    moodCounts: { happy: 0, peaceful: 0, excited: 0, sad: 0, tired: 0, angry: 0 },
    writingStreak: 0,
    storageUsedBytes: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [activeMoodFilter, setActiveMoodFilter] = useState<MoodType | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'write' | 'edit'>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // 1. 컴포넌트 마운트 시 및 인증 상태 변경 시 감지 핸들러
  useEffect(() => {
    // 최초 세션 획득
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 인증 변화 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // 로그인 창 복귀 시 뷰 및 필터링 상태 초기화
      if (!session?.user) {
        setCurrentView('list');
        setSelectedEntry(null);
        setActiveMoodFilter(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 유저 상태(로그인 여부) 변화에 맞춰 일기 데이터 조회 반응
  useEffect(() => {
    if (user) {
      refreshData(user.id);
    } else {
      setEntries([]);
      setStats({
        totalEntries: 0,
        moodCounts: { happy: 0, peaceful: 0, excited: 0, sad: 0, tired: 0, angry: 0 },
        writingStreak: 0,
        storageUsedBytes: 0
      });
    }
  }, [user]);

  // 테마 상태 변경 시 document 속성 적용 및 로컬스토리지 저장
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshData = async (userId: string) => {
    setIsLoading(true);
    try {
      const list = await getEntries(userId);
      setEntries(list);
      
      const statistics = await getStats(userId);
      setStats(statistics);
    } catch (e) {
      console.error('Supabase 데이터 로드 에러:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 깃허브 소셜 로그인 시작
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://my-diary-app-plum.vercel.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (e: any) {
      console.error('로그인 에러:', e);
      alert(`로그인을 시작하지 못했습니다: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 세션 파기
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e: any) {
      console.error('로그아웃 에러:', e);
      alert(`로그아웃 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 대시보드 내 마음 지도 감정 행 클릭 처리 콜백
  const handleMoodClick = (mood: MoodType) => {
    setActiveMoodFilter(prev => (prev === mood ? null : mood));
  };

  // 특정 날짜에 새 일기 작성 트리거 콜백
  const handleWriteForDate = (date: string) => {
    setSelectedDate(date);
    setSelectedEntry(null);
    setCurrentView('write');
  };

  // 일기 저장 처리 (비동기)
  const handleSave = async (entryData: Partial<DiaryEntry> & { title: string; content: string; date: string; mood: MoodType }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await saveEntry(entryData, user.id);
      await refreshData(user.id);
      
      setSelectedDate(entryData.date);
      setCurrentView('list');
      setSelectedEntry(null);
    } catch (e: any) {
      console.error('일기 저장 실패:', e);
      const errMsg = e?.message || e?.details || JSON.stringify(e);
      alert(`일기 데이터를 저장하는 도중 오류가 발생했습니다:\n[에러 내용] ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 일기 삭제 처리 (비동기)
  const handleDelete = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await deleteEntry(id);
      await refreshData(user.id);
      setSelectedEntry(null);
    } catch (e: any) {
      console.error('일기 삭제 실패:', e);
      const errMsg = e?.message || e?.details || JSON.stringify(e);
      alert(`일기를 삭제하지 못했습니다:\n[에러 내용] ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 로고 클릭 시 홈(오늘 날짜 선택 및 필터 제거)으로 초기화
  const handleLogoClick = () => {
    setSelectedDate(getLocalDateString());
    setActiveMoodFilter(null);
    setCurrentView('list');
    setSelectedEntry(null);
  };

  // 비로그인 상태: 프리미엄 웰컴 로그인 스크린 렌더링
  if (!user) {
    return (
      <div 
        style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          padding: '20px',
          fontFamily: 'var(--font-sans)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 미려한 무드 원형 블러 데코레이션 */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div 
          className="glass-panel" 
          style={{ 
            width: '100%',
            maxWidth: '440px',
            padding: '48px 36px',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 10
          }}
        >
          {/* 로고 */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)'
            }}
          >
            <BookOpen size={36} />
          </div>

          <div>
            <h1 className="logo-title gradient-text" style={{ fontSize: '2.2rem', marginBottom: '8px', fontWeight: 800 }}>
              하루기록
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 8px' }}>
              오늘 하루의 기분과 소중한 사진들을 클라우드에 영구 보존하세요. 깃허브 계정으로 편리하게 시작하실 수 있습니다.
            </p>
          </div>

          {/* 깃허브 로그인 버튼 (인라인 브랜드 SVG 사용) */}
          <button 
            onClick={handleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#24292e',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '99px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="currentColor"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>GitHub 계정으로 계속하기</span>
          </button>
          
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supabase 클라우드 동기화 기술 적용
          </span>
        </div>

        {/* 로딩 표시 */}
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass-panel" style={{ padding: '20px 30px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>연결 요청 중...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 로그인 상태: 본문 및 다이어리 컨텐츠 렌더링
  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      onWriteClick={() => {
        setSelectedEntry(null);
        setCurrentView('write');
      }}
      onLogoClick={handleLogoClick}
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'list' && (
        <>
          <DiaryStats 
            stats={stats} 
            activeMoodFilter={activeMoodFilter}
            onMoodClick={handleMoodClick}
          />
          
          <DiaryCalendar 
            entries={entries}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeMoodFilter={activeMoodFilter}
          />

          <DiaryList 
            entries={entries}
            selectedDate={selectedDate}
            onCardClick={(entry) => setSelectedEntry(entry)}
            onWriteForDate={handleWriteForDate}
          />
        </>
      )}

      {currentView === 'write' && (
        <DiaryForm
          defaultDate={selectedDate}
          onSave={handleSave}
          onCancel={() => setCurrentView('list')}
        />
      )}

      {currentView === 'edit' && (
        <DiaryForm
          initialEntry={selectedEntry}
          onSave={handleSave}
          onCancel={() => {
            setCurrentView('list');
            setSelectedEntry(selectedEntry);
          }}
        />
      )}

      {/* 일기 상세 모달 */}
      {selectedEntry && currentView !== 'edit' && (
        <DiaryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={() => setCurrentView('edit')}
          onDelete={handleDelete}
        />
      )}

      {/* 로딩 스피너 오버레이 */}
      {isLoading && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.4)', 
            backdropFilter: 'blur(5px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 2000 
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              padding: '30px 45px', 
              borderRadius: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px' 
            }}
          >
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid var(--border-main)', 
                borderTopColor: 'var(--primary)', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>데이터 처리 중...</span>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
