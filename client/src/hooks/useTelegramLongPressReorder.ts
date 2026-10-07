import { useState, useRef, useEffect, useCallback } from 'react';

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error') {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
      return;
    }
    if (navigator.vibrate) {
      if (type === 'selection') navigator.vibrate(10);
      else if (type === 'success') navigator.vibrate([18, 25, 18]);
      else navigator.vibrate(25);
    }
  } catch {}
}

interface UseTelegramLongPressReorderOptions<T extends { id: string }> {
  items: T[];
  onOrderChange?: (newItems: T[]) => void;
  onCommit?: (newItems: T[]) => void | Promise<void>;
  onReorder?: (newItems: T[]) => void | Promise<void>;
  enabled?: boolean;
  longPressDelay?: number;
}

export function useTelegramLongPressReorder<T extends { id: string }>({
  items,
  onOrderChange,
  onCommit,
  onReorder,
  enabled = true,
  longPressDelay = 280,
}: UseTelegramLongPressReorderOptions<T>) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const onOrderChangeRef = useRef(onOrderChange);
  onOrderChangeRef.current = onOrderChange;

  const commitHandler = onCommit || onReorder;
  const onCommitRef = useRef(commitHandler);
  onCommitRef.current = commitHandler;

  const isDraggingRef = useRef(false);
  const activeDragIdRef = useRef<string | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOrderIdsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const cloneElRef = useRef<HTMLElement | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const lastSwapTimeRef = useRef<number>(0);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupClone = useCallback(() => {
    if (cloneElRef.current) {
      cloneElRef.current.remove();
      cloneElRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (item: T, _index: number, clientX: number, clientY: number, element: HTMLElement) => {
      if (!enabled) return;
      cleanupTimer();

      startPosRef.current = { x: clientX, y: clientY };
      targetElementRef.current = element;
      suppressClickRef.current = false;

      timerRef.current = setTimeout(() => {
        // Long hold triggered!
        triggerHaptic('medium');
        isDraggingRef.current = true;
        activeDragIdRef.current = item.id;
        initialOrderIdsRef.current = itemsRef.current.map((it) => it.id);
        suppressClickRef.current = true;

        const rect = element.getBoundingClientRect();
        grabOffsetRef.current = {
          x: clientX - rect.left,
          y: clientY - rect.top,
        };

        // Create a visual clone of the card that floats seamlessly under the user's finger
        cleanupClone();
        const clone = element.cloneNode(true) as HTMLElement;
        clone.id = 'telegram-drag-floating-card';
        clone.style.position = 'fixed';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = '0';
        clone.style.zIndex = '999999';
        clone.style.pointerEvents = 'none';
        clone.style.transform = 'scale(1.05)';
        clone.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.32)';
        clone.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
        clone.style.opacity = '0.98';
        clone.style.boxSizing = 'border-box';
        document.body.appendChild(clone);
        cloneElRef.current = clone;

        setActiveDragId(item.id);
      }, longPressDelay);
    },
    [enabled, cleanupTimer, cleanupClone, longPressDelay]
  );

  const checkMidwayCollision = useCallback((cloneCenterX: number, cloneCenterY: number) => {
    const currentList = itemsRef.current;
    const currentId = activeDragIdRef.current;
    if (!currentId) return;

    const currentIdx = currentList.findIndex((it) => it.id === currentId);
    if (currentIdx === -1) return;

    const cardElements = document.querySelectorAll<HTMLElement>('[data-reorder-id]');
    if (!cardElements || cardElements.length === 0) return;

    for (let i = 0; i < cardElements.length; i++) {
      const el = cardElements[i];
      const targetId = el.getAttribute('data-reorder-id');
      if (!targetId || targetId === currentId) continue;

      const targetIdx = currentList.findIndex((it) => it.id === targetId);
      if (targetIdx === -1 || targetIdx === currentIdx) continue;

      const rect = el.getBoundingClientRect();
      // Check if center of floating card crosses midway into target card
      if (
        cloneCenterX >= rect.left - 4 &&
        cloneCenterX <= rect.right + 4 &&
        cloneCenterY >= rect.top - 8 &&
        cloneCenterY <= rect.bottom + 8
      ) {
        lastSwapTimeRef.current = Date.now();
        triggerHaptic('selection');

        // Record positions before reorder for smooth FLIP transition
        const prevRects = new Map<string, DOMRect>();
        cardElements.forEach((c) => {
          const cid = c.getAttribute('data-reorder-id');
          if (cid) prevRects.set(cid, c.getBoundingClientRect());
        });

        // Swap items in order
        const updated = [...currentList];
        const [moved] = updated.splice(currentIdx, 1);
        updated.splice(targetIdx, 0, moved);

        itemsRef.current = updated;
        onOrderChangeRef.current?.(updated);

        // Animate all other cards into their new positions
        requestAnimationFrame(() => {
          const refreshedCards = document.querySelectorAll<HTMLElement>('[data-reorder-id]');
          refreshedCards.forEach((c) => {
            const cid = c.getAttribute('data-reorder-id');
            if (!cid || cid === currentId) return;

            const prev = prevRects.get(cid);
            if (!prev) return;

            const current = c.getBoundingClientRect();
            const dx = prev.left - current.left;
            const dy = prev.top - current.top;

            if (dx !== 0 || dy !== 0) {
              c.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
              c.style.transition = 'none';

              requestAnimationFrame(() => {
                c.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)';
                c.style.transform = '';
              });
            }
          });
        });
        break;
      }
    }
  }, []);

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      // 1. Before long press triggers: cancel if finger moved > 12px (normal scroll)
      if (timerRef.current && startPosRef.current) {
        const dx = Math.abs(clientX - startPosRef.current.x);
        const dy = Math.abs(clientY - startPosRef.current.y);
        if (dx > 12 || dy > 12) {
          cleanupTimer();
        }
      }

      // 2. While dragging: move floating clone card in 1:1 real time
      if (isDraggingRef.current && cloneElRef.current) {
        const left = clientX - grabOffsetRef.current.x;
        const top = clientY - grabOffsetRef.current.y;
        cloneElRef.current.style.left = `${left}px`;
        cloneElRef.current.style.top = `${top}px`;
        cloneElRef.current.style.transition = 'none';

        const cloneRect = cloneElRef.current.getBoundingClientRect();
        const cloneCenterX = cloneRect.left + cloneRect.width / 2;
        const cloneCenterY = cloneRect.top + cloneRect.height / 2;

        const now = Date.now();
        if (now - lastSwapTimeRef.current > 40) {
          checkMidwayCollision(cloneCenterX, cloneCenterY);
        }
      }
    },
    [cleanupTimer, checkMidwayCollision]
  );

  const handlePointerUp = useCallback(() => {
    cleanupTimer();

    if (isDraggingRef.current) {
      const finalItems = itemsRef.current;
      const initialIds = initialOrderIdsRef.current;
      const finalIds = finalItems.map((it) => it.id);

      const hasChanged =
        initialIds.length === finalIds.length &&
        initialIds.some((id, i) => id !== finalIds[i]);

      const clone = cloneElRef.current;
      const activeId = activeDragIdRef.current;

      isDraggingRef.current = false;
      activeDragIdRef.current = null;
      startPosRef.current = null;
      targetElementRef.current = null;

      // Drop animation: glide clone into new slot
      if (clone && activeId) {
        const targetSlot = document.querySelector(`[data-reorder-id="${activeId}"]`);
        if (targetSlot) {
          const finalRect = targetSlot.getBoundingClientRect();
          clone.style.transition = 'all 0.18s cubic-bezier(0.2, 0, 0, 1)';
          clone.style.left = `${finalRect.left}px`;
          clone.style.top = `${finalRect.top}px`;
          clone.style.transform = 'scale(1)';
          clone.style.boxShadow = 'none';
        }
        setTimeout(() => {
          cleanupClone();
          setActiveDragId(null);
        }, 180);
      } else {
        cleanupClone();
        setActiveDragId(null);
      }

      if (hasChanged) {
        triggerHaptic('success');
        onCommitRef.current?.(finalItems);
      }

      // Suppress any synthetic clicks on release
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);
    }
  }, [cleanupTimer, cleanupClone]);

  useEffect(() => {
    const handleWindowTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        if (e.cancelable) {
          e.preventDefault(); // Stop native scrolling while dragging
        }
        if (e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      } else if (startPosRef.current && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleWindowTouchEnd = () => handlePointerUp();
    const handleWindowMouseUp = () => handlePointerUp();

    // Intercept click on window capture phase to completely prevent navigation on drag release
    const handleGlobalClickCapture = (e: MouseEvent) => {
      if (suppressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('click', handleGlobalClickCapture, true);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('click', handleGlobalClickCapture, true);
      cleanupClone();
    };
  }, [handlePointerMove, handlePointerUp, cleanupClone]);

  const getItemProps = useCallback(
    (itemOrIndex: T | number, maybeIndex?: number) => {
      let item: T;
      let index: number;

      if (typeof itemOrIndex === 'number') {
        index = itemOrIndex;
        item = itemsRef.current[index];
      } else {
        item = itemOrIndex;
        index = maybeIndex ?? itemsRef.current.findIndex((it) => it.id === item.id);
      }

      if (!item) {
        return {};
      }

      if (!enabled) {
        return {
          'data-reorder-id': item.id,
        };
      }

      const isCurrentActive = activeDragId === item.id;

      return {
        'data-reorder-id': item.id,
        onTouchStart: (e: React.TouchEvent) => {
          if (e.touches.length === 1) {
            handlePointerDown(item, index, e.touches[0].clientX, e.touches[0].clientY, e.currentTarget as HTMLElement);
          }
        },
        onMouseDown: (e: React.MouseEvent) => {
          if (e.button === 0) {
            handlePointerDown(item, index, e.clientX, e.clientY, e.currentTarget as HTMLElement);
          }
        },
        style: isCurrentActive
          ? {
              opacity: 0.25,
              transition: 'opacity 0.15s ease',
              touchAction: 'none' as const,
              WebkitTouchCallout: 'none' as const,
              userSelect: 'none' as const,
              WebkitUserSelect: 'none' as const,
            }
          : {
              touchAction: 'manipulation' as const,
              WebkitTouchCallout: 'none' as const,
              userSelect: 'none' as const,
              WebkitUserSelect: 'none' as const,
            },
      };
    },
    [enabled, activeDragId, handlePointerDown]
  );

  return {
    activeDragId,
    isDragging: !!activeDragId,
    getItemProps,
  };
}
