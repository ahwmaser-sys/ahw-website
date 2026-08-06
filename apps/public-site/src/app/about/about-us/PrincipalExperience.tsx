import React from 'react';
import Image from 'next/image';
import { principalExperience } from '@agp/ui-components';
import styles from './PrincipalExperience.module.css';

export function PrincipalExperience() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Before AHW Architects</span>
          <h2 className={styles.title}>Professional Experience</h2>
          <p className={styles.subtitle}>Selected projects personally led by our founders prior to founding AHW Architects — delivered under previous firms, not by AHW Architects. Shown here as the foundational expertise that shaped the firm.</p>
        </div>

        <div className={styles.grid}>
          {principalExperience.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.imageGallery}>
                <div className={styles.featureImageWrapper}>
                  <Image
                    src={project.images.feature}
                    alt={project.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 60vw"
                    className={styles.image}
                  />
                </div>
                {project.images.detail01 && (
                  <div className={styles.detailGallery}>
                    <div className={styles.detailImageWrapper}>
                      <Image
                        src={project.images.detail01}
                        alt={`${project.title} Detail`}
                        fill
                        sizes="(max-width: 1023px) 100vw, 60vw"
                        className={styles.image}
                      />
                    </div>
                    {project.images.detail02 && (
                      <div className={styles.detailImageWrapper}>
                        <Image
                          src={project.images.detail02}
                          alt={`${project.title} Detail 02`}
                          fill
                          sizes="(max-width: 1023px) 100vw, 60vw"
                          className={styles.image}
                        />
                      </div>
                    )}
                    {project.images.detail03 && (
                      <div className={styles.detailImageWrapper}>
                        <Image
                          src={project.images.detail03}
                          alt={`${project.title} Detail 03`}
                          fill
                          sizes="(max-width: 1023px) 100vw, 60vw"
                          className={styles.image}
                        />
                      </div>
                    )}
                    {project.images.detail04 && (
                      <div className={styles.detailImageWrapper}>
                        <Image
                          src={project.images.detail04}
                          alt={`${project.title} Detail 04`}
                          fill
                          sizes="(max-width: 1023px) 100vw, 60vw"
                          className={styles.image}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.projectInfo}>
                <span className={styles.preAhwBadge}>Prior to AHW Architects</span>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <div className={styles.projectMeta}>
                  <span>{project.sector}</span>
                  <span>{project.city}, {project.market}</span>
                  {project.area && <span>{project.area} m²</span>}
                </div>
                {project.description && (
                  <p className={styles.projectDescription}>{project.description}</p>
                )}
                
                {project.clientTestimonial && (
                  <blockquote className={styles.testimonial}>
                    <p>"{project.clientTestimonial}"</p>
                  </blockquote>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
