import type { DiaryEntry, DiaryStats, MoodType } from '../types';
import { supabase } from './supabaseClient';

// 로컬 시간 기준 YYYY-MM-DD 문자열 생성
const formatDateStr = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 캔버스 기반의 예제 이미지 생성
const generateSeedImageBlob = (color1: string, color2: string, text: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 800, 500);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 500);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(150, 120, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(650, 380, 180, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.fillText(text, 400, 250);
    }
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.75);
  });
};

// Base64 이미지를 Blob으로 변환하여 Supabase Storage에 업로드
const uploadImages = async (images: string[]): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (const img of images) {
    if (img.startsWith('data:image/')) {
      try {
        const response = await fetch(img);
        const blob = await response.blob();
        
        const mimeType = img.substring(img.indexOf(':') + 1, img.indexOf(';'));
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)}.${ext}`;

        const { error } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, blob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('스토리지 업로드 실패:', error);
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from('diary-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      } catch (err) {
        console.error('이미지 업로드 중 오류 발생:', err);
        throw err;
      }
    } else {
      uploadedUrls.push(img);
    }
  }

  return uploadedUrls;
};

// 특정 사용자 전용 씨드 데이터 자동 입력
const initializeSeedData = async (userId: string): Promise<DiaryEntry[]> => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const seeds = [
    {
      title: '아름다운 노을을 본 오늘 하루 🌅',
      content: '오늘 저녁 퇴근길에 하늘을 보았는데, 말도 안 되게 붉고 아름다운 노을이 펼쳐져 있었다. 잠시 멈춰 서서 사진을 찍고 멍하니 하늘을 바라보았다. 바쁜 일상 속에서도 이런 사소한 아름다움을 발견하고 느낄 수 있어 참 평화롭고 감사했던 하루.',
      date: formatDateStr(today),
      mood: 'peaceful' as MoodType,
      tags: ['일상', '노을', '평화'],
      color1: '#ff9a9e', color2: '#fecfef', text: 'Beautiful Sunset Evening'
    },
    {
      title: '드디어 새로운 리액트 프로젝트 개발 시작! 💻',
      content: '오랫동안 구상해왔던 나만의 일기장 웹 앱 개발에 착수했다! Vite와 React, TypeScript 조합으로 구성했는데 초기 빌드 속도가 정말 빠르다. 다음에는 Supabase를 붙여서 클라우드 동기화와 GitHub 로그인까지 연동해봐야겠다. 신나고 설레는 작업이다.',
      date: formatDateStr(yesterday),
      mood: 'excited' as MoodType,
      tags: ['개발', '리액트', '코딩'],
      color1: '#a1c4fd', color2: '#c2e9fb', text: 'React Project Started!'
    },
    {
      title: '몸은 피곤하지만 뿌듯한 주말 대청소 🧹',
      content: '그동안 미뤄왔던 집안 대청소를 했다. 창문을 다 열고 이불 빨래도 돌리고, 책상 정리까지 싹 하고 나니 방이 정말 쾌적해졌다. 몸은 쑤시고 좀 지치지만, 깨끗해진 방을 보니 마음도 맑아지는 기분이다. 오늘 밤은 꿀잠을 잘 수 있을 것 같다.',
      date: formatDateStr(twoDaysAgo),
      mood: 'tired' as MoodType,
      tags: ['주말', '청소', '뿌듯'],
      color1: '#fbc2eb', color2: '#a6c1ee', text: 'Weekend House Cleaning'
    }
  ];

  const createdEntries: DiaryEntry[] = [];

  for (const seed of seeds) {
    try {
      const blob = await generateSeedImageBlob(seed.color1, seed.color2, seed.text);
      const fileName = `${Math.random().toString(36).substring(2, 9)}.jpg`;

      await supabase.storage
        .from('diary-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      const { data: publicUrlData } = supabase.storage
        .from('diary-photos')
        .getPublicUrl(fileName);

      // 데이터 삽입 시 user_id 필드에 로그인 유저 식별자 주입
      const { data, error } = await supabase
        .from('diaries')
        .insert([{
          title: seed.title,
          content: seed.content,
          date: seed.date,
          mood: seed.mood,
          tags: seed.tags,
          images: [publicUrlData.publicUrl],
          user_id: userId
        }])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const item = data[0];
        createdEntries.push({
          id: item.id,
          title: item.title,
          content: item.content,
          date: item.date,
          mood: item.mood as MoodType,
          tags: item.tags || [],
          images: item.images || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at
        });
      }
    } catch (e) {
      console.error('씨드 데이터를 생성하지 못했습니다:', e);
    }
  }

  return createdEntries;
};

// 특정 유저의 모든 일기 조회 (user_id 필터링 적용)
export const getEntries = async (userId: string): Promise<DiaryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase 데이터 로드 에러:', error);
      return [];
    }

    // 로그인 유저의 글이 0개이면 해당 유저 전용 최초 씨드 데이터 생성
    if (!data || data.length === 0) {
      return await initializeSeedData(userId);
    }

    return data.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      date: item.date,
      mood: item.mood as MoodType,
      tags: item.tags || [],
      images: item.images || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (e) {
    console.error('데이터 조회 오류:', e);
    return [];
  }
};

// 특정 유저의 일기 저장 및 수정 (user_id 주입)
export const saveEntry = async (
  entryData: Partial<DiaryEntry> & { title: string; content: string; date: string; mood: MoodType },
  userId: string
): Promise<DiaryEntry> => {
  const imageUrls = await uploadImages(entryData.images || []);

  const dbData = {
    title: entryData.title,
    content: entryData.content,
    date: entryData.date,
    mood: entryData.mood,
    tags: entryData.tags || [],
    images: imageUrls,
    user_id: userId, // 소유권 설정
    updated_at: new Date().toISOString()
  };

  let data, error;

  if (entryData.id) {
    const response = await supabase
      .from('diaries')
      .update(dbData)
      .eq('id', entryData.id)
      .select();
    data = response.data;
    error = response.error;
  } else {
    const response = await supabase
      .from('diaries')
      .insert([dbData])
      .select();
    data = response.data;
    error = response.error;
  }

  if (error) {
    console.error('데이터 저장 실패:', error);
    throw error;
  }

  const saved = data![0];
  return {
    id: saved.id,
    title: saved.title,
    content: saved.content,
    date: saved.date,
    mood: saved.mood as MoodType,
    tags: saved.tags || [],
    images: saved.images || [],
    createdAt: saved.created_at,
    updatedAt: saved.updated_at
  };
};

// 일기 삭제
export const deleteEntry = async (id: string): Promise<void> => {
  const { data: entry, error: selectError } = await supabase
    .from('diaries')
    .select('images')
    .eq('id', id)
    .single();

  if (selectError) {
    console.error('삭제 대상 데이터 조회 실패:', selectError);
  }

  const { error: deleteError } = await supabase
    .from('diaries')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('데이터 삭제 실패:', deleteError);
    throw deleteError;
  }

  if (entry && entry.images && entry.images.length > 0) {
    const filesToRemove: string[] = [];
    
    entry.images.forEach((url: string) => {
      if (url.includes('/diary-photos/')) {
        const fileName = url.split('/diary-photos/')[1];
        if (fileName) {
          filesToRemove.push(fileName);
        }
      }
    });

    if (filesToRemove.length > 0) {
      const { error: storageRemoveError } = await supabase.storage
        .from('diary-photos')
        .remove(filesToRemove);
      
      if (storageRemoveError) {
        console.error('스토리지 파일 정리 에러:', storageRemoveError);
      }
    }
  }
};

// 특정 사용자의 통계 산출
export const getStats = async (userId: string): Promise<DiaryStats> => {
  const entries = await getEntries(userId);

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

  const uniqueDates = Array.from(new Set(entries.map(e => e.date))).sort((a, b) => b.localeCompare(a));
  
  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date();
    const todayStr = formatDateStr(today);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);

    const latestDate = uniqueDates[0];
    
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      streak = 1;
      let checkDate = new Date(latestDate);
      
      for (let i = 0; i < uniqueDates.length; i++) {
        if (uniqueDates[i] === latestDate) continue;
        
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const expectedStr = formatDateStr(prevDate);
        
        if (uniqueDates.includes(expectedStr)) {
          streak++;
          checkDate = prevDate;
        } else {
          break;
        }
      }
    }
  }

  const databaseFootprintBytes = new Blob([JSON.stringify(entries)]).size;

  return {
    totalEntries: entries.length,
    moodCounts,
    writingStreak: streak,
    storageUsedBytes: databaseFootprintBytes
  };
};
