"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore, type ChatMessage } from "./store";

export function useChatPersistence(projectDir: string | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadMessages = useAppStore((s) => s.loadMessages);
  const messages = useAppStore((s) => s.messages);
  const messagesLoaded = useAppStore((s) => s.messagesLoaded);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectDirRef = useRef(projectDir);

  // Track current projectDir for save callback
  projectDirRef.current = projectDir;

  // Load on mount / project change
  useEffect(() => {
    setIsLoaded(false);

    if (!projectDir) {
      loadMessages([]);
      setIsLoaded(true);
      return;
    }

    const api = window.electronAPI;
    if (!api?.loadChatHistory) {
      // Dev mode without Electron — mark as loaded with empty
      loadMessages([]);
      setIsLoaded(true);
      return;
    }

    api
      .loadChatHistory(projectDir)
      .then((msgs) => {
        loadMessages((msgs || []) as ChatMessage[]);
        setIsLoaded(true);
      })
      .catch(() => {
        loadMessages([]);
        setIsLoaded(true);
      });
  }, [projectDir, loadMessages]);

  // Save on messages change (debounced)
  useEffect(() => {
    if (!messagesLoaded) return;
    if (!projectDirRef.current) return;

    const api = window.electronAPI;
    if (!api?.saveChatHistory) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const dir = projectDirRef.current;
    saveTimerRef.current = setTimeout(() => {
      api.saveChatHistory!(dir, messages);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, messagesLoaded]);

  return { isLoaded };
}
