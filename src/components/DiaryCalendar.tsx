import React, { useState } from 'react';
import type { DiaryEntry, MoodType } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 감정별 매핑 이모지 정의
export const moodEmojis: Record<MoodType, string> = {
  happy: '🥰',
  peaceful: '🌿',
  excited: '🥳',
  sad: '😭',
  tired: '🥱',
  angry: '😡'
};

interface DiaryCalendarProps {
  entries: DiaryEntry[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  activeMoodFilter: string | null;
}

export const DiaryCalendar: React.FC<DiaryCalendarProps> = ({
  entries,
  selectedDate,
  onDateSelect,
  activeMoodFilter
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0 ~ 11

  // 이전달로 이동
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // 다음달로 이동
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // 달력 날짜 행렬 생성
  const generateCalendarDays = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0(일) ~ 6(토)
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate(); // 당월 총 일수

    const days: { dayNumber: number | null; dateString: string | null }[] = [];

    // 첫 주 빈칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateString: null });
    }

    // 당월 일자 채우기
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${monthStr}-${dayStr}`;
      
      days.push({
        dayNumber: day,
        dateString
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="calendar-view glass-panel">
      {/* 달력 헤더 네비게이션 */}
      <div className="calendar-header">
        <button className="btn-icon" onClick={handlePrevMonth} title="이전 달">
          <ChevronLeft size={20} />
        </button>
        <h2 className="calendar-title">
          {currentYear}년 {currentMonth + 1}월
        </h2>
        <button className="btn-icon" onClick={handleNextMonth} title="다음 달">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 요일 행 */}
      <div className="calendar-weekdays-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="calendar-days-grid">
        {calendarDays.map((dayObj, index) => {
          if (dayObj.dayNumber === null || dayObj.dateString === null) {
            return <div key={`empty-${index}`} className="calendar-day empty"></div>;
          }

          const { dayNumber, dateString } = dayObj;
          const isSelected = dateString === selectedDate;
          
          // 해당 날짜에 작성된 일기 찾기
          const dayEntries = entries.filter(e => e.date === dateString);
          const hasEntry = dayEntries.length > 0;
          const primaryEntry = hasEntry ? dayEntries[0] : null;

          // 기분 필터에 따른 하이라이트 여부 결정
          let highlightClass = '';
          if (activeMoodFilter) {
            if (hasEntry && primaryEntry?.mood === activeMoodFilter) {
              highlightClass = 'highlight-active'; // 해당 기분의 일기 날짜 반짝임
            } else {
              highlightClass = 'highlight-dimmed'; // 필터 외 날짜는 반투명화
            }
          }

          // 오늘 날짜인지 판별
          const isTodayCell = 
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === dayNumber;

          return (
            <div
              key={dateString}
              className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isTodayCell ? 'today' : ''} ${hasEntry ? 'has-entry' : ''} ${highlightClass}`}
              onClick={() => onDateSelect(dateString)}
            >
              <span className="day-number">{dayNumber}</span>
              
              {/* 일기가 있으면 기분 이모지 렌더링 */}
              {hasEntry && primaryEntry && (
                <div className="cell-emoji-wrapper" title={`${dayEntries.length}개의 기록이 있습니다.`}>
                  <span className="cell-emoji">
                    {moodEmojis[primaryEntry.mood]}
                  </span>
                  {dayEntries.length > 1 && (
                    <span className="cell-entry-count">+{dayEntries.length - 1}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
