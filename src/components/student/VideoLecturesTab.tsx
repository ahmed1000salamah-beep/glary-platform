import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ShieldAlert, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Sparkles,
  FastForward,
  Move,
  Maximize2
} from 'lucide-react';
import { LessonVideo } from '../../types';

export function getVideoSourceInfo(url: string = '') {
  if (!url) {
    return {
      isEmbed: false,
      embedUrl: '',
      directUrl: '',
      type: 'direct'
    };
  }

  const cleanUrl = url.trim();

  // 1. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    } else if (cleanUrl.includes('youtube.com/watch')) {
      const match = cleanUrl.match(/v=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) videoId = match[1];
    } else if (cleanUrl.includes('youtube.com/embed/')) {
      videoId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    }
    if (videoId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`,
        directUrl: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'youtube'
      };
    }
  }

  // 2. Google Drive
  if (cleanUrl.includes('drive.google.com')) {
    let fileId = '';
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) fileId = match[1];
    if (fileId) {
      return {
        isEmbed: true,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `https://drive.google.com/file/d/${fileId}/view`,
        type: 'gdrive'
      };
    }
  }

  // 3. Vimeo
  if (cleanUrl.includes('vimeo.com')) {
    const match = cleanUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (match && match[1]) {
      return {
        isEmbed: true,
        embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&playsinline=1`,
        directUrl: `https://vimeo.com/${match[1]}`,
        type: 'vimeo'
      };
    }
  }

  // 4. Direct video file
  return {
    isEmbed: false,
    embedUrl: cleanUrl,
    directUrl: cleanUrl,
    type: 'direct'
  };
}

interface Props {
  videos: LessonVideo[];
  studentName: string;
  studentCode: string;
  studentPhone?: string;
  onSendToast: (title: string, body: string) => void;
}

export const VideoLecturesTab: React.FC<Props> = ({
  videos,
  studentName,
  studentCode,
  studentPhone,
  onSendToast
}) => {
  const [selectedVideo, setSelectedVideo] = useState<LessonVideo>(videos[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(selectedVideo ? selectedVideo.durationMinutes * 60 : 5400); // 90 mins default
  const [watermarkPos, setWatermarkPos] = useState({ top: '25%', left: '25%' });
  const [copyWarning, setCopyWarning] = useState<string | null>(null);

  // Video Zoom Level (1x, 1.25x, 1.5x, 1.75x, 2x, 2.5x, 3x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCoverFit, setIsCoverFit] = useState(false); // Fill viewport mode (ملء الإطار بدون حواف سوداء)
  const [videoRotation, setVideoRotation] = useState<0 | 90 | 180 | 270>(0); // Video orientation degrees

  // Pan / Drag coordinates when zoomed in (تحريك وسحب الفيديو أثناء التكبير)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Available speeds
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const videoSource = getVideoSourceInfo(selectedVideo?.videoUrl);

  // Floating Anti-Recording Watermark (Smoothly glides across screen with student data)
  useEffect(() => {
    const updatePosition = () => {
      const randomTop = Math.floor(Math.random() * 60) + 15;
      const randomLeft = Math.floor(Math.random() * 55) + 10;
      setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
    };
    updatePosition();
    const interval = setInterval(updatePosition, 7000);
    return () => clearInterval(interval);
  }, []);

  // Screen orientation change listener - Auto-rotate video when device rotates
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches || 
        (window.screen?.orientation && window.screen.orientation.type.includes('landscape'));
      
      if (isLandscape) {
        setIsCoverFit(true);
        onSendToast('الوضع الأفقي 📱↔️', 'تم تدوير وتكييف شاشة الفيديو مع إمالة الجهاز تلقائياً');
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active && window.screen?.orientation && 'lock' in window.screen.orientation) {
        try {
          (window.screen.orientation as any).lock('landscape').catch(() => {});
        } catch {
          // Ignore orientation lock restrictions if not allowed by browser
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update speed on video element when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Keyboard controls for seeking & zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video container has focus or is playing
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(10); // Forward 10s
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(-10); // Rewind 10s
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'w') {
        e.preventDefault();
        toggleCoverFit();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, zoomLevel]);

  // Handle video switch
  const handleSelectVideo = (vid: LessonVideo) => {
    setSelectedVideo(vid);
    setIsPlaying(false);
    setCurrentTime(0);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setDuration(vid.durationMinutes * 60);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(true);
      });
    }
  };

  // Seek forward or backward
  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    onSendToast(
      seconds > 0 ? 'تقديم الفيديو ⏩' : 'ترجيع الفيديو ⏪',
      seconds > 0 ? `تم تقديم الفيديو بمقدار ${seconds} ثوانٍ` : `تم ترجيع الفيديو بمقدار ${Math.abs(seconds)} ثوانٍ`
    );
  };

  // Zoom In (تكبير)
  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(3.5, Number((prev + 0.25).toFixed(2)));
      onSendToast('تكبير الفيديو 🔍', `تم تكبير الشاشة إلى ${Math.round(next * 100)}% - يمكنك سحب الفيديو للتحريك`);
      return next;
    });
  };

  // Zoom Out (تصغير)
  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.75, Number((prev - 0.25).toFixed(2)));
      if (next <= 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
      onSendToast('تصغير الفيديو 🔎', `تم تصغير الشاشة إلى ${Math.round(next * 100)}%`);
      return next;
    });
  };

  // Reset Zoom & Pan
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsCoverFit(false);
    onSendToast('إعادة ضبط حجم الشاشة ↺', 'تم استعادة الحجم الطبيعي 100% والموضع الأصلي');
  };

  // Toggle Fill/Fit Mode (ملء الإطار لمسح الحواف السوداء)
  const toggleCoverFit = () => {
    setIsCoverFit(prev => {
      const next = !prev;
      onSendToast(
        next ? 'ملء إطار الشاشة ⛶' : 'ملاءمة الفيديو الطبيعية 🗖',
        next ? 'تم تمديد الفيديو لملء كامل الشاشة' : 'تم استعادة التناسب القياسي للفيديو'
      );
      return next;
    });
  };

  // Toggle Video Orientation / Rotation (تدوير الفيديو 90 درجة مع دوران الشاشة)
  const toggleRotateVideo = () => {
    setVideoRotation(prev => {
      const next = ((prev + 90) % 360) as 0 | 90 | 180 | 270;
      onSendToast('تدوير اتجاه الفيديو 🔄', `تم تدوير الفيديو ${next}° ليتناسب مع اتجاه الشاشة`);
      return next;
    });
  };

  // Double click / tap to toggle 100% and 175% zoom
  const handleDoubleClickViewport = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoomLevel > 1.0) {
      handleResetZoom();
    } else {
      setZoomLevel(1.75);
      onSendToast('تكبير ذكي بنقرتين 🔍', 'تم التكبير إلى 175%، يمكنك سحب الشاشة للتركيز على الشرح');
    }
  };

  // Mouse wheel zoom inside video container
  const handleWheelViewport = (e: React.WheelEvent) => {
    // Only zoom when Ctrl or Alt is held, or if in fullscreen, or on desktop hover
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Drag / Pan handlers for zoomed video
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return; // No panning needed if not zoomed
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPanX: panOffset.x,
      initPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || zoomLevel <= 1.0) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    // Limit pan boundary based on zoomLevel to prevent dragging offscreen
    const maxBound = (zoomLevel - 1) * 350;
    const newX = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initPanX + deltaX));
    const newY = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initPanY + deltaY));

    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  // Touch handlers for mobile pan/drag when zoomed
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1.0 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initPanX: panOffset.x,
      initPanY: panOffset.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || zoomLevel <= 1.0 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;
    const maxBound = (zoomLevel - 1) * 350;
    const newX = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initPanX + deltaX));
    const newY = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initPanY + deltaY));
    setPanOffset({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    onSendToast('التحكم في سرعة الشرح ⏩', `تم تعديل سرعة الفيديو إلى ${speed}x`);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Block right-click context menu (Anti-download / copy security)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCopyWarning('محتوى محمي بحقوق النشر لمستر أحمد المعاطي! يمنع النسخ أو التحميل منعاً لسرقة المحتوى.');
    setTimeout(() => setCopyWarning(null), 4000);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="space-y-6">
      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>فيديوهات الحصص الرسمية</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            شرح محاضرات اللغة الإنجليزية لمستر أحمد المعاطي
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            محاضرات تأسيسية متعمقة، حل تمارين الثانوية العامة، والتدريب على تريكات الامتحانات مع مشغل فيديو ذكي وآمن.
          </p>
        </div>
      </div>

      {copyWarning && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs font-bold flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{copyWarning}</span>
        </div>
      )}

      {/* Main Video & Playlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player */}
        <div className="lg:col-span-2 space-y-4">
          {selectedVideo ? (
            <div 
              ref={containerRef}
              onContextMenu={handleContextMenu}
              className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative select-none"
              style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            >
              {/* Top lecture info bar in player */}
              <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                    محاضرة {selectedVideo.lectureNumber}
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                    {selectedVideo.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-latin">{selectedVideo.durationMinutes} دقيقة</span>
                </div>
              </div>

              {/* Video Element Viewport */}
              <div 
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClickViewport}
                onWheel={handleWheelViewport}
                className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none ${
                  zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
              >
                {/* Transform Container applying zoom, pan & screen rotation */}
                <div 
                  className={`w-full h-full flex items-center justify-center transition-transform ${
                    isDragging ? 'duration-0' : 'duration-200'
                  } ease-out origin-center`}
                  style={{ 
                    transform: `rotate(${videoRotation}deg) scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)` 
                  }}
                >
                  {videoSource.isEmbed ? (
                    <iframe
                      src={videoSource.embedUrl}
                      title={selectedVideo.title}
                      className="w-full h-full border-0 pointer-events-auto rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={selectedVideo.videoUrl}
                      controls
                      playsInline
                      className={`w-full h-full pointer-events-auto transition-all duration-200 ${
                        isCoverFit ? 'object-cover' : 'object-contain'
                      }`}
                      disablePictureInPicture
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                          if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                            setDuration(videoRef.current.duration);
                          }
                        }
                      }}
                      onEnded={() => setIsPlaying(false)}
                      onClick={togglePlay}
                    />
                  )}
                </div>

                {/* Floating Anti-Recording Protection Watermark (Smooth, Semi-transparent) */}
                <div 
                  className="absolute pointer-events-none transition-all duration-[7000ms] ease-in-out z-20 opacity-25 hover:opacity-10 select-none text-[10px] sm:text-[11px] font-sans font-medium text-white/90 bg-black/40 backdrop-blur-[2px] px-2.5 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5"
                  style={{ top: watermarkPos.top, left: watermarkPos.left }}
                >
                  <span className="font-bold">{studentName}</span>
                  <span className="text-white/40">|</span>
                  <span className="font-mono text-blue-200">كود: {studentCode}</span>
                  {studentPhone && (
                    <>
                      <span className="text-white/40">|</span>
                      <span className="font-mono text-emerald-200 font-latin" dir="ltr">{studentPhone}</span>
                    </>
                  )}
                </div>

                {/* Floating On-Screen Controls for Zoom & Fit */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                  {/* Zoom Badge with drag hint */}
                  {zoomLevel !== 1.0 && (
                    <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur border border-blue-500/50 text-blue-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
                      <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>تكبير: {Math.round(zoomLevel * 100)}% (اسحب للتحريك)</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetZoom();
                        }}
                        className="mr-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="إعادة ضبط الحجم الطبيعي 100%"
                      >
                        إعادة 100%
                      </button>
                    </div>
                  )}

                  {/* Fill/Cover Mode Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCoverFit();
                    }}
                    className={`p-2 rounded-xl backdrop-blur text-xs font-bold transition-all shadow-md flex items-center gap-1 ${
                      isCoverFit 
                        ? 'bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/50' 
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                    title={isCoverFit ? 'العودة للتناسب الطبيعي' : 'تمديد وملء الشاشة بالكامل بدون حواف سوداء'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px]">{isCoverFit ? 'ملء كامل' : 'ملاءمة'}</span>
                  </button>

                  {/* Rotate Screen Button in Floating bar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRotateVideo();
                    }}
                    className="p-2 rounded-xl backdrop-blur bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-md flex items-center gap-1"
                    title="تدوير اتجاه الفيديو 90 درجة مع دوران الشاشة (Rotate)"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline text-[10px]">{videoRotation}°</span>
                  </button>
                </div>

                {/* Big Center Play Overlay (when paused) */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 z-10"
                    title="تشغيل المحاضرة"
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
                  </button>
                )}
              </div>

              {/* Custom Video Controls Bar */}
              <div className="p-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
                {/* Timeline Slider with Seek Preview */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-300 font-latin w-12 text-left select-none">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) {
                        videoRef.current.currentTime = val;
                      }
                    }}
                    className="flex-1 h-2 bg-slate-700 hover:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all"
                  />
                  <span className="text-[11px] font-mono text-slate-400 font-latin w-12 text-right select-none">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left Controls: Play/Pause, Seek Buttons (-30s, -10s, +10s, +30s), Volume */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
                      title={isPlaying ? 'إيقاف مؤقت (Space)' : 'تشغيل (Space)'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      <span className="hidden sm:inline text-xs">{isPlaying ? 'إيقاف' : 'تشغيل'}</span>
                    </button>

                    {/* Rewind 30s */}
                    <button
                      onClick={() => handleSeek(-30)}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                      title="ترجيع 30 ثانية للخلف"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold font-latin">30s-</span>
                    </button>

                    {/* Rewind 10s */}
                    <button
                      onClick={() => handleSeek(-10)}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                      title="ترجيع 10 ثواني للخلف (سهم يسار)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold font-latin">10s-</span>
                    </button>

                    {/* Forward 10s */}
                    <button
                      onClick={() => handleSeek(10)}
                      className="px-2 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-blue-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
                      title="تقديم 10 ثواني للأمام (سهم يمين)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold font-latin">10s+</span>
                    </button>

                    {/* Forward 30s */}
                    <button
                      onClick={() => handleSeek(30)}
                      className="px-2 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-blue-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
                      title="تقديم 30 ثانية للأمام"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold font-latin">30s+</span>
                    </button>

                    {/* Mute Button */}
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                    </button>
                  </div>

                  {/* Right Controls: Zoom (تكبير وتصغير), Speed, Fullscreen */}
                  <div className="flex items-center gap-2">
                    {/* Zoom In & Out Controls (تكبير وتصغير الشاشة) */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.75}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        title="تصغير الفيديو (-)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleResetZoom}
                        className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all"
                        title="إعادة ضبط حجم الشاشة 100% (0)"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 3.5}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        title="تكبير الفيديو (+)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Fill/Cover Mode Toggle Button */}
                    <button
                      onClick={toggleCoverFit}
                      className={`p-2 rounded-xl transition-all ${
                        isCoverFit 
                          ? 'bg-amber-600 text-white font-bold shadow-md' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title={isCoverFit ? 'إلغاء ملء الشاشة واستعادة التناسب القياسي' : 'تمديد الفيديو لملء كامل مساحة العرض بدون حواف سوداء'}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Speed Selector */}
                    <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            playbackSpeed === speed
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Rotate Video Button (تدوير اتجاه الفيديو) */}
                    <button
                      onClick={toggleRotateVideo}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="تدوير اتجاه الفيديو 90 درجة مع دوران الشاشة (Rotate)"
                    >
                      <RotateCw className="w-4 h-4 text-blue-400" />
                    </button>

                    {/* Fullscreen Button (تكبير ملء الشاشة) */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={isFullscreen ? 'تصغير الشاشة / إنهاء ملء الشاشة (F)' : 'تكبير ملء الشاشة (F)'}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>


              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
              <p>لم يتم العثور على فيديوهات محاضرات حالياً.</p>
            </div>
          )}

          {/* Selected Video Details Box */}
          {selectedVideo && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
                  {selectedVideo.unit}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-latin">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {selectedVideo.dateAdded}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {selectedVideo.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedVideo.description}
              </p>
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <span className="text-[11px] text-slate-500">
                  مستوى: {selectedVideo.gradeLevel}
                </span>

                {videoSource.directUrl && (
                  <a
                    href={videoSource.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-900 border border-blue-700/60 text-blue-200 text-xs font-bold transition-all shadow-sm"
                  >
                    <span>مشاهدة عبر تطبيق المشغل الخارجي ↗️</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Playlist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>قائمة محاضرات الحصة ({videos.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">
              مدة كل محاضرة 90 دقيقة
            </span>
          </div>

          <div className="space-y-3">
            {videos.map((vid) => {
              const isSelected = selectedVideo?.id === vid.id;
              return (
                <div
                  key={vid.id}
                  onClick={() => handleSelectVideo(vid)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-950/50 scale-[1.01]'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {vid.lectureNumber}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 block">{vid.unit}</span>
                        <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5">
                          {vid.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-latin">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {vid.durationMinutes} دقيقة (ساعة ونصف)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isSelected ? 'قيد المشاهدة الآن' : 'تشغيل'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copyright notice */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-200">🛡️ شروط الاستخدام والأمان الأكاديمي:</p>
            <p className="text-slate-400 leading-relaxed">
              جميع الفيديوهات والشروحات خاصة بطلاب مستر أحمد المعاطي فقط. يمنع منعا باتا أي محاولة لتحميل أو إعادة نشر الفيديو لتجنب المساءلة القانونية وإيقاف الكود الأكاديمي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
