import React from 'react';
import type { DiaryStats as StatsType, MoodType } from '../types';
import { BookOpen, Flame, HardDrive } from 'lucide-react';
import { formatBytes } from '../utils/imageHelper';

interface DiaryStatsProps {
  stats: StatsType;
  activeMoodFilter: string | null;
  onMoodClick: (mood: MoodType) => void;
}

// 각 감정에 대응하는 한글 레이블, 이모지 문자 및 컬러 토큰 매핑 정의
export const moodMeta: Record<MoodType, { label: string; emoji: string; color: string; bg: string }> = {
  happy: { label: '행복', emoji: '🥰', color: 'var(--mood-happy)', bg: 'var(--mood-happy-bg)' },
  peaceful: { label: '평온', emoji: '🌿', color: 'var(--mood-peaceful)', bg: 'var(--mood-peaceful-bg)' },
  excited: { label: '신남', emoji: '🥳', color: 'var(--mood-excited)', bg: 'var(--mood-excited-bg)' },
  sad: { label: '슬픔', emoji: '😭', color: 'var(--mood-sad)', bg: 'var(--mood-sad-bg)' },
  tired: { label: '피곤', emoji: '🥱', color: 'var(--mood-tired)', bg: 'var(--mood-tired-bg)' },
  angry: { label: '화남', emoji: '😡', color: 'var(--mood-angry)', bg: 'var(--mood-angry-bg)' }
};

export const DiaryStats: React.FC<DiaryStatsProps> = ({ 
  stats,
  activeMoodFilter,
  onMoodClick
}) => {
  const LOCAL_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
  const storagePercentage = Math.min(
    100,
    parseFloat(((stats.storageUsedBytes / LOCAL_STORAGE_LIMIT) * 100).toFixed(1))
  );

  return (
    <div className="dashboard-grid">
      {/* 통계: 총 작성 수 */}
      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>총 기록한 하루</span>
          <BookOpen size={18} />
        </div>
        <div className="stat-value gradient-text">{stats.totalEntries}개</div>
        <div className="stat-footer">소중한 일상들이 쌓여가고 있어요.</div>
      </div>

      {/* 통계: 기록 스트릭 */}
      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>기록 스트릭</span>
          <Flame size={18} style={{ color: stats.writingStreak > 0 ? '#ff7a00' : 'inherit' }} />
        </div>
        <div className="stat-value" style={{ color: stats.writingStreak > 0 ? '#ff7a00' : 'inherit' }}>
          {stats.writingStreak}일째
        </div>
        <div className="stat-footer">
          {stats.writingStreak > 0 
            ? '🔥 매일의 성실한 나를 기록 중!' 
            : '오늘의 감정을 첫 글로 남겨보세요!'}
        </div>
      </div>

      {/* 통계: 오프라인 저장소 사용량 */}
      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>오프라인 저장 공간</span>
          <HardDrive size={18} />
        </div>
        <div className="stat-value" style={{ fontSize: '1.8rem', paddingTop: '4px' }}>
          {storagePercentage}%
        </div>
        <div className="storage-indicator">
          <div className="storage-bar-bg">
            <div 
              className="storage-bar-fill" 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formatBytes(stats.storageUsedBytes)} / {formatBytes(LOCAL_STORAGE_LIMIT)} 사용 중
          </span>
        </div>
      </div>

      {/* 통계: 내 마음 지도 (이모지 및 클릭 이벤트 연결) */}
      <div className="stat-card glass-panel" style={{ gridColumn: 'span 1', minWidth: '280px' }}>
        <div className="stat-header" style={{ marginBottom: '4px' }}>
          <span>내 마음 지도 (클릭 시 달력 필터링)</span>
        </div>
        <div className="mood-chart-container">
          {(Object.keys(moodMeta) as MoodType[]).map(moodKey => {
            const count = stats.moodCounts[moodKey] || 0;
            const percentage = stats.totalEntries > 0 
              ? (count / stats.totalEntries) * 100 
              : 0;
            const meta = moodMeta[moodKey];
            const isFilteredActive = activeMoodFilter === moodKey;
            
            return (
              <div 
                key={moodKey} 
                className={`mood-bar-row clickable ${isFilteredActive ? 'active-filter' : ''}`}
                onClick={() => onMoodClick(moodKey)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  backgroundColor: isFilteredActive ? 'var(--primary-light)' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  border: isFilteredActive ? '1px solid var(--primary)' : '1px solid transparent'
                }}
                title={`${meta.label} 기분이 작성된 날짜를 달력에서 하이라이트 합니다.`}
              >
                <div className="mood-bar-label" style={{ color: meta.color, minWidth: '65px' }}>
                  <span style={{ marginRight: '4px', fontSize: '1.1rem' }}>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </div>
                <div className="mood-bar-track" style={{ height: '10px' }}>
                  <div 
                    className="mood-bar-fill" 
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: meta.color 
                    }}
                  ></div>
                </div>
                <div className="mood-bar-count" style={{ fontSize: '0.85rem' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
