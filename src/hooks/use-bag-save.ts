import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { appStorage } from '../storage/appStorage';
import type { GameSave } from '../feature/user/user.type';

export function useBagSave() {
  const [save, setSave] = useState<GameSave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      // A retry starts a new focus load, including when the screen stays focused.
      void attempt;
      let active = true;
      setLoading(true);
      setError(null);
      appStorage
        .loadGame()
        .then((value) => {
          if (active) setSave(value);
        })
        .catch(() => {
          if (active)
            setError('저장 데이터를 불러오지 못했어요. 다시 시도해 주세요.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [attempt]),
  );
  return {
    save,
    setSave,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
