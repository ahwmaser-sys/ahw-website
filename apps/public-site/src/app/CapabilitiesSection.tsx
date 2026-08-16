'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './home.module.css';

const capabilityImageAlt: Record<string, string> = {
  '/images/placeholders/ahw_service_architecture.jpg': 'AHW Architects — Architecture discipline, master planning and iconic structures',
  '/images/placeholders/ahw_service_interior.jpg': 'AHW Architects — Interior Design discipline, bespoke luxury interiors',
  '/images/expertise/ahw_act3_built.jpg': 'AHW Architects — Design & Build discipline, construction management',
  '/images/placeholders/ahw_retail.jpg': 'AHW Architects — Fit-Out discipline, premium retail and hospitality completion',
};

// The only interactive piece of the homepage's "Disciplines" section (hover
// swaps the sticky visual panel's image) — split out from HomeContent so
// that state/handler is the only reason a 'use client' boundary exists
// here, instead of forcing the entire (mostly static) homepage to be a
// Client Component just for this one below-the-fold hover effect.
export function CapabilitiesSection() {
  const [activeCapabilityImage, setActiveCapabilityImage] = useState('/images/placeholders/ahw_service_architecture.jpg');

  return (
    <section className={styles.capabilitiesAwardSection}>
      <div className={styles.container}>
        <div className={styles.capAwardHeader}>
          <h2 className={styles.capAwardMainTitle}>Disciplines</h2>
          <p className={styles.capAwardSub}>A singular point of responsibility from concept to completion.</p>
        </div>

        <div className={styles.capAwardGrid}>

          <div className={styles.capAwardList}>

            <div
              className={styles.capAwardItem}
              onMouseEnter={() => setActiveCapabilityImage('/images/placeholders/ahw_service_architecture.jpg')}
            >
              <div className={styles.capAwardItemHeader}>
                <span className={styles.capAwardNum}>01</span>
                <h3 className={styles.capAwardTitle}>Architecture</h3>
              </div>
              <div className={styles.capAwardItemImageMobile}>
                <Image src="/images/placeholders/ahw_service_architecture.jpg" alt="AHW Architects — Architecture discipline" fill sizes="100vw" className={styles.capAwardImage} />
              </div>
              <div className={styles.capAwardItemContent}>
                <p className={styles.capAwardDesc}>
                  Designing comprehensive urban frameworks and iconic structures across Mixed-Use, Residential, and Commercial sectors. Form is the consequence of rigorous engineering and spatial logic.
                </p>
                <Link href="/expertise/architecture" className={styles.exploreLinkAward}>Explore Architecture →</Link>
              </div>
            </div>

            <div
              className={styles.capAwardItem}
              onMouseEnter={() => setActiveCapabilityImage('/images/placeholders/ahw_service_interior.jpg')}
            >
              <div className={styles.capAwardItemHeader}>
                <span className={styles.capAwardNum}>02</span>
                <h3 className={styles.capAwardTitle}>Interior Design</h3>
              </div>
              <div className={styles.capAwardItemImageMobile}>
                <Image src="/images/placeholders/ahw_service_interior.jpg" alt="AHW Architects — Interior Design discipline" fill sizes="100vw" className={styles.capAwardImage} />
              </div>
              <div className={styles.capAwardItemContent}>
                <p className={styles.capAwardDesc}>
                  From the structural skeleton to the tactile surface. We curate deeply personal and luxurious interiors that elevate everyday living through bespoke materials and clash-free BIM coordination.
                </p>
                <Link href="/expertise/interior-design" className={styles.exploreLinkAward}>Explore Interiors →</Link>
              </div>
            </div>

            <div
              className={styles.capAwardItem}
              onMouseEnter={() => setActiveCapabilityImage('/images/expertise/ahw_act3_built.jpg')}
            >
              <div className={styles.capAwardItemHeader}>
                <span className={styles.capAwardNum}>03</span>
                <h3 className={styles.capAwardTitle}>Design & Build</h3>
              </div>
              <div className={styles.capAwardItemImageMobile}>
                <Image src="/images/expertise/ahw_act3_built.jpg" alt="AHW Architects — Design & Build discipline" fill sizes="100vw" className={styles.capAwardImage} />
              </div>
              <div className={styles.capAwardItemContent}>
                <p className={styles.capAwardDesc}>
                  A singular point of responsibility from concept to completion. We manage the grit of the construction site to protect the purity of the design, overseeing timeline, budget, and complex logistics.
                </p>
                <Link href="/expertise/design-build" className={styles.exploreLinkAward}>Explore Delivery →</Link>
              </div>
            </div>

            <div
              className={styles.capAwardItem}
              onMouseEnter={() => setActiveCapabilityImage('/images/placeholders/ahw_retail.jpg')}
            >
              <div className={styles.capAwardItemHeader}>
                <span className={styles.capAwardNum}>04</span>
                <h3 className={styles.capAwardTitle}>Fit-Out</h3>
              </div>
              <div className={styles.capAwardItemImageMobile}>
                <Image src="/images/placeholders/ahw_retail.jpg" alt="AHW Architects — Fit-Out discipline" fill sizes="100vw" className={styles.capAwardImage} />
              </div>
              <div className={styles.capAwardItemContent}>
                <p className={styles.capAwardDesc}>
                  The final layer of refinement. Whether a five-star hospitality venue or a flagship retail space, our fit-out teams execute with absolute precision, ensuring you step into a flawless environment.
                </p>
                <Link href="/expertise/fit-out" className={styles.exploreLinkAward}>Explore Fit-Out →</Link>
              </div>
            </div>

          </div>

          <div className={styles.capAwardVisual}>
            <div className={styles.capAwardSticky}>
              <div className={styles.capAwardImageWrapper}>
                <Image
                  src={activeCapabilityImage}
                  alt={capabilityImageAlt[activeCapabilityImage] || 'AHW Architects discipline'}
                  fill
                  sizes="(max-width: 1023px) 100vw, 40vw"
                  className={styles.capAwardImage}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
