import React from 'react';
import styles from './Card.module.css';

export interface ServiceCardProps {
  title: string;
  description: string;
  imageSrc?: string;
  href: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, imageSrc, href }) => (
  <a href={href} className={`${styles.card} ${styles.serviceCard}`}>
    <div className={styles.imageWrapper} style={imageSrc ? { backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}></div>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.description}>{description}</p>
  </a>
);

export interface ProjectCardProps {
  title: string;
  category: string;
  href: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ title, category, href }) => (
  <a href={href} className={`${styles.card} ${styles.projectCard}`}>
    <div className={styles.imageWrapper}>
      {/* Real image support later */}
    </div>
    <div className={styles.meta}>{category}</div>
    <h3 className={styles.title}>{title}</h3>
  </a>
);
