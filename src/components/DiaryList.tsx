import React, { useMemo } from 'react';
import type { DiaryEntry } from '../types';
import { DiaryCard } from './DiaryCard';
import { BookOpen, Plus } from 'lucide-react';

interface DiaryListProps {
  entries: DiaryEntry[];
  selectedDate: string;
  onCardClick: (entry: DiaryEntry) => void;
  onWriteForDate: (date: string) => void;
}

const formatSelectedDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
};

export const DiaryList: React.FC<DiaryListProps> = ({
  entries,
  selectedDate,
  onCardClick,
  onWriteForDate
}) => {
  // 선택된 날짜에 해당하는 일기 필터링
  const dateEntries = useMemo(() => {
    return entries.filter(e => e.date === selectedDate);
  }, [entries, selectedDate]);

  return (
    <div className="main-view-container" style={{ marginTop: '8px' }}>
      {/* 선택한 날짜 제목 */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid var(--border-main)',
          paddingBottom: '12px'
        }}
      >
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
          📅 {formatSelectedDate(selectedDate)}의 하루 기록
        </h3>
        {dateEntries.length > 0 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            총 {dateEntries.length}개의 기록
          </span>
        )}
      </div>

      {/* 일기 리스트 그리드 */}
      <section className="diary-grid">
        {dateEntries.length > 0 ? (
          dateEntries.map(entry => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              onClick={() => onCardClick(entry)}
            />
          ))
        ) : (
          <div 
            className="no-entries-card glass-panel" 
            style={{ 
              padding: '60px 24px',
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}
          >
            <BookOpen size={40} className="no-entries-icon" />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                기록이 없는 날짜입니다
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                이 날짜에는 아직 일기가 작성되지 않았습니다.
              </p>
            </div>
            
            {/* 이 날짜에 즉시 새 글을 쓸 수 있는 단추 */}
            <button 
              className="btn-primary" 
              onClick={() => onWriteForDate(selectedDate)}
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>이 날짜에 새 일기 쓰기</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
