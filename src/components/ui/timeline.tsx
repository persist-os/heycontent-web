import React, { useRef, useState, useEffect } from "react";

type TimelineClip = {
  id: string;
  type: 'video' | 'audio' | 'effect';
  start: number;
  end: number;
  src?: string;
  effectType?: string;
  thumbnail?: string;
};

type TimelineProps = {
  clips: TimelineClip[];
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
};

const MIN_PIXELS_PER_SECOND = 20;
const MAX_PIXELS_PER_SECOND = 100;
const DEFAULT_PIXELS_PER_SECOND = 40;
const SNAP_INTERVAL = 1; // seconds
const MIN_CLIP_LENGTH = 0.2;

// Brand colors
const BRAND_ACCENT = "#a259ff"; // purple/magenta
const BRAND_GRADIENT = "linear-gradient(90deg, #a259ff 0%, #f58529 100%)";
const AUDIO_COLOR = "#e0e7ff";
const EFFECT_COLOR = "#ffe0f0";
const BG_DARK = "#fff"; // White background
const BG_TRACK = "#f3f4f6"; // Light gray for tracks
const BG_CLIP = "#f1f5f9"; // Even lighter for clips
const BORDER_COLOR = "#e5e7eb"; // Light border

export const Timeline: React.FC<TimelineProps> = ({ clips, setClips }) => {
  const [dragging, setDragging] = useState<null | { id: string; offset: number }> (null);
  const [resizing, setResizing] = useState<null | { id: string; edge: 'left' | 'right'; startX: number; origStart: number; origEnd: number }> (null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadDrag = useRef(false);

  // Calculate timeline length (furthest end, rounded up)
  const timelineLength = Math.max(10, Math.ceil(Math.max(0, ...clips.map(c => c.end))));
  const rulerMarks = Array.from({ length: timelineLength + 1 }, (_, i) => i);

  // Snapping helper
  const getSnap = (val: number, excludeId?: string) => {
    let snapPoints = rulerMarks.map(t => t * 1);
    clips.forEach(c => {
      if (c.id !== excludeId) {
        snapPoints.push(c.start, c.end);
      }
    });
    let closest = snapPoints.reduce((a, b) => Math.abs(b - val) < Math.abs(a - val) ? b : a, val);
    return Math.abs(closest - val) < 0.15 ? closest : val;
  };

  // Mouse move/leave/up handlers for drag/resize/playhead
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setClips(prev => prev.map(clip => {
          if (clip.id !== dragging.id) return clip;
          let newStart = Math.max(0, (e.clientX - dragging.offset) / pixelsPerSecond);
          let duration = clip.end - clip.start;
          let snapped = getSnap(newStart, clip.id);
          return { ...clip, start: snapped, end: snapped + duration };
        }));
      } else if (resizing) {
        setClips(prev => prev.map(clip => {
          if (clip.id !== resizing.id) return clip;
          let delta = (e.clientX - resizing.startX) / pixelsPerSecond;
          if (resizing.edge === 'left') {
            let newStart = Math.max(0, resizing.origStart + delta);
            if (newStart >= clip.end - MIN_CLIP_LENGTH) newStart = clip.end - MIN_CLIP_LENGTH;
            let snapped = getSnap(newStart, clip.id);
            return { ...clip, start: snapped };
          } else {
            let newEnd = Math.max(clip.start + MIN_CLIP_LENGTH, resizing.origEnd + delta);
            let snapped = getSnap(newEnd, clip.id);
            return { ...clip, end: snapped };
          }
        }));
      } else if (playheadDrag.current && scrollRef.current) {
        const rect = scrollRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let t = Math.max(0, Math.min(timelineLength, x / pixelsPerSecond));
        setCurrentTime(t);
      }
    };
    const onMouseUp = () => {
      setDragging(null);
      setResizing(null);
      playheadDrag.current = false;
    };
    if (dragging || resizing || playheadDrag.current) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [dragging, resizing, setClips, pixelsPerSecond, timelineLength]);

  // Playback animation
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const step = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      setCurrentTime(t => {
        let next = t + dt;
        if (next >= timelineLength) {
          setPlaying(false);
          return timelineLength;
        }
        return next;
      });
      if (playing) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, timelineLength]);

  // Remove a clip
  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  // Render a clip block with drag/resize and visuals
  const renderClip = (clip: TimelineClip) => {
    const width = (clip.end - clip.start) * pixelsPerSecond;
    const left = clip.start * pixelsPerSecond;
    let className = "absolute h-7 rounded-lg cursor-pointer flex items-center text-xs font-bold select-none shadow-md transition-transform duration-75 ";
    let style: React.CSSProperties = { width, left, top: 2, background: BG_CLIP, color: '#111' };
    if (clip.type === 'video') {
      style.background = BRAND_GRADIENT;
      className += " text-white hover:brightness-110 border-2 border-[#a259ff]/40 ";
    }
    if (clip.type === 'audio') {
      style.background = AUDIO_COLOR;
      className += " text-black hover:brightness-110 border-2 border-[#4f8cff]/40 ";
    }
    if (clip.type === 'effect') {
      style.background = EFFECT_COLOR;
      className += " text-black hover:brightness-110 border-2 border-[#ff7eb3]/40 ";
    }
    return (
      <div
        key={clip.id}
        className={className}
        style={style}
        onMouseDown={e => {
          if ((e.target as HTMLElement).classList.contains('resize-handle') || (e.target as HTMLElement).classList.contains('remove-btn')) return;
          setDragging({ id: clip.id, offset: e.clientX - left });
        }}
      >
        {/* Left resize handle */}
        <span
          className="resize-handle w-2 h-7 bg-black/10 cursor-ew-resize mr-1 rounded-l-lg hover:bg-black/20"
          onMouseDown={e => {
            e.stopPropagation();
            setResizing({ id: clip.id, edge: 'left', startX: e.clientX, origStart: clip.start, origEnd: clip.end });
          }}
        />
        {/* Visuals */}
        {clip.type === 'video' && (
          <>
            {clip.thumbnail ? (
              <img src={clip.thumbnail} alt="thumb" className="h-5 w-8 object-cover rounded mr-1" />
            ) : (
              <span className="h-5 w-8 bg-black/10 rounded mr-1 flex items-center justify-center text-xs">🎬</span>
            )}
            <span className="drop-shadow">Video</span>
          </>
        )}
        {clip.type === 'audio' && (
          <>
            <span className="h-5 w-8 bg-black/10 rounded mr-1 flex items-center justify-center text-xs">🔊</span>
            <span className="drop-shadow">Audio</span>
            {/* Improved placeholder waveform */}
            <svg className="ml-1" width="40" height="8" viewBox="0 0 40 8">
              <polyline points="0,4 4,2 8,6 12,2 16,7 20,1 24,6 28,2 32,7 36,3 40,4" fill="none" stroke="#222" strokeWidth="2" />
            </svg>
          </>
        )}
        {clip.type === 'effect' && (
          <>
            <span className="h-5 w-8 bg-black/10 rounded mr-1 flex items-center justify-center text-xs">✨</span>
            <span className="drop-shadow">{clip.effectType || 'Effect'}</span>
          </>
        )}
        {/* Remove button */}
        <button
          className="remove-btn ml-2 text-xs text-white bg-[#ff7eb3] rounded px-1 hover:bg-[#ff4f81] transition-colors"
          onClick={e => {
            e.stopPropagation();
            removeClip(clip.id);
          }}
        >
          ×
        </button>
        {/* Right resize handle */}
        <span
          className="resize-handle w-2 h-7 bg-black/10 cursor-ew-resize ml-1 rounded-r-lg hover:bg-black/20"
          onMouseDown={e => {
            e.stopPropagation();
            setResizing({ id: clip.id, edge: 'right', startX: e.clientX, origStart: clip.start, origEnd: clip.end });
          }}
        />
      </div>
    );
  };

  // Add new clip buttons
  const addClip = (type: 'video' | 'audio' | 'effect') => {
    const id = Math.random().toString(36).slice(2, 9);
    const base = { id, start: 0, end: 3 };
    if (type === 'video') setClips(prev => [...prev, { ...base, type: 'video', src: '', thumbnail: '' }]);
    if (type === 'audio') setClips(prev => [...prev, { ...base, type: 'audio', src: '' }]);
    if (type === 'effect') setClips(prev => [...prev, { ...base, type: 'effect', effectType: 'fade-in' }]);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setPixelsPerSecond(prev => {
      let next = prev + delta;
      if (next < MIN_PIXELS_PER_SECOND) next = MIN_PIXELS_PER_SECOND;
      if (next > MAX_PIXELS_PER_SECOND) next = MAX_PIXELS_PER_SECOND;
      return next;
    });
  };

  // Playback controls
  const handlePlayPause = () => setPlaying(p => !p);
  const handleJump = (to: 'start' | 'end') => {
    setCurrentTime(to === 'start' ? 0 : timelineLength);
    setPlaying(false);
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let t = Math.max(0, Math.min(timelineLength, x / pixelsPerSecond));
    setCurrentTime(t);
  };

  // Format time (e.g. 1:23)
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
  };

  // Playhead position
  const playheadX = currentTime * pixelsPerSecond;

  return (
    <div className="w-full rounded-xl shadow-lg p-4" style={{ background: BG_DARK }}>
      {/* Timeline Header */}
      <div className="flex items-center mb-2 gap-2">
        <span className="text-black font-semibold text-lg">Timeline</span>
        <button className="ml-4 px-2 py-1 bg-[#a259ff] text-white rounded-md text-xs font-semibold hover:bg-[#b47aff] transition-colors" onClick={() => addClip('video')}>+ Video</button>
        <button className="px-2 py-1 bg-[#4f8cff] text-black rounded-md text-xs font-semibold hover:bg-[#7ab8ff] transition-colors" onClick={() => addClip('audio')}>+ Audio</button>
        <button className="px-2 py-1 bg-[#ff7eb3] text-black rounded-md text-xs font-semibold hover:bg-[#ff4f81] transition-colors" onClick={() => addClip('effect')}>+ Effect</button>
        <div className="flex-1" />
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 bg-[#f3f4f6] text-black rounded-md text-xs hover:bg-[#e5e7eb] transition-colors"
            onClick={() => handleZoom(-10)}
            aria-label="Zoom out"
            disabled={pixelsPerSecond <= MIN_PIXELS_PER_SECOND}
          >
            -
          </button>
          <span className="text-xs text-black w-10 text-center">Zoom</span>
          <button
            className="px-2 py-1 bg-[#f3f4f6] text-black rounded-md text-xs hover:bg-[#e5e7eb] transition-colors"
            onClick={() => handleZoom(10)}
            aria-label="Zoom in"
            disabled={pixelsPerSecond >= MAX_PIXELS_PER_SECOND}
          >
            +
          </button>
        </div>
        {/* Playback controls */}
        <div className="flex items-center gap-1 ml-4">
          <button className="px-2 py-1 bg-[#f3f4f6] text-black rounded-md text-xs hover:bg-[#e5e7eb] transition-colors" onClick={() => handleJump('start')} title="Jump to start">⏮</button>
          <button className="px-2 py-1 bg-[#f3f4f6] text-black rounded-md text-xs hover:bg-[#e5e7eb] transition-colors" onClick={handlePlayPause} title="Play/Pause">{playing ? '⏸' : '▶️'}</button>
          <button className="px-2 py-1 bg-[#f3f4f6] text-black rounded-md text-xs hover:bg-[#e5e7eb] transition-colors" onClick={() => handleJump('end')} title="Jump to end">⏭</button>
          <span className="text-xs text-black w-12 text-center">{formatTime(currentTime)} / {formatTime(timelineLength)}</span>
        </div>
      </div>
      {/* Scrollable Timeline */}
      <div className="overflow-x-auto w-full" ref={scrollRef} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Time Ruler */}
        <div className="relative flex items-center h-8 mb-2 ml-24 rounded-t-lg" style={{ width: timelineLength * pixelsPerSecond, minWidth: 320, background: BG_TRACK, borderBottom: `1.5px solid ${BORDER_COLOR}` }} onClick={handleSeek}>
          {rulerMarks.map((t, i) => (
            <div key={i} className="absolute top-0" style={{ left: t * pixelsPerSecond }}>
              <div className="w-px h-4" style={{ background: BORDER_COLOR }} />
              <div className="text-xs text-black" style={{ marginLeft: -8 }}>{t}s</div>
            </div>
          ))}
          <div className="absolute top-0 left-0 w-full h-px" style={{ background: BORDER_COLOR }} />
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-1 z-30 cursor-pointer"
            style={{ left: playheadX, background: BRAND_ACCENT, borderRadius: 2 }}
            onMouseDown={e => { playheadDrag.current = true; e.stopPropagation(); }}
          >
            <div className="w-4 h-4" style={{ background: BRAND_ACCENT, borderRadius: '50%', position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', border: '2px solid #fff', boxShadow: '0 2px 8px #a259ff44' }} />
          </div>
        </div>
        {/* Tracks */}
        <div className="space-y-2" ref={timelineRef} style={{ position: 'relative', width: timelineLength * pixelsPerSecond, minWidth: 320 }}>
          {/* Playhead on tracks */}
          <div
            className="absolute top-0 bottom-0 w-1 z-30 pointer-events-none"
            style={{ left: playheadX, background: BRAND_ACCENT, borderRadius: 2, height: '100%' }}
          />
          {/* Video Track */}
          <div className="relative flex items-center h-10 rounded-lg border-b" style={{ background: BG_TRACK, borderColor: BORDER_COLOR }}>
            <span className="w-24 text-xs text-black px-2 font-semibold">Video</span>
            <div className="flex-1 relative h-7 mx-2">
              {clips.filter(c => c.type === 'video').map(renderClip)}
            </div>
          </div>
          {/* Audio Track */}
          <div className="relative flex items-center h-10 rounded-lg border-b" style={{ background: BG_TRACK, borderColor: BORDER_COLOR }}>
            <span className="w-24 text-xs text-black px-2 font-semibold">Audio</span>
            <div className="flex-1 relative h-7 mx-2">
              {clips.filter(c => c.type === 'audio').map(renderClip)}
            </div>
          </div>
          {/* Effects Track */}
          <div className="relative flex items-center h-10 rounded-lg" style={{ background: BG_TRACK }}>
            <span className="w-24 text-xs text-black px-2 font-semibold">Effects</span>
            <div className="flex-1 relative h-7 mx-2">
              {clips.filter(c => c.type === 'effect').map(renderClip)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline; 