export type DocumentCategory = 'profile' | 'hr' | 'capability' | 'technical' | 'catalogue';

export interface DocumentSEO {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}

export interface DocumentMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: DocumentCategory;
  fileSize: string;
  fileType: 'PDF' | 'DOC' | 'DOCX' | 'ZIP';
  downloadUrl: string;
  viewOnlineUrl?: string;
  version: string;
  lastUpdated?: string;
  coverImage?: string;
  seo?: DocumentSEO;
  isFuture?: boolean;
}

export const documentsData: Record<string, DocumentMeta> = {
  companyProfile: {
    id: 'companyProfile',
    slug: 'company-profile',
    title: 'AHW Architects Company Profile',
    description: 'A comprehensive overview of our multidisciplinary Design & Build expertise, philosophy, and selected projects across the MENA and GCC regions.',
    category: 'profile',
    fileSize: '4.0 MB',
    fileType: 'PDF',
    downloadUrl: '/documents/ahw-company-profile.pdf',
    viewOnlineUrl: '/documents/ahw-company-profile.pdf',
    version: 'V001',
    seo: {
      title: 'Company Profile | AHW Architects',
      description: 'Download the official AHW Architects Company Profile to explore our architectural design and build portfolio.',
      keywords: ['AHW Architects', 'Company Profile', 'Design and Build', 'Architecture Portfolio'],
    }
  },
  hrApplication: {
    id: 'hrApplication',
    slug: 'hr-application-form',
    title: 'AHW HR Application',
    description: 'Official employment application form for prospective candidates. Please fill this out and attach it to your application.',
    category: 'hr',
    fileSize: '407 KB',
    fileType: 'PDF',
    downloadUrl: '/documents/ahw-hr-application.pdf',
    version: '1.0',
  },
  capabilityStatement: {
    id: 'capabilityStatement',
    slug: 'capability-statement',
    title: 'Capability Statement',
    description: 'Our core competencies, selected work, and delivery process — for developers, corporate clients, and decision-makers.',
    category: 'capability',
    fileSize: '1.8 MB',
    fileType: 'PDF',
    downloadUrl: '/documents/ahw-capability-statement.pdf',
    viewOnlineUrl: '/capability-statement',
    version: '1.3',
  },
  brochures: {
    id: 'brochures',
    slug: 'brochures',
    title: 'Brochures',
    description: 'A collection of informational brochures regarding our specific services.',
    category: 'profile',
    fileSize: '0 KB',
    fileType: 'PDF',
    downloadUrl: '#',
    version: '1.0',
    isFuture: true,
  },
  certificates: {
    id: 'certificates',
    slug: 'certificates',
    title: 'Certificates',
    description: 'Official company certificates and accreditations.',
    category: 'profile',
    fileSize: '0 KB',
    fileType: 'PDF',
    downloadUrl: '#',
    version: '1.0',
    isFuture: true,
  }
};

export const getAllDocuments = () => Object.values(documentsData);
export const getDocumentById = (id: string) => documentsData[id];
export const getDocumentBySlug = (slug: string) => 
  getAllDocuments().find(doc => doc.slug === slug);
export const getDocumentsByCategory = (category: DocumentCategory) => 
  getAllDocuments().filter(doc => doc.category === category);
