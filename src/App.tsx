import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DiaryStats } from './components/DiaryStats';
import { DiaryCalendar } from './components/DiaryCalendar';
import { DiaryList } from './components/DiaryList';
import { DiaryForm } from './components/DiaryForm';
import { DiaryDetail } from './components/DiaryDetail';
import { getEntries, saveEntry, deleteEntry, getStats } from './services/diaryService';
import type { DiaryEntry, DiaryStats as StatsType, MoodType } from './types';

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

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<StatsType>({
    totalEntries: 0,
    moodCounts: { happy: 0, peaceful: 0, excited: 0, sad: 0, tired: 0, angry: 0 },
    writingStreak: 0,
    storageUsedBytes: 0
  });

  // 달력 관리 핵심 상태
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [activeMoodFilter, setActiveMoodFilter] = useState<MoodType | null>(null);

  const [currentView, setCurrentView] = useState<'list' | 'write' | 'edit'>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // 컴포넌트 마운트 시 로컬스토리지에서 데이터 로드
  useEffect(() => {
    refreshData();
  }, []);

  // 테마 상태 변경 시 document 속성 적용 및 로컬스토리지 저장
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshData = () => {
    const list = getEntries();
    setEntries(list);
    setStats(getStats());
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

  // 일기 저장 처리
  const handleSave = (entryData: Partial<DiaryEntry> & { title: string; content: string; date: string; mood: MoodType }) => {
    saveEntry(entryData);
    refreshData();
    // 저장 후 해당 날짜의 달력 칸으로 자동 이동 및 일기 표출
    setSelectedDate(entryData.date);
    setCurrentView('list');
    setSelectedEntry(null);
  };

  // 일기 삭제 처리
  const handleDelete = (id: string) => {
    deleteEntry(id);
    refreshData();
    setSelectedEntry(null);
  };

  // 로고 클릭 시 홈(오늘 날짜 선택 및 필터 제거)으로 초기화
  const handleLogoClick = () => {
    setSelectedDate(getLocalDateString());
    setActiveMoodFilter(null);
    setCurrentView('list');
    setSelectedEntry(null);
  };

  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      onWriteClick={() => {
        setSelectedEntry(null);
        setCurrentView('write');
      }}
      onLogoClick={handleLogoClick}
    >
      {currentView === 'list' && (
        <>
          {/* 상단: 대시보드 통계 영역 */}
          <DiaryStats 
            stats={stats} 
            activeMoodFilter={activeMoodFilter}
            onMoodClick={handleMoodClick}
          />
          
          {/* 중앙: 달력 뷰 */}
          <DiaryCalendar 
            entries={entries}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeMoodFilter={activeMoodFilter}
          />

          {/* 하단: 선택 날짜의 일기 상세 리스트 */}
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
    </Layout>
  );
}

export default App;
