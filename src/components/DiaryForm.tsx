import React, { useState, useEffect, useRef } from 'react';
import type { DiaryEntry, MoodType } from '../types';
import { moodMeta } from './DiaryStats';
import { Image as ImageIcon, X, Sparkles, AlertCircle } from 'lucide-react';
import { compressImage, getBase64Size, formatBytes } from '../utils/imageHelper';

interface DiaryFormProps {
  initialEntry?: DiaryEntry | null;
  defaultDate?: string;
  onSave: (entry: Partial<DiaryEntry> & { title: string; content: string; date: string; mood: MoodType }) => void;
  onCancel: () => void;
}

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DRAFT_KEY = 'my_diary_draft';

export const DiaryForm: React.FC<DiaryFormProps> = ({
  initialEntry,
  defaultDate,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [date, setDate] = useState(initialEntry?.date || defaultDate || getLocalDateString());
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'happy');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>(initialEntry?.images || []);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for existing draft on mount (only for creating new entry)
  useEffect(() => {
    if (!initialEntry) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        setHasDraft(true);
      }
    }
  }, [initialEntry]);

  // Save draft whenever inputs change (only for creating new entry)
  useEffect(() => {
    if (!initialEntry) {
      // Only save if some contents are present
      if (title || content || tags.length > 0 || images.length > 0) {
        const draftData = { title, content, date, mood, tags, images };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      }
    }
  }, [title, content, date, mood, tags, images, initialEntry]);

  const restoreDraft = () => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setDate(draft.date || getLocalDateString());
        setMood(draft.mood || 'happy');
        setTags(draft.tags || []);
        setImages(draft.images || []);
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
    setHasDraft(false);
  };

  const deleteDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // Image upload handling
  const handleFiles = async (files: FileList) => {
    setIsCompressing(true);
    const compressedList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          // Compress image to max 800px width/height, 0.6 quality
          const base64 = await compressImage(file, 800, 0.6);
          compressedList.push(base64);
        } catch (err) {
          console.error('Image compression failed', err);
          alert(`이미지 압축에 실패했습니다: ${file.name}`);
        }
      }
    }

    if (compressedList.length > 0) {
      setImages(prev => [...prev, ...compressedList]);
    }
    setIsCompressing(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Tag editing handling
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/,/g, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags(prev => [...prev, cleanTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag if backspace pressed on empty input
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('일기 제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      alert('오늘의 일기 내용을 입력해 주세요.');
      return;
    }

    // Call onSave prop
    onSave({
      id: initialEntry?.id,
      title: title.trim(),
      content: content.trim(),
      date,
      mood,
      tags,
      images
    });

    // Clear draft storage
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="form-card glass-panel">
      {hasDraft && (
        <div 
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 20px', 
            borderRadius: '12px',
            backgroundColor: 'var(--primary-light)',
            borderColor: 'var(--primary)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--primary)' }} />
            <span>이전에 작성 중이던 임시 저장된 일기가 있습니다.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={restoreDraft}>
              불러오기
            </button>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={deleteDraft}>
              삭제
            </button>
          </div>
        </div>
      )}

      <div className="form-header-row">
        <h2 className="form-title gradient-text">
          {initialEntry ? '일기 수정하기' : '오늘의 하루 기록하기'}
        </h2>
        {!initialEntry && (
          <div className="draft-indicator">
            <Sparkles size={14} />
            <span>작성 시 실시간 자동 임시 저장됨</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="form-group-grid">
          {/* Title */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">제목</label>
            <input
              type="text"
              className="input-text"
              placeholder="오늘 하루를 한 줄로 요약해 주세요..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">날짜</label>
            <input
              type="date"
              className="input-text"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Mood Picker */}
        <div className="form-group">
          <label className="form-label">오늘의 기분</label>
          <div className="mood-picker-grid">
            {(Object.keys(moodMeta) as MoodType[]).map(key => {
              const meta = moodMeta[key];
              const isActive = mood === key;

              return (
                <button
                  key={key}
                  type="button"
                  className={`mood-select-btn ${key} ${isActive ? 'active' : ''}`}
                  onClick={() => setMood(key)}
                  style={!isActive ? { border: `1px solid var(--border-main)` } : {}}
                >
                  <span style={{ fontSize: '1.8rem', marginBottom: '2px' }}>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="form-group">
          <label className="form-label">일기 내용</label>
          <textarea
            className="input-text"
            style={{ minHeight: '180px', resize: 'vertical', lineHeight: '1.6' }}
            placeholder="오늘 어떤 일들이 있었나요? 기분과 생각을 자유롭게 적어주세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>

        {/* Image Upload Area */}
        <div className="form-group">
          <label className="form-label">사진 첨부</label>
          <div
            className={`file-uploader-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              style={{ display: 'none' }}
              accept="image/*"
              multiple
            />
            <ImageIcon size={32} className="uploader-icon" />
            <div className="uploader-text">
              {isCompressing 
                ? '이미지 압축 중...' 
                : '클릭하거나 여기에 사진을 끌어다 놓으세요'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (LocalStorage 저장 한계를 위해 자동으로 최적화 압축됩니다)
            </span>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((imgBase64, idx) => {
                const imgSize = getBase64Size(imgBase64);
                return (
                  <div key={idx} className="preview-container">
                    <img src={imgBase64} alt={`preview ${idx}`} className="preview-img" />
                    <button
                      type="button"
                      className="btn-remove-img"
                      onClick={() => removeImage(idx)}
                      title="사진 삭제"
                    >
                      <X size={12} />
                    </button>
                    <span className="compression-badge">{formatBytes(imgSize)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tag Input */}
        <div className="form-group">
          <label className="form-label">태그</label>
          <div className="tags-input-container">
            {tags.map(tag => (
              <span key={tag} className="tag-editor-badge">
                #{tag}
                <button
                  type="button"
                  className="btn-remove-tag"
                  onClick={() => removeTag(tag)}
                  title="태그 삭제"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              className="input-tag"
              placeholder={tags.length === 0 ? '태그 입력 후 Enter 또는 Space 누르기' : '추가...'}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="btn-primary">
            <span>저장하기</span>
          </button>
        </div>
      </form>
    </div>
  );
};
