import React from 'react';
import type { DiaryEntry, MoodType } from '../types';
import { moodMeta } from './DiaryStats';
import { Calendar } from 'lucide-react';

interface DiaryCardProps {
  entry: DiaryEntry;
  onClick: () => void;
}

const getMoodGradient = (mood: MoodType): string => {
  switch (mood) {
    case 'happy': return 'linear-gradient(135deg, #ffb703 0%, #ffdf6d 100%)';
    case 'peaceful': return 'linear-gradient(135deg, #2ec4b6 0%, #cbf3f0 100%)';
    case 'excited': return 'linear-gradient(135deg, #ff006e 0%, #ff85a1 100%)';
    case 'sad': return 'linear-gradient(135deg, #0077b6 0%, #90e0ef 100%)';
    case 'tired': return 'linear-gradient(135deg, #7209b7 0%, #b5179e 100%)';
    case 'angry': return 'linear-gradient(135deg, #e63946 0%, #ff8080 100%)';
    default: return 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
  }
};

const formatCardDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
};

export const DiaryCard: React.FC<DiaryCardProps> = ({ entry, onClick }) => {
  const meta = moodMeta[entry.mood] || moodMeta.happy;
  const hasCover = entry.images && entry.images.length > 0;
  const coverImage = hasCover ? entry.images[0] : null;

  return (
    <article className="diary-card glass-panel" onClick={onClick} style={{ minHeight: '350px' }}>
      <div className="card-image-wrapper">
        {hasCover ? (
          <img src={coverImage!} alt={entry.title} className="card-img" />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              background: getMoodGradient(entry.mood),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            {/* Lucide 아이콘 대신 큰 감정 이모지 렌더링 */}
            <span style={{ fontSize: '3rem' }}>{meta.emoji}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', opacity: 0.9 }}>
              {meta.label}의 하루
            </span>
          </div>
        )}
        <div className="card-mood-badge" style={{ backgroundColor: meta.color }}>
          <span style={{ marginRight: '4px' }}>{meta.emoji}</span>
          <span>{meta.label}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-date">
          <Calendar size={13} />
          <span>{formatCardDate(entry.date)}</span>
        </div>

        <h3 className="card-title">{entry.title}</h3>
        
        <p className="card-text">{entry.content}</p>

        {entry.tags.length > 0 && (
          <div className="card-tags">
            {entry.tags.map(tag => (
              <span key={tag} className="tag-badge">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
