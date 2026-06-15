import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Clock, ChevronLeft, ChevronRight, Settings, TrendingUp, Scale, CreditCard, Check, FileText } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'system' | 'valuation' | 'juror' | 'payment' | 'verdict';
  agent?: string;
  title: string;
  description: string;
  data?: any;
}

interface TimeTravelReplayProps {
  events: TimelineEvent[];
  onEventSelect?: (event: TimelineEvent) => void;
  autoPlay?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'system': return <Settings size={14} />;
    case 'valuation': return <TrendingUp size={14} />;
    case 'juror': return <Scale size={14} />;
    case 'payment': return <CreditCard size={14} />;
    case 'verdict': return <Check size={14} />;
    default: return <FileText size={14} />;
  }
};

const EventCard: React.FC<{
  event: TimelineEvent;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}> = ({ event, isActive, isPast, onClick }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return '#6B7280';
      case 'valuation': return '#8B5CF6';
      case 'juror': return '#3B82F6';
      case 'payment': return '#F59E0B';
      case 'verdict': return '#10B981';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.75rem',
        background: isActive ? 'var(--bg-surface-alt)' : 'transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        borderLeft: `3px solid ${isActive ? getTypeColor(event.type) : 'transparent'}`,
        transition: 'all 0.2s ease',
        opacity: isPast ? 0.6 : 1
      }}
      onClick={onClick}
    >
      {/* Timeline Dot */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minWidth: '20px'
      }}>
        <div style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%',
          background: isActive ? getTypeColor(event.type) : isPast ? 'var(--text-tertiary)' : 'var(--border-color)',
          border: isActive ? `2px solid ${getTypeColor(event.type)}` : 'none',
          boxShadow: isActive ? `0 0 8px ${getTypeColor(event.type)}44` : 'none'
        }} />
        <div style={{ 
          width: '2px', 
          flexGrow: 1, 
          background: 'var(--border-color)',
          marginTop: '0.25rem'
        }} />
      </div>

      {/* Event Content */}
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem' }}>{getTypeIcon(event.type)}</span>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}>
            {event.title}
          </span>
          {event.agent && (
            <span style={{ 
              fontSize: '0.65rem', 
              color: 'var(--text-tertiary)',
              background: 'var(--bg-surface)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px'
            }}>
              {event.agent}
            </span>
          )}
        </div>
        
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-tertiary)',
          lineHeight: 1.4
        }}>
          {event.description.length > 100 
            ? event.description.substring(0, 100) + '...' 
            : event.description}
        </div>
        
        <div style={{ 
          fontSize: '0.65rem', 
          color: 'var(--text-tertiary)',
          marginTop: '0.25rem'
        }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

export const TimeTravelReplay: React.FC<TimeTravelReplayProps> = ({ 
  events, 
  onEventSelect,
  autoPlay = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);

  const currentEvent = events[currentIndex];

  useEffect(() => {
    if (!isPlaying || events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, events.length]);

  useEffect(() => {
    if (currentEvent && onEventSelect) {
      onEventSelect(currentEvent);
    }
  }, [currentEvent, onEventSelect]);

  const goToStart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const goToEnd = () => {
    setCurrentIndex(events.length - 1);
    setIsPlaying(false);
  };

  const stepBack = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const stepForward = () => {
    setCurrentIndex(prev => Math.min(events.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (currentIndex >= events.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const progress = events.length > 0 ? (currentIndex / (events.length - 1)) * 100 : 0;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Clock size={20} color="var(--text-secondary)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Time Travel Replay
        </h3>
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-tertiary)',
          background: 'var(--bg-surface)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px'
        }}>
          {events.length} events
        </span>
      </div>

      {/* Playback Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'var(--bg-surface)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={goToStart}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-tertiary)', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <SkipBack size={16} />
          </button>
          
          <button 
            onClick={stepBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-tertiary)', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <button 
            onClick={togglePlay}
            style={{ 
              background: 'var(--primary)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button 
            onClick={stepForward}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-tertiary)', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <ChevronRight size={16} />
          </button>
          
          <button 
            onClick={goToEnd}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-tertiary)', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ flexGrow: 1 }}>
          <div style={{ 
            height: '4px', 
            background: 'var(--bg-surface-alt)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              style={{ 
                height: '100%', 
                background: 'var(--primary)',
                borderRadius: '2px'
              }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '0.25rem'
          }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
              {currentIndex + 1} / {events.length}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
              {currentEvent ? new Date(currentEvent.timestamp).toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Speed:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                background: playbackSpeed === speed ? 'var(--bg-surface-alt)' : 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.65rem',
                color: playbackSpeed === speed ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer'
              }}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Current Event Detail */}
      {currentEvent && (
        <motion.div
          key={currentEvent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              {getTypeIcon(currentEvent.type)}
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentEvent.title}
            </h4>
          </div>
          
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: '0.75rem'
          }}>
            {currentEvent.description}
          </p>
          
          {currentEvent.data && (
            <div style={{ 
              background: 'var(--bg-main)',
              borderRadius: '4px',
              padding: '0.75rem',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: 'var(--text-secondary)',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(currentEvent.data, null, 2)}
            </div>
          )}
        </motion.div>
      )}

      {/* Timeline */}
      <div 
        ref={timelineRef}
        style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '0.5rem'
        }}
      >
        {events.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem'
          }}>
            No events recorded yet. Start a dispute to see the timeline.
          </div>
        ) : (
          events.map((event, idx) => (
            <EventCard
              key={event.id}
              event={event}
              isActive={idx === currentIndex}
              isPast={idx < currentIndex}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPlaying(false);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TimeTravelReplay;