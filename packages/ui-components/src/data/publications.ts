export interface Publication {
  id: string;
  slug: string;
  outlet: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  url: string;
  coverImage?: string;
  coverImageCaption?: string;
  relatedProjectSlugs?: string[];
  tags?: string[];
  isFeatured?: boolean;
  readingTime?: string;
}

export const publications: Publication[] = [
  {
    id: 'niche-magazine-ksa-2024',
    slug: 'niche-magazine-ksa-2024',
    outlet: 'Niche Magazine',
    title: 'Excellence in Architecture — AHW Architects D+B Projects',
    excerpt: 'AHW Architects was recognized for Excellence in Architecture in Niche Magazine\'s KSA 2024 awards feature, honoring standout design and design-build practices across the region.',
    content: 'AHW Architects was recognized for Excellence in Architecture in Niche Magazine\'s KSA 2024 awards feature, honoring standout design and design-build practices across the region. The feature highlights the firm\'s commitment to delivering premium, regionally rooted architecture that meets international standards. Through a multidisciplinary approach, AHW continues to shape the built environment with precision and craft.',
    date: '2024-04-15',
    url: 'https://nichemagazine.me/wp-content/uploads/2025/04/Magazine-KSA-2024_Digital_compressed.pdf',
    tags: ['Awards', 'KSA', 'Design & Build'],
    isFeatured: true,
    readingTime: '3 min read',
    coverImage: '/images/placeholders/ahw_hero_background.jpg',
  },
  {
    id: 'he-magazine-interview',
    slug: 'he-magazine-interview',
    outlet: 'He Magazine',
    title: 'A Conversation on Design, Land, and Craft Across Markets',
    excerpt: 'AHW Architects\' leadership spoke with He Magazine about designing across different markets and regulatory environments, from Kuwait and Dubai to international projects, and the firm\'s approach to concept, development, and construction.',
    content: 'AHW Architects\' leadership spoke with He Magazine about designing across different markets and regulatory environments, from Kuwait and Dubai to international projects, and the firm\'s approach to concept, development, and construction. The interview delves into the complexities of bridging cultural contexts while maintaining a cohesive design language. We discuss the importance of materiality, environmental responsiveness, and the evolving role of the architect in the modern Middle East.',
    date: '2024-02-10',
    url: 'https://hemag-eg.com/article/131',
    tags: ['Interview', 'Design Philosophy', 'Kuwait', 'Dubai'],
    readingTime: '5 min read',
    coverImage: '/images/placeholders/ahw_commercial.jpg',
    relatedProjectSlugs: ['khiran-chalet-kuwait', 'aliaa-behbehani-lawyer-office-bneid-al-gar'],
  },
];
