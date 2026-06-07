import React, { useEffect } from 'react';
import type { DiaryEntry } from '../types';
import { moodMeta } from './DiaryStats';
import { X, Edit, Trash2, Calendar } from 'lucide-react';

interface DiaryDetailProps {
  entry: DiaryEntry;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const formatDetailDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
};

export const DiaryDetail: React.FC<DiaryDetailProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete
}) => {
  const meta = moodMeta[entry.mood] || moodMeta.happy;

  // Keydown listener for Escape and Scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling on the page body
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore scrolling
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDeleteClick = () => {
    if (window.confirm('정말로 이 일기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container glass-panel" 
        onClick={e => e.stopPropagation()}
        tabIndex={0}
      >
        {/* Images section */}
        {entry.images && entry.images.length > 0 ? (
          <div className="modal-header-image" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'thin' }}>
            {entry.images.map((imgBase64, idx) => (
              <img 
                key={idx}
                src={imgBase64} 
                alt={`${entry.title} - ${idx}`} 
                className="modal-img" 
                style={{ width: '100%', flexShrink: 0, scrollSnapAlign: 'start', objectFit: 'cover' }}
              />
            ))}
            
            <button className="btn-close-modal" onClick={onClose} title="닫기 (Esc)">
              <X size={20} />
            </button>
            
            {entry.images.length > 1 && (
              <span 
                style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  right: '16px', 
                  background: 'rgba(0,0,0,0.6)', 
                  color: 'white', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                1 / {entry.images.length} (좌우 스크롤)
              </span>
            )}
          </div>
        ) : (
          <div 
            style={{ 
              height: '80px', 
              position: 'relative', 
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '0 20px'
            }}
          >
            <button 
              className="btn-icon" 
              onClick={onClose} 
              title="닫기 (Esc)" 
              style={{ width: '36px', height: '36px' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Text body section */}
        <div className="modal-body">
          <div className="modal-meta">
            <div className="modal-date-mood">
              <span className="card-date" style={{ fontSize: '0.9rem' }}>
                <Calendar size={16} />
                {formatDetailDate(entry.date)}
              </span>
              <div className="modal-mood-badge" style={{ backgroundColor: meta.color }}>
                <span style={{ marginRight: '6px', fontSize: '1.1rem' }}>{meta.emoji}</span>
                <span>{meta.label}</span>
              </div>
            </div>
          </div>

          <h2 className="modal-title">{entry.title}</h2>

          <p className="modal-content-text">{entry.content}</p>

          {entry.tags.length > 0 && (
            <div className="card-tags" style={{ marginTop: '12px' }}>
              {entry.tags.map(tag => (
                <span 
                  key={tag} 
                  className="tag-badge" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="modal-actions">
            <button className="btn-danger" onClick={handleDeleteClick}>
              <Trash2 size={16} />
              <span>삭제하기</span>
            </button>
            <button className="btn-primary" onClick={onEdit}>
              <Edit size={16} />
              <span>수정하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
