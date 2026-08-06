// @ts-ignore
import Image from 'next/image';
import type { TimelineEvent } from '../../data/about';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className = '' }: TimelineProps) {
  return (
    <div className={`${styles.timelineWrapper} ${className}`}>
      <div className={styles.timelineLine} />
      
      {events.map((event, index) => (
        <div key={`${event.year}-${index}`} className={`${styles.eventNode} ${event.milestone ? styles.milestone : ''}`}>
          <div className={styles.eventDot} />
          
          <div className={styles.eventContent}>
            <span className={styles.year}>{event.year}</span>
            <h3 className={styles.title}>{event.title}</h3>
            <p className={styles.description}>{event.description}</p>
            
            {event.image && (
              <div className={styles.imageWrapper}>
                <Image 
                  src={event.image} 
                  alt={event.title} 
                  fill
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
