'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './TheDatum.module.css';
import { TheSheet } from './TheSheet';
import { ActCard } from './ActCard';
import { RegisterStack } from './RegisterStack';
import { Principal } from './Principal';
import { Hold } from './Hold';

export const TheDatum: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.datumWrapper} ref={containerRef}>
      <div className={styles.datumLineFixed} style={{ height: `${scrollProgress * 100}%` }}></div>
      
      {/* 1. THE SHEET */}
      <TheSheet />

      {/* 2. ACT I - STRATEGY & ARCHITECTURE */}
      <div className={styles.actTheme1}>
        <ActCard 
          actNumber={1}
          numeral="I"
          title="STRATEGY & ARCHITECTURE"
          subtitle="Where master planning meets feasibility. We organize land, budget, and purpose into a singular vision."
        />
        
        {/* 3. REGISTERS - CORE DISCIPLINES */}
        <RegisterStack 
          items={[
            { number: '01', name: 'Master Planning', proposition: 'Designing comprehensive urban frameworks across Mixed-Use, Residential, and Commercial sectors.' },
            { number: '02', name: 'Urban Design', proposition: 'Integrating architecture seamlessly with the public realm.' },
            { number: '03', name: 'Feasibility & Strategy', proposition: 'Ensuring every design decision is backed by strict budgetary control and spatial logic.' }
          ]}
        />

        {/* 4. PRINCIPAL 01 - ARCHITECTURE HERO */}
        <Principal 
          number="04"
          name="Architecture"
          statement="Over a decade of delivering iconic structures across the Middle East. Form is the consequence of rigorous engineering and unwavering execution."
          imageSrc="/images/expertise/ahw_act1_built.jpg"
        />

        {/* 5. HOLD I */}
        <Hold
          imageSrc="/images/expertise/ahw_act1_built.jpg"
          text="Explore Our Architecture Projects →"
          href="/expertise/architecture"
        />
      </div>

      {/* 6. ACT II - INTERIOR & ENGINEERING */}
      <div className={styles.actTheme2}>
        <ActCard 
          actNumber={2}
          numeral="II"
          title="INTERIOR & ENGINEERING"
          subtitle="From the structural skeleton to the tactile surface. Every detail is engineered for human experience and structural integrity."
        />
        
        <RegisterStack 
          items={[
            { number: '04', name: 'Structural Engineering', proposition: 'The invisible strength that makes extraordinary architecture possible.' },
            { number: '05', name: 'Interior Design', proposition: 'Curating deeply personal and luxurious interiors through bespoke materials.' },
            { number: '06', name: 'Landscape Architecture', proposition: 'Sculpting the natural environment to complement the built form.' },
            { number: '07', name: 'BIM Coordination', proposition: 'Clash-free digital modeling to guarantee flawless on-site execution.' }
          ]}
        />

        {/* 7. SPLIT LAYOUT - VISUAL RHYTHM BREAK */}
        <div className={styles.splitContainer}>
          <div>
            <h3 className={styles.registerName} style={{fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-6)'}}>The Engineering of Elegance</h3>
            <p className={styles.registerProposition}>
              Beautiful spaces demand rigorous engineering. By integrating our interior design and structural engineering teams from day one, we eliminate friction between aesthetic intent and technical reality. The result is seamless execution across commercial, hospitality, and premium residential sectors.
            </p>
          </div>
          <div className={styles.splitImage}>
            <Image src="/images/expertise/ahw_split_commercial.jpg" alt="Commercial Interior" fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.splitImageInner} />
          </div>
        </div>

        {/* 8. THRESHOLD (Rupture) */}
        <div className={styles.thresholdContainer}>
          <div className={styles.thresholdContent}>
            <p className={styles.thresholdText}>Design is only a promise.</p>
            <p className={styles.thresholdText} style={{ color: 'rgba(242, 244, 247, 0.6)' }}>Execution is the proof.</p>
          </div>
        </div>

        {/* HOLD II */}
        <Hold
          imageSrc="/images/expertise/ahw_act2_built.jpg"
          text="Explore Engineering & Project Management →"
          href="/expertise/engineering-project-management"
        />
      </div>

      {/* 9. ACT III - DESIGN & BUILD */}
      <div className={styles.actTheme3}>
        <ActCard 
          actNumber={3}
          numeral="III"
          title="DESIGN & BUILD"
          subtitle="We do not just hand over drawings. We take full accountability for the physical realization of the project."
        />
        
        <RegisterStack 
          items={[
            { number: '08', name: 'Design & Build', proposition: 'A singular point of responsibility from concept to completion.' },
            { number: '09', name: 'Project Management', proposition: 'Rigorous oversight of timeline, budget, and complex logistics.' },
            { number: '10', name: 'Procurement', proposition: 'Global sourcing of premium materials and bespoke FF&E.' },
            { number: '11', name: 'Site Supervision', proposition: 'On-site presence to ensure the built form perfectly matches the design intent.' }
          ]}
        />

        {/* 10. PRINCIPAL 03 - CONSTRUCTION HERO */}
        <Principal 
          number="12"
          name="Construction Craftsmanship"
          statement="True luxury is found in the millimeters. We manage the grit of the construction site to protect the purity of the design."
          imageSrc="/images/expertise/ahw_act3_built.jpg"
        />
      </div>

      {/* 11. ACT IV - FIT-OUT & HANDOVER */}
      <div className={styles.actTheme4}>
        <ActCard 
          actNumber={4}
          numeral="IV"
          title="FIT-OUT & HANDOVER"
          subtitle="The final layer of refinement. Where raw space becomes a premium, fully operational environment."
        />
        
        {/* SPLIT LAYOUT - VISUAL RHYTHM BREAK */}
        <div className={styles.splitContainer}>
          <div className={styles.splitImage}>
            <Image src="/images/expertise/ahw_split_landscape.jpg" alt="Completed Landscape and Fit-out" fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.splitImageInner} />
          </div>
          <div style={{ paddingLeft: 'var(--space-8)' }}>
            <h3 className={styles.registerName} style={{fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-6)'}}>Uncompromising Delivery</h3>
            <p className={styles.registerProposition}>
              Whether it is a five-star hospitality venue or a flagship retail space, our fit-out teams execute with absolute precision. We handle authority approvals and complex installations, ensuring you step into a flawless space.
            </p>
          </div>
        </div>

        <RegisterStack 
          items={[
            { number: '13', name: 'Interior Fit-Out', proposition: 'Premium, turnkey interior completions built to the highest standards.' },
            { number: '14', name: 'Authority Approvals', proposition: 'Navigating regulatory frameworks to ensure compliant, seamless handover.' },
            { number: '15', name: 'Final Handover', proposition: 'The moment a vision becomes a functioning reality.' }
          ]}
        />

        {/* 12. HOLD - FINAL CONVICTION */}
        <Hold
          imageSrc="/images/expertise/ahw_act4_built.jpg"
          text="From First Sketch to Final Handover. View Our Projects →"
          href="/projects"
        />
      </div>
    </div>
  );
};
