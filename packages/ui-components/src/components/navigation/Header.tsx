'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Header.module.css';

import { MenuTrigger } from './MenuTrigger';
import { AppearanceToggle } from './AppearanceToggle';
import { FloatingNavigationPanel } from './FloatingNavigationPanel';

export interface HeaderProps {
  currentPath?: string;
}

const NAV_PANEL_ID = 'primary-navigation-panel';

export const Header: React.FC<HeaderProps> = ({ currentPath = '/' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Menu Trigger State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlGroupRef = useRef<HTMLDivElement>(null);

  // Dynamic Preview Mapping
  const sectionImages: Record<string, string> = {
    'Projects': '/images/navigation/projects.jpg',
    'Expertise': '/images/navigation/expertise.jpg',
    'Insights': '/images/navigation/insights.jpg',
    'About': '/images/navigation/about.jpg',
    'Contact': '/images/navigation/contact.jpg',
  };

  // Reset hover state when menu closes
  useEffect(() => {
    if (!isMenuOpen) setHoveredSection(null);
  }, [isMenuOpen]);

  // Escape closes the panel and returns focus to the trigger that opened it.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Lock body scroll while the panel is open. `clip` (not `hidden`) so body
  // never becomes an unintended scroll container that hijacks descendant
  // position:sticky elements (e.g. ProjectFilterBar) once the lock lifts.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'clip' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Add background blur when scrolled past 50px
      setScrolled(currentScrollY > 50);

      // Hide header when scrolling down, show when scrolling up
      let isHidden = false;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        isHidden = true;
        setHidden(true);
      } else {
        setHidden(false);
      }

      // Update dynamic offset for sticky elements (like FilterBar).
      // Mirrors Header.module.css's actual rendered heights so sticky
      // elements never drift from the real header size.
      const isScrolled = currentScrollY > 50;
      const isMobile = window.innerWidth <= 768;
      const restHeight = isMobile ? 60 : 88; // logo + padding, see Header.module.css
      const scrolledHeight = isMobile ? 60 : 64;
      const offset = isHidden ? 0 : (isScrolled ? scrolledHeight : restHeight);
      document.documentElement.style.setProperty('--header-offset', `${offset}px`);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
    <header 
      className={`${styles.header} ${scrolled ? styles.scrolled : ''} ${hidden ? styles.hidden : ''} ${(currentPath === '/' && !scrolled && !isHovered && !isMenuOpen) ? styles.fadeHidden : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.container}>
        <a href="/" className={styles.logo} aria-label="AHW Architects Home">
          <Image src="/images/logo-white.webp" alt="AHW Architects" width={1571} height={592} priority className={styles.logoWhite} />
          <Image src="/images/logo-dark.webp" alt="AHW Architects" width={1571} height={592} priority className={styles.logoDark} />
        </a>
        
        <nav className={styles.nav}>
          <a href="/contact" className={styles.headerCta} aria-label="Start Your Project">
            <span className={styles.ctaFull}>Start Your Project</span>
            <span className={styles.ctaShort} aria-hidden="true">&rarr;</span>
          </a>
          <div
            ref={controlGroupRef}
            className={styles.controlGroup}
            onBlur={(e) => {
              if (isMenuOpen && !controlGroupRef.current?.contains(e.relatedTarget as Node)) {
                setIsMenuOpen(false);
              }
            }}
          >
            <AppearanceToggle />
            <div className={styles.divider} />
            <MenuTrigger
              ref={triggerRef}
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              controlsId={NAV_PANEL_ID}
            />
            <FloatingNavigationPanel
              id={NAV_PANEL_ID}
              isOpen={isMenuOpen}
              onHoverSection={setHoveredSection}
            />
          </div>
        </nav>
      </div>
    </header>
    
    {/* Page Backdrop base blur */}
    <div 
      className={`${styles.pageBackdrop} ${isMenuOpen ? styles.backdropOpen : ''}`} 
      aria-hidden="true" 
      onClick={() => setIsMenuOpen(false)}
    />
    
    {/* Dynamic Cinematic Preview Layer */}
    <div 
      className={`${styles.previewBackdrop} ${(isMenuOpen && hoveredSection) ? styles.previewVisible : ''}`} 
      style={{
        backgroundImage: hoveredSection ? `linear-gradient(rgba(15, 17, 21, 0.75), rgba(15, 17, 21, 0.75)), url(${sectionImages[hoveredSection]})` : 'none'
      }}
      aria-hidden="true" 
      onClick={() => setIsMenuOpen(false)}
    />
    </>
  );
};
