import type { DiaryEntry, DiaryStats, MoodType } from '../types';
import { getLocalStorageSpaceStatus } from '../utils/imageHelper';

const STORAGE_KEY = 'my_diary_entries';

// Helper to format date as YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Generates a beautiful gradient image to use as seed data
const generateSeedImage = (color1: string, color2: string, text: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 500);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);
    
    // Draw decorative circular glowing spots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(150, 120, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(650, 380, 180, 0, Math.PI * 2);
    ctx.fill();

    // Draw typography style text in the center
    ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, 400, 250);
  }
  return canvas.toDataURL('image/jpeg', 0.75);
};

// Create seed entries if localStorage is empty
const initializeSeedData = (): DiaryEntry[] => {
  const today = new Date();
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const seedEntries: DiaryEntry[] = [
    {
      id: 'seed-1',
      title: '아름다운 노을을 본 오늘 하루 🌅',
      content: '오늘 저녁 퇴근길에 하늘을 보았는데, 말도 안 되게 붉고 아름다운 노을이 펼쳐져 있었다. 잠시 멈춰 서서 사진을 찍고 멍하니 하늘을 바라보았다. 바쁜 일상 속에서도 이런 사소한 아름다움을 발견하고 느낄 수 있어 참 평화롭고 감사했던 하루.',
      date: formatDateStr(today),
      mood: 'peaceful',
      tags: ['일상', '노을', '평화'],
      images: [generateSeedImage('#ff9a9e', '#fecfef', 'Beautiful Sunset Evening')],
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    },
    {
      id: 'seed-2',
      title: '드디어 새로운 리액트 프로젝트 개발 시작! 💻',
      content: '오랫동안 구상해왔던 나만의 일기장 웹 앱 개발에 착수했다! Vite와 React, TypeScript 조합으로 구성했는데 초기 빌드 속도가 정말 빠르다. 다음에는 Supabase를 붙여서 클라우드 동기화와 GitHub 로그인까지 연동해봐야겠다. 신나고 설레는 작업이다.',
      date: formatDateStr(yesterday),
      mood: 'excited',
      tags: ['개발', '리액트', '코딩'],
      images: [generateSeedImage('#a1c4fd', '#c2e9fb', 'React Project Started!')],
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString()
    },
    {
      id: 'seed-3',
      title: '몸은 피곤하지만 뿌듯한 주말 대청소 🧹',
      content: '그동안 미뤄왔던 집안 대청소를 했다. 창문을 다 열고 이불 빨래도 돌리고, 책상 정리까지 싹 하고 나니 방이 정말 쾌적해졌다. 몸은 쑤시고 좀 지치지만, 깨끗해진 방을 보니 마음도 맑아지는 기분이다. 오늘 밤은 꿀잠을 잘 수 있을 것 같다.',
      date: formatDateStr(twoDaysAgo),
      mood: 'tired',
      tags: ['주말', '청소', '뿌듯'],
      images: [generateSeedImage('#fbc2eb', '#a6c1ee', 'Weekend House Cleaning')],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
  return seedEntries;
};

export const getEntries = (): DiaryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initializeSeedData();
    }
    const entries: DiaryEntry[] = JSON.parse(raw);
    // Sort by date descending, then by createdAt descending
    return entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (e) {
    console.error('Failed to parse diary entries from LocalStorage', e);
    return [];
  }
};

export const saveEntry = (entryData: Partial<DiaryEntry> & { title: string; content: string; date: string; mood: MoodType }): DiaryEntry => {
  const entries = getEntries();
  const nowStr = new Date().toISOString();

  let savedEntry: DiaryEntry;

  if (entryData.id) {
    // Edit existing entry
    const existingIndex = entries.findIndex(e => e.id === entryData.id);
    if (existingIndex > -1) {
      const existing = entries[existingIndex];
      savedEntry = {
        ...existing,
        ...entryData,
        updatedAt: nowStr
      } as DiaryEntry;
      entries[existingIndex] = savedEntry;
    } else {
      // If ID not found, treat as new (should not usually happen)
      savedEntry = {
        id: entryData.id,
        title: entryData.title,
        content: entryData.content,
        date: entryData.date,
        mood: entryData.mood,
        tags: entryData.tags || [],
        images: entryData.images || [],
        createdAt: nowStr,
        updatedAt: nowStr
      };
      entries.push(savedEntry);
    }
  } else {
    // Create new entry
    savedEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      title: entryData.title,
      content: entryData.content,
      date: entryData.date,
      mood: entryData.mood,
      tags: entryData.tags || [],
      images: entryData.images || [],
      createdAt: nowStr,
      updatedAt: nowStr
    };
    entries.push(savedEntry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return savedEntry;
};

export const deleteEntry = (id: string): void => {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getStats = (): DiaryStats => {
  const entries = getEntries();
  
  // Calculate mood counts
  const moodCounts: Record<MoodType, number> = {
    happy: 0,
    peaceful: 0,
    excited: 0,
    sad: 0,
    tired: 0,
    angry: 0
  };

  entries.forEach(entry => {
    if (moodCounts[entry.mood] !== undefined) {
      moodCounts[entry.mood]++;
    }
  });

  // Calculate streak (consecutive days)
  const uniqueDates = Array.from(new Set(entries.map(e => e.date))).sort((a, b) => b.localeCompare(a));
  
  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date();
    const todayStr = formatDateStr(today);
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);

    const latestDate = uniqueDates[0];
    
    // Streak only active if there is an entry today or yesterday
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      streak = 1;
      let checkDate = new Date(latestDate);
      
      // Look back for consecutive days
      for (let i = 0; i < uniqueDates.length; i++) {
        // Skip comparing first element with itself
        if (uniqueDates[i] === latestDate) continue;
        
        // Subtract one day from checkDate
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const expectedStr = formatDateStr(prevDate);
        
        if (uniqueDates.includes(expectedStr)) {
          streak++;
          checkDate = prevDate; // move check pointer back
        } else {
          break;
        }
      }
    }
  }

  // Get storage used
  const storageStatus = getLocalStorageSpaceStatus();

  return {
    totalEntries: entries.length,
    moodCounts,
    writingStreak: streak,
    storageUsedBytes: storageStatus.usedBytes
  };
};
