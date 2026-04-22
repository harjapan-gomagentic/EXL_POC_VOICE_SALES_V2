import { useRef, useEffect } from 'react';
export default function WaveformVisualizer({ analyserNode, isActive }: { analyserNode: AnalyserNode | null; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  useEffect(() => {
    if (!analyserNode || !isActive) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 120 * dpr; canvas.height = 44 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const buf = analyserNode.frequencyBinCount;
    const data = new Uint8Array(buf);
    const bars = 32, bw = 3, gap = (120 - bars * bw) / (bars - 1);
    const draw = () => {
      analyserNode.getByteFrequencyData(data);
      ctx.clearRect(0, 0, 120, 44);
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * buf)] / 255;
        const h = Math.max(v * 36, 3);
        ctx.beginPath(); ctx.roundRect(i * (bw + gap), 44 - h, bw, h, 1.5);
        ctx.fillStyle = '#00D4AA'; ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [analyserNode, isActive]);
  return <canvas ref={canvasRef} style={{ width: 120, height: 44, opacity: isActive ? 1 : 0, transition: 'opacity 200ms' }} />;
}
