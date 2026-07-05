'use client';

import { RefObject, useEffect } from 'react';

export function useDismissibleLayer(
  open: boolean,
  refOrRefs: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!open) return;

    // Meerdere refs mogelijk: de toggle-knop van een menu staat soms buiten het
    // paneel zelf (bv. hamburger/X in de navbar). Zonder uitzondering sluit de
    // outside-tap het menu op touchstart, waarna de click van de knop het
    // meteen weer opent — de knop lijkt dan kapot.
    const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const insideAny = refs.some((r) => r.current?.contains(target));
      if (!insideAny) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, onDismiss, refOrRefs]);
}
