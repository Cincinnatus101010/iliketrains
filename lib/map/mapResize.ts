/** Debounced map.resize — only when the container size actually changes. */
export function observeMapContainerResize(
  container: HTMLElement,
  onResize: () => void,
): () => void {
  let lastW = 0;
  let lastH = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const ro = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (!box) return;
    if (Math.abs(box.width - lastW) < 0.5 && Math.abs(box.height - lastH) < 0.5) {
      return;
    }
    lastW = box.width;
    lastH = box.height;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onResize();
    }, 80);
  });

  ro.observe(container);

  return () => {
    if (timer) clearTimeout(timer);
    ro.disconnect();
  };
}
