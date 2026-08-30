export type ProjectTier = 'Flagship' | 'Standard';
export type ProjectSector = 'Residential' | 'Commercial' | 'Hospitality' | 'Workplace' | 'Retail';
export type ProjectMarket = 'Egypt' | 'Kuwait' | 'UAE' | 'Lebanon';

export interface ProjectMetadata {
  id: string;
  slug: string;
  title: string;
  sector: ProjectSector;
  city: string;
  market: ProjectMarket;
  area: string;
  year: string;
  tier: ProjectTier;
  services?: string[];
  client?: string;
  status?: string;
  resultStatement?: string;
  heroImage?: string;
  hubFlagshipImage?: string;
  hubPairImage?: string;
  ogImage: string;
  imageOrientation?: 'landscape' | 'portrait';
}

export interface CaseStudyData {
  brief: {
    clientProblem: string;
    definitionalSentence: string;
  };
  design: {
    images: string[];
    keyDecision: string;
  };
  build: {
    images: string[];
    duration: string;
    challengeResolution: string;
    features: string[];
  };
  result: {
    images: string[];
    outcomes: string[];
    clientQuote?: {
      quote: string;
      author: string;
    };
  };
  relatedProjects: string[]; // slugs
  relatedExpertise: {
    title: string;
    href: string;
  };
  /** Optional editorial layer: deeper storytelling, SEO overrides, FAQ, and a
   * project-specific CTA. Only present for projects with real, verified detail
   * beyond the base case study — never auto-generated as filler. */
  narrative?: ProjectNarrative;
}

export interface ProjectNarrative {
  heroHeadline: string;
  heroSubtitle: string;
  story: string[]; // paragraphs
  designPhilosophy: string;
  whyDifferent: string;
  clientExperience: string[]; // short bullet points
  imageStory?: {
    design?: string;
    build?: string;
    result?: string;
  };
  faq: { question: string; answer: string }[];
  cta: {
    headline: string;
    subtext?: string;
  };
  seo: {
    title: string;
    description: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    ogTitle: string;
    ogDescription: string;
    twitterTitle: string;
    twitterDescription: string;
  };
}

export interface Project extends ProjectMetadata {
  caseStudy?: CaseStudyData;
}

export const projects: Project[] = [
  {
    id: '17',
    slug: "il-bosco-villa-new-capital-egypt",
    title: 'IL Bosco Villa',
    sector: 'Residential',
    city: 'New Capital',
    market: 'Egypt',
    area: 'Unknown',
    year: '2024',
    tier: 'Flagship',
    services: ['Architecture', 'Interior Design', 'Design & Build'],
    client: 'Private Client',
    status: 'Design Phase',
    resultStatement: 'A luxurious private villa located in IL Bosco, New Capital, designed by AHW Architects.',
    heroImage: '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-2-yfyx.jpg',
    hubFlagshipImage: '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-3-atv8.jpg',
    ogImage: '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-2-yfyx.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client desired a modern, elegant living space that maximizes natural light and provides a seamless indoor-outdoor connection within the IL Bosco community.',
        definitionalSentence: "Contemporary Living in Egypt's New Capital."
      },
      design: {
        images: [
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-4-48ng.jpg',
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-5-y18x.jpg'
        ],
        keyDecision: 'Using large glazed facades and premium natural materials to create an airy, sophisticated atmosphere.'
      },
      build: {
        images: [
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-6-3frf.jpg',
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-7-8gz4.jpg'
        ],
        duration: 'Ongoing',
        challengeResolution: 'Balancing the strict community architectural guidelines with the client\'s unique vision.',
        features: ['Custom Millwork', 'Smart Home Integration', 'Landscape Architecture']
      },
      result: {
        images: [
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-3-atv8.jpg',
          '/ahw-projects-assets/17-IL bosco VILLA- NEW Cabital/Orignal/il-bosco-villa-new-cabital-interior-detail-8-ojx7.jpg'
        ],
        outcomes: ['Approval of all architectural and interior designs', 'Setting a new standard for luxury in the New Capital']
      },
      relatedProjects: ['khiran-chalet-kuwait', 'fintas-apartment-kuwait'],
      relatedExpertise: {
        title: 'Residential Architecture',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'Designing Within the Rules, Not Around Them.',
        heroSubtitle: "Gated communities like IL Bosco exist because their architectural guidelines protect a shared standard — which means a client's personal vision has to be realized inside someone else's rulebook, not instead of it. This villa is currently in design, being shaped by exactly that negotiation.",
        story: [
          "New Capital's planned communities set strict architectural guidelines for a reason: consistency protects every resident's investment, not just one client's preference. That's a real constraint, not a bureaucratic one — and it means a distinctive villa can't be designed in isolation from the rulebook governing everything around it.",
          "The design phase has centered on that negotiation: how to give the client's vision — large glazed facades, natural materials, an airy indoor-outdoor connection — its full expression while staying inside community guidelines that weren't written with any single house in mind. All architectural and interior designs have been approved to date, with the project now moving toward construction."
        ],
        designPhilosophy: "Large glazed facades and natural materials were chosen to create openness and light without visually competing with the surrounding streetscape — a design language distinctive enough to feel personal, disciplined enough to fit inside a shared architectural code.",
        whyDifferent: "This project is a live example of designing inside constraint rather than around it. The measure of success isn't a dramatic departure from the neighborhood — it's a villa that reads as clearly the client's own while never breaking the architectural agreement every resident in the community signed onto.",
        clientExperience: [
          'Full design approval secured within strict community architectural guidelines',
          'A vision-first process that treated the guidelines as a design constraint, not an obstacle',
          'Moving from approved design into construction'
        ],
        faq: [
          { question: 'Is IL Bosco Villa completed?', answer: 'No — the project is currently in design phase, with all architectural and interior designs approved and construction planning underway.' },
          { question: 'What was the main design challenge?', answer: "Balancing IL Bosco's strict community architectural guidelines with the client's specific vision for the villa." },
          { question: 'What is the design direction?', answer: 'Large glazed facades and natural materials, creating an airy connection between indoor and outdoor living spaces.' }
        ],
        cta: {
          headline: 'Designing Inside a Gated Community\'s Guidelines?',
          subtext: "Let's talk about a process that treats the rulebook as a constraint to design well within, not around."
        },
        seo: {
          title: 'IL Bosco Villa Design — New Capital, Egypt | AHW Architects',
          description: 'A private villa in IL Bosco, New Capital, currently in design — balancing community architectural guidelines with the client\'s vision. By AHW Architects.',
          focusKeyword: 'villa design New Capital',
          secondaryKeywords: ['IL Bosco villa architecture', 'gated community villa design Egypt', 'New Capital residential architecture', 'villa design guidelines'],
          ogTitle: 'A Villa Designed Inside a Gated Community\'s Architectural Guidelines',
          ogDescription: 'Currently in design: a private villa in IL Bosco, New Capital, balancing a client\'s vision with strict community architectural rules.',
          twitterTitle: 'IL Bosco Villa: In Design, In New Capital',
          twitterDescription: 'A private villa taking shape inside IL Bosco\'s architectural guidelines, designed by AHW Architects.'
        }
      }
    }
  },
  {
    id: '01',
    slug: "sultan-center-hawally-kuwait",
    title: 'Sultan Center Hawally',
    sector: 'Retail',
    city: 'Hawally',
    market: 'Kuwait',
    area: '4500',
    year: '2022',
    tier: 'Flagship',
    services: ['Renovation', 'Remodelling'],
    client: 'Sultan Center',
    status: 'Completed',
    resultStatement: 'A 4,500 sqm renovation and remodelling of Sultan Center\'s Hawally branch, delivered by AHW Architects.',
    heroImage: '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-9-jkp4.png',
    hubFlagshipImage: '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-10-trna.png',
    ogImage: '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-9-jkp4.png',
    caseStudy: {
      brief: {
        clientProblem: 'The client required a complete overhaul of their 4,500 sqm flagship branch to modernize the retail experience while minimizing operational downtime.',
        definitionalSentence: 'A comprehensive retail transformation blending modern aesthetics with high-efficiency commercial flow.'
      },
      design: {
        images: [
          '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-11-3agu.png',
          '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-12-4p3d.png'
        ],
        keyDecision: 'Implementing a phased renovation strategy with modular design elements to ensure rapid deployment.'
      },
      build: {
        images: [
          '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-13-1ktm.png',
          '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-14-8j9c.png'
        ],
        duration: '6 Months',
        challengeResolution: 'Working in shifts to execute heavy structural modifications without interrupting the store\'s daily operations.',
        features: ['Upgraded HVAC Systems', 'Custom Lighting Fixtures', 'Premium Floor Finishes']
      },
      result: {
        images: [
          '/ahw-projects-assets/01-sultan-center-hawally/Orignal/sultan-center-hawally-interior-detail-15-vilz.jpg'
        ],
        outcomes: ['Significantly improved customer footfall', 'Enhanced brand perception', 'Delivered on time and within budget']
      },
      relatedProjects: ['samsung-store-nasr-city-egypt'],
      relatedExpertise: {
        title: 'Retail Renovation',
        href: '/expertise/design-build'
      },
      narrative: {
        heroHeadline: 'Renovating a Store That Never Closed.',
        heroSubtitle: "A 4,500 sqm flagship branch can't simply shut its doors for a renovation without losing the customers it's trying to win back. Sultan Center's Hawally branch needed a complete overhaul of its retail experience — delivered without a single day of closure.",
        story: [
          "The brief carried a constraint most renovations don't have to solve for: the store had to keep trading throughout construction. Closing a flagship branch, even temporarily, meant losing footfall to competitors and disrupting a location customers relied on daily. The renovation had to happen around the business, not instead of it.",
          "That meant a phased strategy built from modular design elements that could be deployed section by section, with heavy structural work executed in shifts to avoid interrupting trading hours. Six months later, the branch reopened section by section as work completed — culminating in a store with modernized systems, lighting, and finishes that had never once turned customers away."
        ],
        designPhilosophy: "Phasing was the design decision, not an afterthought applied to it — modular elements and a shift-based construction sequence were chosen specifically because they could be executed zone by zone without shutting the store down, which shaped the renovation strategy from the earliest planning stage.",
        whyDifferent: "Most retail renovations assume the luxury of a closed store. This one didn't have that option — a live, trading flagship branch had to be modernized around its own operating hours, which meant the construction sequencing was as much a design problem as the finishes themselves.",
        clientExperience: [
          'Zero operational downtime across the full renovation',
          'Heavy structural work scheduled in shifts around trading hours',
          'Delivered on time and within budget'
        ],
        faq: [
          { question: 'Did the store close during renovation?', answer: 'No — the branch continued trading throughout, with heavy construction work scheduled in shifts to avoid disrupting operations.' },
          { question: 'How long did the renovation take?', answer: 'Six months, covering a full 4,500 sqm branch overhaul.' },
          { question: 'What was the renovation strategy?', answer: 'A phased approach using modular design elements, allowing sections of the store to be modernized without shutting the entire branch down.' }
        ],
        cta: {
          headline: 'Renovating a Retail Space That Can\'t Afford to Close?',
          subtext: "Let's talk about a construction sequence built around your trading hours, not against them."
        },
        seo: {
          title: 'Retail Renovation Without Closing — Sultan Center Hawally | AHW Architects',
          description: 'A 4,500 sqm Sultan Center branch renovation in Hawally, Kuwait, delivered with zero operational downtime. By AHW Architects.',
          focusKeyword: 'retail renovation Kuwait',
          secondaryKeywords: ['store renovation without closing', 'Sultan Center Hawally', 'phased retail construction', 'commercial renovation Kuwait'],
          ogTitle: 'A Flagship Store Renovation With Zero Days Closed',
          ogDescription: 'How AHW renovated a 4,500 sqm Sultan Center branch in Kuwait while it stayed open and trading, start to finish.',
          twitterTitle: 'Sultan Center Hawally: Renovated Without Closing',
          twitterDescription: 'A 4,500 sqm flagship retail renovation in Kuwait, delivered in phases with zero operational downtime.'
        }
      }
    }
  },
  {
    id: '02',
    slug: "khiran-chalet-kuwait",
    title: 'Khiran Chalet',
    sector: 'Residential',
    city: 'Khiran',
    market: 'Kuwait',
    area: '2700',
    year: '2023',
    tier: 'Flagship',
    services: ['Architecture', 'Landscape'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 2,700 sqm luxurious residential chalet in Khiran, designed and executed with stunning coastal integration.',
    heroImage: '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-16-2t6d.jpg',
    hubFlagshipImage: '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-17-160t.jpg',
    ogImage: '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-16-2t6d.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client required a premium private chalet in Khiran that maximized waterfront views while ensuring privacy and luxurious outdoor living spaces.',
        definitionalSentence: 'Coastal Living Reimagined.'
      },
      design: {
        images: [
          '/ahw-projects-assets/02-khiran-chalet/design/khiran-chalet-interior-detail-18-pcft.jpg'
        ],
        keyDecision: 'Developing striking, modern elevations with expansive glass facades to seamlessly blend the indoor living areas with the coastal landscape.'
      },
      build: {
        images: [
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-19-5eov.jpg',
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-20-pn51.jpg',
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-21-msd0.jpg'
        ],
        duration: '18 Months',
        challengeResolution: 'Executing complex structural spans for the large open living areas while integrating sophisticated smart home and climate control systems.',
        features: ['Expansive Glass Facades', 'Integrated Waterfront Landscape', 'Custom Outdoor Shading']
      },
      result: {
        images: [
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-22-0nqj.jpg',
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-23-bv5b.jpg',
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-24-qqvs.jpg',
          '/ahw-projects-assets/02-khiran-chalet/orignal/khiran-chalet-interior-detail-25-jr32.jpg'
        ],
        outcomes: ['Created an iconic waterfront retreat', 'Delivered unparalleled indoor-outdoor spatial continuity']
      },
      relatedProjects: ['fintas-apartment-kuwait', 'kai-sokhna-egypt'],
      relatedExpertise: {
        title: 'Residential Architecture',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'A Waterfront Home That Refuses to Choose Between Privacy and View.',
        heroSubtitle: "Most waterfront sites force a trade-off — open the house to the water and lose privacy, or protect privacy and lose the view. This 2,700 sqm chalet in Khiran was built to resolve that tension outright: sculptural massing and angled glazing frame the coastline from every principal room, while a private pool court and considered sightlines keep the home fully shielded from its neighbors.",
        story: [
          "The brief was specific: a family wanted their waterfront address to feel like theirs alone, not shared with every boat and balcony along the shoreline. The response wasn't a wall — it was geometry. The upper volume angles and glazes toward the water; the ground floor wraps a private pool court framed by mature palms, so the most-used rooms open onto controlled, private outdoor space rather than the public shoreline.",
          "Delivering the long structural spans behind that open glazing — without visible columns breaking the view — while threading smart home and climate control invisibly through them, was the core engineering problem of the 18-month build. The result reads as effortless from the pool deck; very little about getting there was."
        ],
        designPhilosophy: "Every major glazed opening in this house points at something specific — water, palms, sky — rather than at a neighbor. Privacy here isn't solved with walls but with orientation and massing, which is why the home can be almost entirely glass on its private side and still feel enclosed.",
        whyDifferent: "Most coastal homes pick a side: dramatic glazing that sacrifices privacy, or private homes that turn their back on the water entirely. Khiran Chalet does both at once — full-height glass toward the sea, complete enclosure from the neighborhood — through massing and site strategy rather than compromise. It's the clearest expression on this site of AHW's Architecture and Landscape disciplines working as one.",
        clientExperience: [
          'A single point of accountability across architecture and landscape',
          'Structural and climate-control complexity resolved before it reached the client as a decision to make',
          'Delivered on the 18-month program agreed at the outset'
        ],
        imageStory: {
          result: 'The hero shot is taken from the pool deck looking back at the house — angled massing, a glazed upper volume catching the sky, palms framing the private pool court, and an outdoor cabana bridging the pool to the interior lounge beyond the glass.'
        },
        faq: [
          { question: 'How long did the Khiran Chalet project take?', answer: '18 months, from design through handover.' },
          { question: 'How was privacy achieved with so much glass?', answer: 'Through building orientation and massing rather than screening — glazing faces water and palms, not neighboring properties.' },
          { question: 'What services did AHW provide?', answer: 'Architecture and landscape design, delivered as one integrated scope.' }
        ],
        cta: {
          headline: 'Own a Waterfront Site in Kuwait?',
          subtext: "Let's talk about what it actually takes to open a house to the water without opening it to everyone else."
        },
        seo: {
          title: 'Khiran Chalet — Waterfront Villa Design in Kuwait | AHW Architects',
          description: 'A 2,700 sqm waterfront chalet in Khiran, Kuwait, balancing full-height glazing with total privacy. Architecture and landscape by AHW Architects.',
          focusKeyword: 'waterfront villa Kuwait',
          secondaryKeywords: ['Khiran chalet design', 'coastal architecture Kuwait', 'waterfront home Kuwait', 'private pool villa Kuwait'],
          ogTitle: 'A Waterfront Home Designed Around Privacy, Not Despite It',
          ogDescription: 'Full-height glazing toward the sea. Complete privacy from the neighborhood. See how AHW resolved both at once in Khiran, Kuwait.',
          twitterTitle: 'Khiran Chalet: Coastal Living, Fully Private',
          twitterDescription: 'A 2,700 sqm waterfront home in Kuwait, designed by AHW Architects to open to the sea without opening to the neighborhood.'
        }
      }
    }
  },
  {
    id: '03',
    slug: "aliaa-behbehani-lawyer-office-bneid-al-gar",
    title: 'Lawyer Aliaa Behbehani Offices',
    sector: 'Workplace',
    city: 'Bneid Al Gar',
    market: 'Kuwait',
    area: '750',
    year: 'TBD',
    tier: 'Flagship',
    services: ['Architecture', 'Interior Design', 'Fit-out'],
    client: 'Aliaa Behbehani',
    status: 'Completed',
    resultStatement: 'A 750 sqm office fit-out for a private legal practice in Bneid Al Gar, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-26-925j.jpg',
    hubFlagshipImage: '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-27-kk8i.jpg',
    ogImage: '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-26-925j.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed a prestigious, highly functional workspace that exudes authority while maintaining confidentiality and comfort for high-profile legal clients.',
        definitionalSentence: 'A sophisticated legal workplace where classic authority meets contemporary architectural precision.'
      },
      design: {
        images: [
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-28-2tjr.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-29-s6hd.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-30-yvtp.jpg'
        ],
        keyDecision: 'Utilizing rich, warm wood tones contrasted with sleek modern furnishings to create an atmosphere of trust and modernity.'
      },
      build: {
        images: [
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-31-vt0o.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-32-8psh.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-33-ru90.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-34-kx8o.jpg'
        ],
        duration: '4 Months',
        challengeResolution: 'Implementing advanced acoustic insulation throughout the private offices and meeting rooms to ensure absolute client confidentiality.',
        features: ['Acoustic Paneling', 'Custom Executive Desks', 'Integrated Ambient Lighting']
      },
      result: {
        images: [
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-35-unrj.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-36-8828.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-37-win7.jpg',
          '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-38-ckpg.jpg'
        ],
        outcomes: ['Created a highly professional and secure environment', 'Enhanced the firm\'s premium brand identity', 'Optimized spatial flow for staff and clients']
      },
      relatedProjects: ['ahw-architects-hq-maadi-egypt'],
      relatedExpertise: {
        title: 'Workplace Design',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'An Office Built to Keep Secrets.',
        heroSubtitle: "A legal practice sells trust before it sells anything else, and trust starts with the room a client is shown into. This 750 sqm office in Bneid Al Gar was designed so every space projects authority on sight, while the walls themselves — not just the staff — protect what gets said inside them.",
        story: [
          "A law office has a harder brief than most workplaces: it has to look and feel authoritative to a client walking in for the first time, while guaranteeing that nothing said in a meeting room travels beyond it. Those two goals usually pull a design in opposite directions — grandeur reads as open, privacy reads as closed off.",
          "The resolution here was material, not spatial. Rich wood tones and considered furnishings do the work of projecting authority, while acoustic paneling built into private offices and meeting rooms — invisible to a visitor — does the work of protecting confidentiality. Delivered in four months, the office had to be fully operational and fully soundproofed from the day it opened; there was no phased option for a working legal practice."
        ],
        designPhilosophy: "Authority and privacy were treated as two different design problems solved with two different tools: warm materials and considered furnishings for the first, acoustic engineering built into the walls for the second. Neither is visible as a separate layer — a client experiences the room, not the acoustic treatment behind it.",
        whyDifferent: "Most office fit-outs optimize for how a space looks. This one had to optimize equally for what a space doesn't let through the walls — a requirement specific to legal practice that shaped construction decisions most workplace projects never have to make.",
        clientExperience: [
          'A four-month timeline held for a fully operational legal practice',
          'Acoustic performance built in during construction, not retrofitted',
          'A single design and fit-out partner for every space in the office'
        ],
        faq: [
          { question: 'How long did the office fit-out take?', answer: 'Four months, from design through handover.' },
          { question: 'How was client confidentiality addressed architecturally?', answer: 'Through acoustic paneling integrated into the private offices and meeting rooms during construction, not added afterward.' },
          { question: 'What was the design approach?', answer: 'Rich wood tones paired with sleek modern furnishings, creating an atmosphere of authority and trust for high-profile legal clients.' }
        ],
        cta: {
          headline: 'Designing a Practice Where Discretion Matters?',
          subtext: "Let's talk about a workplace that protects what's said inside it, not just how it looks."
        },
        seo: {
          title: 'Law Office Design & Fit-Out in Kuwait | AHW Architects',
          description: 'A 750 sqm legal office fit-out in Bneid Al Gar, Kuwait, engineered for acoustic privacy and designed to project authority. By AHW Architects.',
          focusKeyword: 'law office design Kuwait',
          secondaryKeywords: ['legal office fit-out Kuwait', 'office acoustic design', 'workplace interior design Kuwait', 'Bneid Al Gar office fit-out'],
          ogTitle: 'An Office Designed to Protect What Gets Said Inside It',
          ogDescription: 'A 750 sqm legal practice in Kuwait where acoustic engineering and material choice work together — authority on sight, confidentiality by design.',
          twitterTitle: 'A Law Office Built to Keep Secrets',
          twitterDescription: 'Inside a 750 sqm Kuwait legal office where the walls themselves protect client confidentiality. By AHW Architects.'
        }
      }
    }
  },
  {
    id: '04',
    slug: "fintas-apartment-kuwait",
    title: 'Fintas Apartment Building',
    sector: 'Residential',
    city: 'Khiran',
    market: 'Kuwait',
    area: '3850',
    year: '2020',
    tier: 'Flagship',
    services: ['Architecture', 'Design & Build'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 3,850 sqm residential apartment building in Khiran, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-39-x3x3.jpg',
    hubFlagshipImage: '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-40-3566.jpg',
    ogImage: '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-41-cpas.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client sought a complete design-and-build partner capable of delivering a high-quality residential apartment building from concept through construction — a contemporary development combining architectural appeal, efficient planning, construction quality, and long-term investment value, without the complexity of managing multiple contractors.',
        definitionalSentence: 'A fully integrated Design & Build residential development in Khiran, delivered from concept through construction as a single-partner project.'
      },
      design: {
        images: [
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-42-qe61.jpg',
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-43-m1kd.jpg'
        ],
        keyDecision: 'A simple yet elegant architectural language paired with efficient structural planning, with apartment layouts optimized for functionality, natural daylight, and ventilation while keeping construction and future maintenance cost-efficient.'
      },
      build: {
        images: [
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-44-w126.jpg',
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-45-5zp7.jpg'
        ],
        duration: 'Delivered in 2020',
        challengeResolution: 'Coordinating architectural, structural, and MEP activities in parallel required continuous on-site supervision; integrated project management and close cross-discipline coordination kept the project progressing efficiently without compromising quality.',
        features: ['Modern Architectural Façade', 'Optimized Residential Floor Planning', 'Generous Natural Lighting Throughout', 'Durable Low-Maintenance Exterior Finishes']
      },
      result: {
        images: [
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-46-1v8o.jpg',
          '/ahw-projects-assets/04-fintas-apartment/fintas-apartment-interior-detail-47-mhv7.jpg'
        ],
        outcomes: ['Successfully completed and handed over in 2020', 'Delivered as a fully integrated Design & Build project', "Enhanced the site's residential value through quality architecture and construction"]
      },
      relatedProjects: ['il-bosco-villa-new-capital-egypt', 'khiran-chalet-kuwait'],
      relatedExpertise: {
        title: 'Residential Design & Build',
        href: '/expertise/design-build'
      },
      narrative: {
        heroHeadline: 'One Team, One Building, No Handoffs.',
        heroSubtitle: "Multi-unit residential development usually means a client managing an architect, a structural engineer, and a contractor separately — and absorbing the risk when their timelines and drawings don't line up. This 3,850 sqm apartment building in Khiran was delivered by a single team from first sketch to final handover, with nothing to coordinate but one relationship.",
        story: [
          "The client's goal wasn't just a building — it was an investment they didn't have to manage day to day. Multi-contractor developments put that risk on the owner: if the architect's drawings and the contractor's site reality don't match, someone has to catch it, usually the client. AHW took that coordination problem off the table entirely by running architecture and construction as one scope, one team, one accountable party.",
          "That structure paid off during execution: architectural, structural, and MEP work had to progress in parallel across the building, and doing that without a general contractor as an intermediary required continuous on-site supervision from AHW's own team. The building was handed over complete in 2020 — an asset the client could rent, sell, or hold with a track record already attached to it."
        ],
        designPhilosophy: "The architectural language stays intentionally restrained — clean facades, efficient floor plates — because the primary design goal here wasn't visual statement, it was long-term performance: apartments that get daylight and ventilation right, and a building envelope that stays low-maintenance for the owner for years after handover.",
        whyDifferent: "This wasn't a villa or a signature building — it was a mid-size residential investment where the real value AHW delivered was removing coordination risk from the client entirely. One design-and-build partner, one accountable timeline, one point of contact from concept to the day the keys were handed over.",
        clientExperience: [
          'A single design-and-build contract instead of separate architect and contractor relationships',
          'Continuous on-site supervision through parallel architectural, structural, and MEP work',
          'Delivered as a complete, ready-to-operate asset in 2020'
        ],
        faq: [
          { question: 'What does "Design & Build" mean for a project like this?', answer: 'AHW Architects held both the design and construction scope directly, so the client had one accountable partner instead of coordinating separate architecture and contracting firms.' },
          { question: 'How big is the Fintas Apartment Building?', answer: '3,850 sqm, completed and handed over in 2020.' },
          { question: 'What was the main design priority?', answer: 'Functional, cost-efficient apartment layouts with strong natural daylight and ventilation, built for long-term maintenance efficiency.' }
        ],
        cta: {
          headline: 'Developing a Residential Building in Kuwait?',
          subtext: "Let's talk about handing off one relationship instead of managing three."
        },
        seo: {
          title: 'Residential Design & Build in Khiran, Kuwait | AHW Architects',
          description: 'A 3,850 sqm apartment building in Khiran, Kuwait, delivered concept-to-handover by a single Design & Build partner. By AHW Architects.',
          focusKeyword: 'design and build Kuwait',
          secondaryKeywords: ['apartment building Kuwait', 'residential development Khiran', 'design build contractor Kuwait', 'turnkey apartment construction'],
          ogTitle: 'A Residential Building Delivered by One Accountable Partner',
          ogDescription: 'No separate architect, no separate contractor — a 3,850 sqm apartment building in Kuwait delivered concept-to-handover by one team.',
          twitterTitle: 'Fintas Apartment: One Partner, Concept to Handover',
          twitterDescription: 'A 3,850 sqm residential building in Khiran, Kuwait, delivered as a single Design & Build scope by AHW Architects.'
        }
      }
    }
  },
  {
    id: '05',
    slug: "samsung-store-nasr-city-egypt",
    title: 'Samsung Store',
    sector: 'Retail',
    city: 'Nasr City',
    market: 'Egypt',
    area: '130',
    year: 'TBD',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'Samsung (Hassan Al Maamoun)',
    status: 'Completed',
    resultStatement: 'A 130 sqm retail fit-out for a Samsung store in Nasr City, built by AHW Architects.',
    heroImage: '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-exterior-facade-4cks.png',
    hubFlagshipImage: '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-interior-detail-49-u6zb.png',
    ogImage: '/ahw-projects-assets/05-samsung-nasr-city/samsung-nasr-city-interior-detail-50-akfw.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The brand required a meticulous fit-out that aligns with global corporate standards while optimizing the 130 sqm layout for high foot traffic and product visibility.',
        definitionalSentence: 'A precision-driven retail environment designed to highlight technology through minimalist architecture.'
      },
      design: {
        images: [
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-interior-detail-49-u6zb.png',
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-interior-detail-51-5mrw.png'
        ],
        keyDecision: 'To utilize clean lines, premium materials, and highly calculated lighting angles to ensure products remain the focal point.'
      },
      build: {
        images: [
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-interior-detail-52-2t2j.png',
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-interior-detail-53-cbcn.png'
        ],
        duration: '2 Months',
        challengeResolution: 'Executing a flawless fit-out within a tight timeline without compromising Samsung\'s strict international quality control measures.',
        features: ['Custom Display Units', 'High-Lumen Lighting', 'Seamless Flooring']
      },
      result: {
        images: [
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-exterior-facade-4cks.png',
          '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-exterior-facade-74qj.png'
        ],
        outcomes: ['Passed all global brand audits on the first inspection', 'Enhanced customer journey and product engagement', 'Delivered within strict timeframes']
      },
      relatedProjects: ['giorgio-di-mare-avenues-kuwait'],
      relatedExpertise: {
        title: 'Retail Fit-out',
        href: '/expertise/fit-out'
      },
      narrative: {
        heroHeadline: '130 Square Meters, Zero Margin for Error.',
        heroSubtitle: "Global brand retail doesn't grade on effort — a store either passes international audit standards or it doesn't reopen. This Samsung store in Nasr City had to hit that bar inside a tight 130 sqm footprint, on a two-month timeline, with the product itself doing all the talking.",
        story: [
          "A global electronics brand doesn't hand a fit-out team much room for interpretation: display specifications, lighting standards, and material finishes are set centrally and audited on delivery. The job wasn't to design something distinctive — it was to execute a demanding brief with total precision inside a footprint small enough that every centimeter of layout mattered.",
          "With two months to deliver and Samsung's own quality control auditing the result, there was no buffer for rework. The store passed its global brand audit on first inspection — the clearest possible signal that execution matched specification exactly, not approximately."
        ],
        designPhilosophy: "In a 130 sqm retail box for a technology brand, the product is the design language — clean lines, calculated lighting angles, and seamless flooring exist to keep attention on the devices, not the architecture around them. Restraint was the deliverable.",
        whyDifferent: "Most fit-out projects are judged on how they look. This one was judged on a pass/fail global brand audit, with no room for the usual post-handover punch list — the store had to be right on the first inspection, at a scale where there was nowhere to hide an error.",
        clientExperience: [
          'A two-month timeline held against strict international brand standards',
          'First-inspection pass on Samsung\'s global quality audit',
          'Full compliance delivered inside a compact 130 sqm footprint'
        ],
        faq: [
          { question: 'How long did the Samsung store fit-out take?', answer: 'Two months, start to finish.' },
          { question: 'What made this project demanding?', answer: 'Meeting Samsung\'s strict global brand and quality standards inside a compact 130 sqm retail footprint, with the store passing its brand audit on the first inspection.' },
          { question: 'What was AHW\'s scope?', answer: 'Interior design and fit-out, executed to global corporate retail specifications.' }
        ],
        cta: {
          headline: 'Rolling Out a Retail Brand Standard in Egypt?',
          subtext: "Let's talk about execution that passes audit on the first try."
        },
        seo: {
          title: 'Samsung Store Fit-Out in Nasr City, Egypt | AHW Architects',
          description: 'A 130 sqm Samsung retail fit-out in Nasr City, Egypt, delivered to global brand standards and passed on first audit. By AHW Architects.',
          focusKeyword: 'retail fit-out Egypt',
          secondaryKeywords: ['Samsung store design', 'brand retail fit-out Cairo', 'commercial interior design Egypt', 'global brand store standards'],
          ogTitle: 'A Retail Fit-Out Built to Pass Global Brand Audit on the First Try',
          ogDescription: 'Inside a 130 sqm Samsung store in Nasr City, delivered in two months to strict international brand standards.',
          twitterTitle: 'Samsung Store: Precision at 130 sqm',
          twitterDescription: 'A compact Samsung retail fit-out in Egypt, delivered to global brand standards by AHW Architects.'
        }
      }
    }
  },
  {
    id: '06',
    slug: "ahw-architects-hq-maadi-egypt",
    title: 'AHW Architects HQ',
    sector: 'Workplace',
    city: 'Zahraa Al Maadi',
    market: 'Egypt',
    area: '110',
    year: '2022',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'AHW Architects',
    status: 'Completed',
    resultStatement: 'A 110 sqm office fit-out for AHW Architects\'s own Egypt headquarters in Zahraa Al Maadi.',
    heroImage: '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg',
    hubFlagshipImage: '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg',
    ogImage: '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'Designing our own Egypt headquarters required a space that not only fosters creativity and collaboration but also serves as a living showroom of our design and build capabilities.',
        definitionalSentence: 'A modern, collaborative workspace that embodies the AHW design philosophy.'
      },
      design: {
        images: [
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-56-xtgu.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-57-eggh.jpg'
        ],
        keyDecision: 'Opting for an open-plan layout with exposed industrial ceilings, warm natural wood elements, and strategic lighting to define different working zones.'
      },
      build: {
        images: [
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-58-oill.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-59-csr9.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-60-6k4d.jpg'
        ],
        duration: '2 Months',
        challengeResolution: 'Executing premium finishes within a tight space while integrating comprehensive electrical and networking infrastructure for an architectural design team.',
        features: ['Exposed Ceiling', 'Custom Joinery', 'Glass Partitions']
      },
      result: {
        images: [
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-61-1bm4.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-62-osee.jpg',
          '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-interior-detail-63-r2s5.jpg'
        ],
        outcomes: ['Created a highly inspiring work environment', 'Serves as a tangible portfolio piece for visiting clients']
      },
      relatedProjects: ['aliaa-behbehani-lawyer-office-bneid-al-gar'],
      relatedExpertise: {
        title: 'Workplace Design',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: 'An Office Designed to Feel Like Home, Not a Showroom.',
        heroSubtitle: "When the client is your own firm, the brief writes itself differently. Rather than a typical corporate office, AHW's 110 sqm Egypt headquarters in Zahraa Al Maadi was built to feel warm and welcoming for the team that works there every day and the clients who walk in to judge the firm by it.",
        story: [
          "Designing your own Egypt headquarters comes with a specific kind of pressure: it has to work as a daily workspace and double as a credible showroom of what the firm can do, inside a footprint of only 110 sqm and a ceiling height that left little room for architectural flourish.",
          "The response leaned on material warmth instead of scale — natural wood finishes and warm neutral tones that make the space feel closer to a home than a typical studio, while a professional client reception area was carved out without eating into the working space the team relies on. Delivered in two months, the office had to open functioning as both at once from day one."
        ],
        designPhilosophy: "With limited floor area and a low ceiling, the office couldn't rely on volume to feel generous — so warmth came from materials instead: natural wood, neutral tones, and lighting that softens the compact footprint rather than fighting it.",
        whyDifferent: "Most office fit-outs serve one audience — the team that works there. This one had to serve two at once: a functional daily studio for AHW's own architects, and a credible first impression for clients judging the firm by the room they're sitting in, inside a constrained 110 sqm footprint.",
        clientExperience: [
          'A two-month delivery timeline for a fully functioning studio and client reception',
          "The space now serves as AHW's own portfolio piece for visiting clients",
          'Custom furniture and joinery integrated throughout, consistent with AHW\'s standard approach to every project'
        ],
        faq: [
          { question: 'How big is the AHW Architects Egypt headquarters?', answer: '110 sqm, located in Zahraa Al Maadi, Cairo.' },
          { question: 'What was the main design constraint?', answer: 'A compact 110 sqm footprint combined with a low ceiling height, while still needing a professional client reception area alongside the working studio.' },
          { question: 'How long did the fit-out take?', answer: 'Two months, from design through handover.' }
        ],
        cta: {
          headline: 'Designing a Studio or Office That Reflects Your Culture?',
          subtext: "Let's talk about a workspace built around how your team actually works, not a generic corporate template."
        },
        seo: {
          title: 'AHW Architects Studio — Office Design in Maadi, Cairo | AHW Architects',
          description: "AHW Architects' own 110 sqm studio in Zahraa Al Maadi, Cairo — a warm, home-like workspace designed within a compact footprint.",
          focusKeyword: 'office interior design Cairo',
          secondaryKeywords: ['architecture studio design', 'workplace design Egypt', 'office fit-out Maadi', 'small office design Cairo'],
          ogTitle: "Inside AHW Architects' Own Studio in Cairo",
          ogDescription: 'A 110 sqm office designed to feel like home for the team and credible on sight for visiting clients — AHW Architects\' own Egypt headquarters.',
          twitterTitle: "AHW's Own Studio: Small Footprint, Real Warmth",
          twitterDescription: "A look inside AHW Architects' 110 sqm Egypt headquarters in Zahraa Al Maadi, Cairo."
        }
      }
    }
  },
  {
    id: '07',
    slug: "stone-residence-new-cairo-egypt",
    title: 'Stone Residence',
    sector: 'Residential',
    city: 'New Cairo',
    market: 'Egypt',
    area: '220',
    year: '2023',
    tier: 'Standard',
    services: ['Interior Design', 'Renovation'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 220 sqm residential renovation in New Cairo, improved and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-outdoor-landscape-m4bv.jpg',
    hubFlagshipImage: '/ahw-projects-assets/07-stone-residence-new-cairo/hub-flagship.jpg',
    ogImage: '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-outdoor-landscape-m4bv.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed a complete renovation to modernize the interior and improve spatial flow.',
        definitionalSentence: 'A masterclass in modernizing a residential space without losing its structural integrity.'
      },
      design: {
        images: [
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-interior-detail-66-ev5x.jpg',
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-interior-detail-67-ztwr.jpg'
        ],
        keyDecision: 'To maximize the flow of natural light while maintaining clear functional zones within the 220 sqm footprint.'
      },
      build: {
        images: [
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-interior-detail-68-9tlq.jpg',
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-interior-detail-69-k255.jpg'
        ],
        duration: '4 Months',
        challengeResolution: 'Navigating strict community regulations for structural modifications without compromising the open-plan design intent.',
        features: ['Custom Joinery', 'Smart Lighting', 'Premium Finishes']
      },
      result: {
        images: [
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-outdoor-landscape-m4bv.jpg',
          '/ahw-projects-assets/07-stone-residence-new-cairo/result/stone-residence-new-cairo-outdoor-landscape-9rok.jpg'
        ],
        outcomes: ['Delivered exactly on schedule', 'Seamless integration of smart systems', 'Exceeded client expectations for spatial efficiency']
      },
      relatedProjects: ['sultan-center-hawally-kuwait', 'beit-al-watan-residential-new-cairo-egypt'],
      relatedExpertise: {
        title: 'Interior Design',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: 'Rebuilding a Layout Without Rebuilding the Building.',
        heroSubtitle: "A 220 sqm apartment in New Cairo needed to work like a different home entirely — without touching the structure around it. The renovation re-planned the layout from the inside out, merging rooms, relocating services, and fitting a maid's room into the kitchen zone without shrinking the spaces around it.",
        story: [
          "Compound regulations meant the building's structure was fixed — no expanding the footprint, no altering the shell. Everything the client needed had to come from re-planning what was already inside those four walls: rooms merged where the old layout wasted space, service areas relocated to where they actually made sense, and daylight allowed to move more freely through the plan.",
          "The most specific problem was space that had to do double duty: fitting a fully functional maid's room inside the kitchen zone without compromising the kitchen's own proportions or usability. Threaded through all of it was a Smart Home integration layer, retrofitted into a renovation rather than planned into new construction from day one — a harder sequencing problem than it sounds."
        ],
        designPhilosophy: "Every square meter had to justify itself twice — once for its stated purpose, once for what it gave up elsewhere in the plan. Merging and relocating rooms only works when the daylight and circulation logic of the whole apartment is redrawn together, not room by room.",
        whyDifferent: "This wasn't a blank-slate renovation — every decision had to work within a fixed structural shell and compound regulations that ruled out the easier fixes. The maid's-room-inside-the-kitchen-zone solution is the clearest example: a real spatial puzzle solved without shrinking the room around it.",
        clientExperience: [
          'A full re-plan of the apartment layout within a fixed structural shell',
          'Smart Home systems integrated into an existing structure, not new construction',
          'Delivered in full compliance with compound structural regulations'
        ],
        faq: [
          { question: 'What made this renovation different from a typical fit-out?', answer: "The building's structure couldn't be altered, so the entire apartment layout had to be re-planned within a fixed shell — merging rooms and relocating service areas rather than expanding the footprint." },
          { question: 'What was the most specific design challenge?', answer: "Fitting a functional maid's room inside the kitchen zone without reducing the kitchen's own proportions or usability." },
          { question: 'Was Smart Home technology included?', answer: 'Yes — Smart Home systems were integrated as part of the renovation scope.' }
        ],
        cta: {
          headline: 'Renovating Within Compound Regulations You Can\'t Get Around?',
          subtext: "Let's talk about redesigning what's possible inside the walls you already have."
        },
        seo: {
          title: 'Residential Renovation in New Cairo | AHW Architects',
          description: 'A 220 sqm apartment renovation in New Cairo — full layout re-plan and Smart Home integration within a fixed structural shell. By AHW Architects.',
          focusKeyword: 'apartment renovation Cairo',
          secondaryKeywords: ['residential renovation Egypt', 'smart home renovation Cairo', 'interior renovation New Cairo', 'apartment layout redesign'],
          ogTitle: 'A Full Apartment Re-Plan Without Touching the Structure',
          ogDescription: 'How AHW re-planned a 220 sqm New Cairo apartment — merged rooms, relocated services, and integrated Smart Home — within fixed compound regulations.',
          twitterTitle: 'Stone Residence: A New Layout, Same Shell',
          twitterDescription: 'A 220 sqm apartment renovation in New Cairo, replanned from the inside out by AHW Architects.'
        }
      }
    }
  },
  {
    id: '08',
    slug: "kai-sokhna-egypt",
    title: 'KAI Sokhna',
    sector: 'Residential',
    city: 'Ain Al Sokhna',
    market: 'Egypt',
    area: '140',
    year: '2024',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 140 sqm turnkey residential summer home in Ain Al Sokhna, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-71-mtc5.jpg',
    hubFlagshipImage: '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-72-rlul.jpg',
    ogImage: '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-71-mtc5.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client desired a modern, serene seaside retreat that maximizes natural light and provides a seamless indoor-outdoor connection for family gatherings.',
        definitionalSentence: 'A contemporary coastal sanctuary blending minimalist luxury with warm natural tones.'
      },
      design: {
        images: [
          '/ahw-projects-assets/08-kai-sokhna/design/kai-sokhna-interior-detail-73-07mb.jpg',
          '/ahw-projects-assets/08-kai-sokhna/design/kai-sokhna-interior-detail-74-cizu.jpg',
          '/ahw-projects-assets/08-kai-sokhna/design/kai-sokhna-interior-detail-75-ptse.jpg'
        ],
        keyDecision: 'Using a light color palette, open-plan layout, and natural textures to create an airy, sophisticated coastal atmosphere.'
      },
      build: {
        images: [
          '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-76-duas.jpg',
          '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-77-i02f.jpg'
        ],
        duration: '3 Months',
        challengeResolution: 'Navigating remote location logistics to ensure timely delivery of high-quality custom joinery and imported materials without compromising the schedule.',
        features: ['Custom Woodwork', 'Integrated Smart Lighting', 'Durable Coastal Finishes']
      },
      result: {
        images: [
          '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-72-rlul.jpg',
          '/ahw-projects-assets/08-kai-sokhna/build/kai-sokhna-interior-detail-71-mtc5.jpg'
        ],
        outcomes: ['Delivered a turnkey summer home on schedule', 'Seamless transition from 3D design to actual build', 'Exceptional finish quality recognized by the client']
      },
      relatedProjects: ['il-bosco-villa-new-capital-egypt'],
      relatedExpertise: {
        title: 'Interior Design',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: "Building a Vacation Home Where the Nearest Supplier Isn't Nearby.",
        heroSubtitle: "A 140 sqm weekend retreat in Ain Sokhna comes with a problem villas in the city never face: every custom piece, every imported material, has to survive a trip down the coast before it becomes part of the house. The design had to be as resolved on paper as it needed to be forgiving on-site.",
        story: [
          "A vacation home is judged by how effortless it feels once you're there — which is exactly what makes it hard to build. Ain Sokhna's distance from Cairo turns every material decision into a logistics decision: custom joinery and imported finishes can't be adjusted on a whim once they're committed to a delivery schedule.",
          "The interior design leaned into that constraint rather than fighting it — a light palette, open-plan layout, and natural textures that don't depend on intricate on-site customization to read as considered. Coordinating delivery of custom woodwork and imported materials to a remote coastal site, without letting logistics slow the three-month build, was the real work behind the calm the finished house presents."
        ],
        designPhilosophy: "An open-plan layout and a light, natural material palette were chosen partly for how they feel — airy, coastal, unhurried — and partly because they're more forgiving to build at distance than a design that depends on constant on-site adjustment.",
        whyDifferent: "Most residential interiors are judged purely on the finished room. This one had a second, invisible success metric: getting custom-made, imported materials to a remote site on schedule without compromising quality — a supply chain problem as much as a design one.",
        clientExperience: [
          'A three-month build coordinated around remote-site delivery logistics',
          'Custom woodwork and imported materials delivered on schedule',
          "A finish quality the client recognized as matching the original 3D design intent"
        ],
        faq: [
          { question: 'What made building in Ain Sokhna difficult?', answer: 'Coordinating delivery of custom joinery and imported materials to a remote coastal site, without letting logistics compromise the three-month construction schedule.' },
          { question: 'What is KAI Sokhna used for?', answer: "A weekend and vacation retreat for family use." },
          { question: 'How long did construction take?', answer: 'Three months.' }
        ],
        cta: {
          headline: 'Building a Vacation Home on the North Coast or Ain Sokhna?',
          subtext: "Let's talk about a design that holds up to remote-site logistics, not just renders well."
        },
        seo: {
          title: 'Vacation Home Interior Design — Ain Sokhna, Egypt | AHW Architects',
          description: 'A 140 sqm vacation home in Ain Sokhna, Egypt, designed and delivered to a remote coastal site in three months. By AHW Architects.',
          focusKeyword: 'vacation home design Egypt',
          secondaryKeywords: ['Ain Sokhna interior design', 'coastal home design Egypt', 'summer house interior Egypt', 'remote site construction Egypt'],
          ogTitle: 'A Coastal Retreat Built Three Hours From Its Own Supply Chain',
          ogDescription: 'Inside a 140 sqm vacation home in Ain Sokhna, delivered on schedule despite the logistics of building on a remote coastline.',
          twitterTitle: 'KAI Sokhna: A Retreat Built at a Distance',
          twitterDescription: 'A 140 sqm coastal vacation home in Ain Sokhna, Egypt, by AHW Architects.'
        }
      }
    }
  },
  {
    id: '09',
    slug: "giorgio-di-mare-avenues-kuwait",
    title: 'Giorgio Di Mare',
    sector: 'Retail',
    city: 'The Avenues',
    market: 'Kuwait',
    area: '140',
    year: '2021',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'Giorgio Di Mare',
    status: 'Completed',
    resultStatement: 'A 140 sqm retail fit-out for an Italian fashion boutique in The Avenues, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/09-giorgio-di-mare-avenues/design/giorgio-di-mare-avenues-interior-detail-78-hiqh.jpg',
    hubFlagshipImage: '/ahw-projects-assets/09-giorgio-di-mare-avenues/orignal/giorgio-di-mare-avenues-interior-detail-79-lyxf.jpg',
    ogImage: '/ahw-projects-assets/09-giorgio-di-mare-avenues/design/giorgio-di-mare-avenues-interior-detail-78-hiqh.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed a highly premium, inviting retail environment that reflects the luxurious Italian fashion brand identity in one of Kuwait\'s busiest malls.',
        definitionalSentence: 'A photorealistic, highly polished commercial retail space for Giorgio Di Mare.'
      },
      design: {
        images: [
          '/ahw-projects-assets/09-giorgio-di-mare-avenues/design/giorgio-di-mare-avenues-interior-detail-78-hiqh.jpg'
        ],
        keyDecision: 'Using a combination of deep blue accents, glossy metallic fixtures, and a bright, expansive lighting scheme to highlight the apparel and create a spacious feel.'
      },
      build: {
        images: [
          '/ahw-projects-assets/09-giorgio-di-mare-avenues/orignal/giorgio-di-mare-avenues-interior-detail-80-9duf.jpg',
          '/ahw-projects-assets/09-giorgio-di-mare-avenues/orignal/giorgio-di-mare-avenues-interior-detail-81-ihld.jpg'
        ],
        duration: '3 Months',
        challengeResolution: 'Executing the intricate metallic and glossy blue finishes exactly as conceptualized in the 3D design to ensure a seamless transition from concept to reality.',
        features: ['Glossy Blue Finishes', 'Custom Lighting', 'Premium Retail Fixtures']
      },
      result: {
        images: [
          '/ahw-projects-assets/09-giorgio-di-mare-avenues/orignal/giorgio-di-mare-avenues-interior-detail-79-lyxf.jpg'
        ],
        outcomes: ['Delivered an exact match to the design concept', 'Created a flagship retail presence in The Avenues']
      },
      relatedProjects: ['tmreya-cafe-kout-mall-kuwait'],
      relatedExpertise: {
        title: 'Retail Design',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: 'A Franchise Fit-Out With Zero Room to Improvise.',
        heroSubtitle: "Franchise retail doesn't leave room for local reinterpretation — brand guidelines are set internationally and enforced on delivery. This 140 sqm Giorgio Di Mare boutique in The Avenues had to match that global standard exactly, while still meeting Kuwait's own local construction requirements.",
        story: [
          "Operating a franchise of an international fashion brand means the design brief isn't really a brief — it's a specification. Every material, fixture, and finish had to comply with Giorgio Di Mare's brand guidelines, with local construction realities and mall approval processes layered on top rather than allowed to change the outcome.",
          "That left execution, not concept, as the real test: deep blue accents, glossy metallic fixtures, and an expansive lighting scheme had to be built to match the brand's global look exactly, coordinated through the franchise's own approval chain, inside a mall environment with its own regulatory demands."
        ],
        designPhilosophy: "Deep blue accents and glossy metallic fixtures aren't stylistic choices made locally — they're brand-mandated, which shifts the design challenge from concept to precision: matching an international standard exactly, under local construction conditions.",
        whyDifferent: "Most retail fit-outs give a designer room to interpret. This one didn't — the value AHW delivered was disciplined execution against a fixed international brand standard, coordinated through franchise approvals, not creative reinterpretation.",
        clientExperience: [
          'Full compliance with Giorgio Di Mare\'s international brand guidelines',
          'Coordinated approvals through the franchise structure',
          'Design quality maintained through to final execution'
        ],
        faq: [
          { question: 'Was this an independent design or a franchise fit-out?', answer: "A franchise fit-out, built to Giorgio Di Mare's international brand guidelines and coordinated through the franchise's own approval requirements." },
          { question: 'What was the main challenge?', answer: 'Matching an internationally mandated brand look — deep blue accents, glossy metallic fixtures — exactly, while meeting local Kuwait construction and mall requirements.' },
          { question: 'How big is the store?', answer: '140 sqm, located in The Avenues, Kuwait.' }
        ],
        cta: {
          headline: 'Opening a Franchise Retail Location in Kuwait?',
          subtext: "Let's talk about execution that matches your brand standard exactly, every time."
        },
        seo: {
          title: 'Retail Fit-Out — Giorgio Di Mare, The Avenues Kuwait | AHW Architects',
          description: 'A 140 sqm Giorgio Di Mare franchise fit-out in The Avenues, Kuwait, built to exact international brand standards. By AHW Architects.',
          focusKeyword: 'franchise retail fit-out Kuwait',
          secondaryKeywords: ['fashion retail design Kuwait', 'brand compliant fit-out', 'Avenues mall retail design', 'international brand store Kuwait'],
          ogTitle: 'A Franchise Boutique Built to an Exact International Standard',
          ogDescription: 'Inside a 140 sqm Giorgio Di Mare fit-out in The Avenues, Kuwait, delivered to match the brand\'s global guidelines precisely.',
          twitterTitle: 'Giorgio Di Mare: Brand Precision at 140 sqm',
          twitterDescription: 'A franchise fashion retail fit-out in Kuwait, built to international brand standards by AHW Architects.'
        }
      }
    }
  },
  {
    id: '10',
    slug: "tmreya-cafe-kout-mall-kuwait",
    title: 'Tmreya',
    sector: 'Retail',
    city: 'Kout Mall',
    market: 'Kuwait',
    area: '60',
    year: '2019',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'Tmreya',
    status: 'Completed',
    resultStatement: 'A 60 sqm retail fit-out for a premium confectionery brand in Kout Mall, executed to precision by AHW Architects.',
    heroImage: '/ahw-projects-assets/10-tmreya-kout-mall/hero.webp',
    hubFlagshipImage: '/ahw-projects-assets/10-tmreya-kout-mall/build/tmreya-kout-mall-interior-detail-82-cdpc.webp',
    ogImage: '/ahw-projects-assets/10-tmreya-kout-mall/og-share.webp',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed a compact yet visually striking retail space that elegantly displays their premium confectionery products within a high-traffic mall.',
        definitionalSentence: 'A masterclass in small-scale luxury retail design and execution.'
      },
      design: {
        images: [
          '/ahw-projects-assets/10-tmreya-kout-mall/build/tmreya-kout-mall-interior-detail-83-8wzu.webp'
        ],
        keyDecision: 'Using rich, warm materials and focused lighting to highlight the products and create an inviting atmosphere within a limited footprint.'
      },
      build: {
        images: [
          '/ahw-projects-assets/10-tmreya-kout-mall/build/tmreya-kout-mall-interior-detail-84.webp'
        ],
        duration: '2 Months',
        challengeResolution: 'Optimizing custom display units to fit seamlessly into the 60 sqm space while adhering to the strict mall fit-out regulations.',
        features: ['Custom Display Units', 'Premium Finishes', 'Optimized Retail Flow']
      },
      result: {
        images: [
          '/ahw-projects-assets/10-tmreya-kout-mall/build/tmreya-kout-mall-interior-detail-85.webp',
          '/ahw-projects-assets/10-tmreya-kout-mall/build/tmreya-kout-mall-interior-detail-82-cdpc.webp'
        ],
        outcomes: ['Maximized product visibility', 'Delivered within a tight commercial timeline']
      },
      relatedProjects: ['sultan-center-hawally-kuwait', 'samsung-store-nasr-city-egypt'],
      relatedExpertise: {
        title: 'Retail Fit-out',
        href: '/expertise/fit-out'
      },
      narrative: {
        heroHeadline: 'Sixty Square Meters, One Efficient Customer Journey.',
        heroSubtitle: "A boutique confectionery brand doesn't get to spread out — Tmreya's Kout Mall location had 60 sqm to display premium products, move customers through comfortably, and still meet strict mall fit-out regulations, all at once.",
        story: [
          "At 60 sqm, there's no wasted circulation to hide a weak layout — every fixture placement either helps or hurts how a customer moves through the space and encounters the product. The brief was to make a compact footprint feel generous rather than cramped, inside mall regulations that left limited flexibility on layout and materials.",
          "Rich, warm materials and focused lighting did double duty: highlighting the confectionery as the visual centerpiece while making the small space feel intentional rather than constrained. The result was a two-month fit-out that had to get the customer journey right on a footprint most retail designs would consider too tight to bother with."
        ],
        designPhilosophy: "In a 60 sqm footprint, materials and lighting have to carry the sense of quality that larger stores get from scale — warm tones and focused lighting on the product itself, rather than any excess architectural gesture the space doesn't have room for.",
        whyDifferent: "Most retail design has room to make a statement. This one had to make the same impression — premium, considered, worth stopping at — inside one of the smallest footprints in AHW's retail portfolio, under strict mall fit-out rules.",
        clientExperience: [
          'A two-month delivery timeline within strict mall fit-out regulations',
          'A customer journey designed specifically for a 60 sqm footprint',
          'Product display prioritized as the visual centerpiece of the space'
        ],
        faq: [
          { question: 'How big is the Tmreya boutique?', answer: '60 sqm, located in Al Kout Mall, Kuwait.' },
          { question: 'What was the main design challenge?', answer: 'Delivering an efficient, comfortable customer journey and strong product display within a compact 60 sqm footprint, under strict mall fit-out regulations.' },
          { question: 'How long did the fit-out take?', answer: 'Two months.' }
        ],
        cta: {
          headline: 'Fitting Out a Compact Retail Space in a Kuwait Mall?',
          subtext: "Let's talk about making a small footprint feel intentional, not constrained."
        },
        seo: {
          title: 'Retail Fit-Out — Tmreya, Al Kout Mall Kuwait | AHW Architects',
          description: 'A 60 sqm boutique confectionery fit-out in Al Kout Mall, Kuwait, designed for an efficient customer journey. By AHW Architects.',
          focusKeyword: 'small retail fit-out Kuwait',
          secondaryKeywords: ['boutique retail design Kuwait', 'mall fit-out Kuwait', 'confectionery store design', 'Al Kout Mall retail'],
          ogTitle: 'A Boutique Retail Fit-Out That Makes 60 sqm Feel Generous',
          ogDescription: 'Inside Tmreya, a 60 sqm confectionery boutique in Al Kout Mall, Kuwait, designed by AHW Architects for an efficient customer journey.',
          twitterTitle: 'Tmreya: Small Footprint, Full Experience',
          twitterDescription: 'A 60 sqm luxury dessert boutique fit-out in Kuwait, by AHW Architects.'
        }
      }
    }
  },
  {
    id: '11',
    slug: "jabriya-apartment-kuwait",
    title: 'Jabria Apartment',
    sector: 'Residential',
    city: 'Hawally, Jabriya',
    market: 'Kuwait',
    area: '2600',
    year: '2023',
    tier: 'Standard',
    services: ['Architecture', 'Design & Build'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 2,600 sqm residential apartment building in Jabriya, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-84-vkml.jpg',
    hubFlagshipImage: '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-85-a5uz.jpg',
    ogImage: '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-84-vkml.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client required a contemporary residential apartment complex with a luxurious and welcoming main lobby that reflects a premium standard of living.',
        definitionalSentence: 'A masterfully designed residential apartment building in the heart of Jabriya.'
      },
      design: {
        images: [
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-86-xyl8.jpg',
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-87-byo4.jpg',
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-88-exyz.jpg'
        ],
        keyDecision: 'Employing elegant wooden cladding, modern lighting fixtures, and sleek metallic accents to create a warm yet striking interior aesthetic for the common areas.'
      },
      build: {
        images: [
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-89-lb9u.jpg',
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-90-wg18.jpg'
        ],
        duration: '18 Months',
        challengeResolution: 'Ensuring seamless integration of high-end finishes and intricate ceiling details across multiple floors while maintaining strict structural and safety standards.',
        features: ['Premium Wood Cladding', 'Custom Lighting Systems', 'Modern Reception Design']
      },
      result: {
        images: [
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-84-vkml.jpg',
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-91-waen.jpg',
          '/ahw-projects-assets/11-jabria-apartment/orignal/jabria-apartment-interior-detail-85-a5uz.jpg'
        ],
        outcomes: ['Delivered a landmark residential building in Jabriya', 'Created a highly sought-after living space with premium amenities']
      },
      relatedProjects: ['nozha-private-villa-kuwait', 'surra-villa-kuwait'],
      relatedExpertise: {
        title: 'Residential Architecture',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'Fully Rented Before Handover.',
        heroSubtitle: "The real test of a residential investment building isn't how it photographs — it's whether the market wants it. This 2,600 sqm apartment building in Jabriya, built across a ground floor and three residential levels, was fully rented before AHW even handed over the keys.",
        story: [
          "An investment property lives or dies on the rental market's judgment, not the architect's. The brief was to create a building that would stand out enough in Jabriya's residential rental market to lease quickly and hold its value — which meant common areas and finishes had to read as a cut above the standard local offering, not just meet it.",
          "Elegant wood cladding, modern lighting, and metallic accents through the lobby and shared spaces set that tone from the first impression. Across an 18-month build spanning a ground floor and three residential floors, maintaining that finish quality consistently on every level — not just the ground-floor showpiece — was the real execution challenge. The payoff was concrete: every unit was rented before the building was formally handed over."
        ],
        designPhilosophy: "In a rental building, the lobby and common areas are doing a sales job every day, for every prospective tenant who walks through — which is why wood cladding, lighting, and metallic accents were concentrated where they'd be seen first and most often, setting the standard the rest of the building had to live up to.",
        whyDifferent: "Most residential projects are judged after handover. This one was judged by the market before handover even happened — every unit rented on the strength of the building's construction quality and design character alone.",
        clientExperience: [
          'An 18-month build maintaining consistent finish quality across a ground floor and three residential levels',
          'Every residential unit rented before formal project handover',
          'Common areas designed to set a premium standard from first impression'
        ],
        faq: [
          { question: 'How is the Jabriya Apartment Building laid out?', answer: 'A ground floor, three residential floors, and a roof level, totaling 2,600 sqm.' },
          { question: 'How long did construction take?', answer: '18 months.' },
          { question: 'What was the outcome for the client?', answer: 'Every residential unit was fully rented before the project was formally handed over.' }
        ],
        cta: {
          headline: 'Developing a Residential Investment Property in Kuwait?',
          subtext: "Let's talk about design quality that gets units rented before handover."
        },
        seo: {
          title: 'Residential Investment Building — Jabriya, Kuwait | AHW Architects',
          description: 'A 2,600 sqm residential apartment building in Jabriya, Kuwait, fully rented before handover. By AHW Architects.',
          focusKeyword: 'residential investment building Kuwait',
          secondaryKeywords: ['apartment building Jabriya', 'rental property design Kuwait', 'residential architecture Kuwait', 'investment property Kuwait'],
          ogTitle: 'A Residential Building Rented Out Before It Was Even Handed Over',
          ogDescription: 'A 2,600 sqm investment apartment building in Jabriya, Kuwait, fully leased before handover — by AHW Architects.',
          twitterTitle: 'Jabriya Apartments: Fully Rented, On Handover',
          twitterDescription: 'A 2,600 sqm residential investment building in Kuwait, designed and delivered by AHW Architects.'
        }
      }
    }
  },
  {
    id: '12',
    slug: "nozha-private-villa-kuwait",
    title: 'Nozha Private Villa',
    sector: 'Residential',
    city: 'Al Nozha',
    market: 'Kuwait',
    area: '500',
    year: '2022',
    tier: 'Standard',
    services: ['Architecture', 'Interior Design', 'Design & Build', 'Project Management'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A complete transformation from an aging house into a modern landmark. Designed, built, and delivered entirely by AHW Architects.',
    heroImage: '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-92-sw5k.jpg',
    hubFlagshipImage: '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-93-zqit.jpg',
    ogImage: '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-92-sw5k.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The existing property was an aging house that no longer matched the family\'s vision or future needs. Instead of renovating an outdated structure, we proposed a complete transformation—starting with demolition.',
        definitionalSentence: 'From Demolition to a Contemporary Home.'
      },
      design: {
        images: [
          '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-94-hovk.jpg',
          '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-95-mg0z.jpg'
        ],
        keyDecision: 'Every architectural line, every interior space, and every construction detail was planned to create a timeless home. The design accommodates a Ground Floor, First Floor, and two independent apartments on the Second Floor.'
      },
      build: {
        images: [
          '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-96-9ej7.jpg'
        ],
        duration: 'Turnkey Delivery: 2022',
        challengeResolution: 'AHW Architects managed the complete journey: from demolition and excavation to architecture, interior design, structural coordination, and site supervision. Transparency and communication created client confidence from day one.',
        features: ['Demolition & Excavation', 'Structural Coordination', 'Turnkey Execution']
      },
      result: {
        images: [
          '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-97-62ii.jpg',
          '/ahw-projects-assets/12-al-nozha/orignal/al-nozha-interior-detail-98-ayzj.jpg'
        ],
        outcomes: ['Delivered a beautiful contemporary villa made to last', 'Achieved high client satisfaction through honesty and execution quality']
      },
      relatedProjects: ['surra-villa-kuwait', 'fintas-apartment-kuwait'],
      relatedExpertise: {
        title: 'Residential Architecture',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'A Villa Built to House Three Households at Once.',
        heroSubtitle: "Some renovation briefs aren't really renovations — they're a decision to start over. An aging house in Al Nozha no longer matched the family's needs, so AHW proposed demolition and a ground-up rebuild, planned from day one to hold a ground floor, a first floor, and two independent apartments above it.",
        story: [
          "Renovating an outdated structure can mean inheriting its problems — awkward layouts, tired infrastructure, compromises baked into the original build. Here, the family's needs had outgrown what the existing house could reasonably be adapted into, so the honest recommendation was demolition rather than renovation, followed by a home designed from the ground up around how the family actually wanted to live across multiple generations and units.",
          "AHW managed every stage of that journey directly — demolition, excavation, architecture, interior design, structural coordination, and site supervision — as a single turnkey scope through to delivery in 2022. Every line, every space, every construction detail was planned toward one goal: a home built to last, not a renovation built around what was already there."
        ],
        designPhilosophy: "Starting from a cleared site meant the layout could be planned around use, not retrofitted around an existing structure — a ground floor and first floor for the main household, and two genuinely independent apartments above, each with its own access and privacy rather than a compromise version of separate living.",
        whyDifferent: "Most residential projects renovate what's there. This one made the harder, more honest call to start over — and used that clean slate to plan a home for three separate households under one roof, not just a single-family villa with extra rooms.",
        clientExperience: [
          'One team managing demolition through final handover',
          'Transparent, continuous communication from day one of the site clearance',
          'Delivered as a complete, turnkey home in 2022'
        ],
        faq: [
          { question: 'Why was the existing house demolished instead of renovated?', answer: "The aging structure no longer matched the family's needs; a ground-up rebuild allowed the layout to be planned specifically around how the family wanted to live, rather than adapted around an existing structure." },
          { question: 'How is the villa laid out?', answer: 'A ground floor and first floor for the main household, plus two independent apartments on the second floor.' },
          { question: 'What was AHW\'s scope?', answer: 'The complete project journey — demolition, excavation, architecture, interior design, structural coordination, and site supervision — delivered turnkey in 2022.' }
        ],
        cta: {
          headline: 'Considering a Rebuild Instead of a Renovation?',
          subtext: "Let's talk about when starting over is actually the better investment."
        },
        seo: {
          title: 'Villa Rebuild in Al Nozha, Kuwait | AHW Architects',
          description: 'A complete demolition-to-handover villa rebuild in Al Nozha, Kuwait, housing three independent units under one roof. By AHW Architects.',
          focusKeyword: 'villa rebuild Kuwait',
          secondaryKeywords: ['demolition and rebuild Kuwait', 'multi-generational villa design', 'turnkey villa construction Kuwait', 'Al Nozha residential architecture'],
          ogTitle: 'From an Aging House to a Home for Three Households',
          ogDescription: 'A full demolition-to-handover rebuild in Al Nozha, Kuwait, planned around a ground floor, first floor, and two independent apartments.',
          twitterTitle: 'Al Nozha Villa: Rebuilt, Not Renovated',
          twitterDescription: 'A ground-up villa rebuild in Kuwait, delivered turnkey by AHW Architects — from demolition to final handover.'
        }
      }
    }
  },
  {
    id: '13',
    slug: "new-brew-coffee-salmiya-kuwait",
    title: 'New Brew Coffee',
    sector: 'Hospitality',
    city: 'Salmiya',
    market: 'Kuwait',
    area: '160',
    year: '2023',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out'],
    client: 'New Brew Coffee',
    status: 'Completed',
    resultStatement: 'A 160 sqm specialized cafe fit-out in Salmiya, executing an industrial-chic aesthetic with high-performance brewing stations.',
    heroImage: '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-99-3x82.jpg',
    hubFlagshipImage: '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-100-9cic.jpg',
    ogImage: '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-99-3x82.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed a specialized cafe environment that highlighted the artisanal coffee brewing process while offering a comfortable, modern seating area for patrons.',
        definitionalSentence: 'An industrial-chic hospitality space designed around the art of coffee.'
      },
      design: {
        images: [
          '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-99-3x82.jpg'
        ],
        keyDecision: 'Using raw materials like concrete, steel, and warm wood to contrast with high-tech brewing equipment.'
      },
      build: {
        images: [
          '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-100-9cic.jpg',
          '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-101-8wja.jpg'
        ],
        duration: '3 Months',
        challengeResolution: 'Integrating complex plumbing and electrical systems for commercial espresso machines within a tight bar footprint.',
        features: ['Custom Brewing Bar', 'Industrial Lighting', 'Acoustic Treatments']
      },
      result: {
        images: [
          '/ahw-projects-assets/13-new-brew-coffee-salmiya/build/new-brew-coffee-salmiya-interior-detail-102-tiqv.jpg'
        ],
        outcomes: ['Optimized barista workflow', 'Created a highly photogenic customer experience']
      },
      // Was 'sultan-center-hawally-kuwait' — shared neither sector
      // (Retail vs. Hospitality) nor any service, found while auditing
      // relatedProjects coherence (RC brief Section 3). Tmreya shares
      // both services (Interior Design, Fit-out) and is a comparably
      // scaled Kuwait cafe/F&B fit-out — a genuine match, not a
      // fallback pick.
      relatedProjects: ['tmreya-cafe-kout-mall-kuwait'],
      relatedExpertise: {
        title: 'Hospitality Design',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: "Building a Brand That Didn't Exist Yet.",
        heroSubtitle: "New Brew Coffee wasn't an existing chain looking for a Salmiya location — it was a new brand, and this 160 sqm space was the first physical proof of what it would be. The architecture had to do the work a brand identity usually does on its own.",
        story: [
          "Launching a new brand through its first physical space is a different problem than fitting out an established one — there's no existing visual language to extend, no customer expectation to meet. Every material and layout decision was also, implicitly, a branding decision: this is what New Brew Coffee looks like, because there was no other answer yet.",
          "Raw materials — concrete, steel, warm wood — set an industrial-chic tone deliberately built to contrast with the high-tech espresso equipment at the counter, so the brewing process itself became part of the space's character. Integrating the plumbing and electrical demands of commercial espresso machines into a tight bar footprint, without compromising that aesthetic, was the core execution challenge of the three-month build. The shop opened on schedule."
        ],
        designPhilosophy: "Raw, industrial materials were chosen to let the brewing equipment and process feel like the centerpiece rather than something to hide — a coffee shop whose architecture explains what it does, not just where to sit.",
        whyDifferent: "Most hospitality fit-outs extend a brand that already exists. This one had to build the first impression of a brand from nothing, which meant every design decision was also a brand decision, with no prior identity to fall back on.",
        clientExperience: [
          'A new brand identity established through architecture and material choice',
          'Commercial espresso equipment integrated into a compact bar footprint',
          'Opened on schedule after a three-month build'
        ],
        faq: [
          { question: 'Was New Brew Coffee an existing brand?', answer: 'No — this was a new brand launch, with the physical space itself establishing the brand\'s identity for the first time.' },
          { question: 'What was the biggest technical challenge?', answer: 'Integrating the plumbing and electrical infrastructure for commercial espresso machines within a tight bar footprint.' },
          { question: 'How big is the space?', answer: '160 sqm, located in Salmiya, Kuwait.' }
        ],
        cta: {
          headline: 'Launching a New Hospitality Brand in Kuwait?',
          subtext: "Let's talk about a first location that establishes your identity, not just seats customers."
        },
        seo: {
          title: 'Coffee Shop Interior Design — Salmiya, Kuwait | AHW Architects',
          description: 'A 160 sqm new-brand coffee shop launch in Salmiya, Kuwait — industrial-chic design built around the craft of specialty brewing. By AHW Architects.',
          focusKeyword: 'coffee shop design Kuwait',
          secondaryKeywords: ['cafe interior design Kuwait', 'hospitality fit-out Salmiya', 'specialty coffee shop design', 'new brand retail design'],
          ogTitle: 'Designing a Coffee Brand\'s First Physical Space',
          ogDescription: 'Inside New Brew Coffee, a 160 sqm Salmiya cafe where the architecture itself introduces a brand-new hospitality brand.',
          twitterTitle: 'New Brew Coffee: A Brand Built in 160 sqm',
          twitterDescription: 'A new specialty coffee brand\'s first location in Salmiya, Kuwait, designed by AHW Architects.'
        }
      }
    }
  },
  {
    id: '14',
    slug: "shrouk-city-apartment-egypt",
    title: 'Shrouk City Residence',
    sector: 'Residential',
    city: 'Shrouk City',
    market: 'Egypt',
    area: '220',
    year: '2024',
    tier: 'Standard',
    services: ['Interior Design', 'Fit-out', 'Furnishing'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A comprehensive residential fit-out and finishing in Shrouk City, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-103-dgco.jpg',
    hubFlagshipImage: '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-104-f3ft.jpg',
    ogImage: '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-105-qdzy.jpeg',
    caseStudy: {
      brief: {
        clientProblem: 'The client required a complete residential transformation, including premium woodwork, custom furnishings, and detailed finishing to elevate the living space.',
        definitionalSentence: 'A masterfully executed residential fit-out in Shrouk City, encompassing complete finishing, carpentry, and furnishing.'
      },
      design: {
        images: [
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-106-d3nn.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-107-slxx.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-108-ajf1.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-109-gpqp.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-110-6xrb.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/design/residential-kitchen-shrouk-interior-detail-111-52jr.jpg'
        ],
        keyDecision: 'Developing a cohesive interior aesthetic that harmonizes custom woodwork with modern furnishings and premium finishing materials.'
      },
      build: {
        images: [
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-112-janb.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-113-x1hm.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-114-gtb2.jpg'
        ],
        duration: '45 Days',
        challengeResolution: 'Executing intricate carpentry and custom furniture installations while maintaining strict tolerances and ensuring high-quality surface finishes.',
        features: ['Custom Woodwork', 'Premium Finishing', 'Bespoke Furnishings']
      },
      result: {
        images: [
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-104-f3ft.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-living-room-f9p0.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-116-f5du.jpg',
          '/ahw-projects-assets/14-residential-kitchen-shrouk/build/residential-kitchen-shrouk-interior-detail-117-jx92.jpg'
        ],
        outcomes: ['Delivered a fully furnished, turnkey residential unit', 'Achieved a seamless integration of design and execution']
      },
      relatedProjects: ['nozha-private-villa-kuwait', 'beit-al-watan-residential-new-cairo-egypt'],
      relatedExpertise: {
        title: 'Interior Design & Fit-out',
        href: '/expertise/interior-design'
      },
      narrative: {
        heroHeadline: 'A Complete Home, Furnished, in 90 Days.',
        heroSubtitle: "A private family in Shrouk City needed a fully furnished, turnkey residence delivered on a construction schedule most fit-outs would consider unrealistic — 90 days from start to finish, with the custom furniture and carpentry for the kitchen, dressing room, and bedrooms fabricated in 45 of those days, alongside Smart Home integration, not cut for time.",
        story: [
          "A 90-day timeline for a complete interior fit-out — custom joinery, furnishing, and finishing all included — leaves almost no room for the usual back-and-forth of a residential project. Every decision had to be right close to the first time, because there wasn't a schedule buffer to absorb rework.",
          "Custom woodwork and premium finishing materials were developed to work together as one cohesive interior language from the outset, rather than resolved room by room, while Smart Home systems were integrated in parallel with the finishing work rather than as a separate phase. The custom furniture and carpentry for the kitchen, dressing room, and bedrooms were fabricated in 45 of the 90 days, running alongside the rest of the fit-out rather than adding to the schedule. The result was a fully furnished, move-in-ready home delivered in the 90 days promised."
        ],
        designPhilosophy: "Compressed timelines punish indecision — the woodwork, furnishings, and finishing materials were planned as one cohesive package from the start so execution could move in parallel across trades, rather than waiting on sequential design decisions.",
        whyDifferent: "Most turnkey residential fit-outs run on a timeline measured in months. This one delivered the same full scope — custom carpentry, complete furnishing, Smart Home integration — in 90 days, without treating craftsmanship as the trade-off for speed.",
        clientExperience: [
          'A complete, fully furnished residence delivered in 90 days',
          'Custom furniture and carpentry for the kitchen, dressing room, and bedrooms fabricated in 45 of those days, running in parallel with Smart Home integration, not sequentially',
          'Move-in-ready handover with no deferred finishing work'
        ],
        faq: [
          { question: 'How long did this project take?', answer: '90 days from start to finish, with the custom furniture and carpentry for the kitchen, dressing room, and bedrooms fabricated in 45 of those days, running in parallel with the rest of the interior fit-out and Smart Home integration.' },
          { question: 'What was included in the scope?', answer: 'Complete interior design, turnkey fit-out, custom furniture, and Smart Home integration, delivered as one project.' },
          { question: 'How big is the residence?', answer: '220 sqm, located in Shrouk City, Egypt.' }
        ],
        cta: {
          headline: 'Need a Complete Home Fit-Out on a Tight Timeline?',
          subtext: "Let's talk about full-scope delivery that doesn't trade craftsmanship for speed."
        },
        seo: {
          title: 'Turnkey Residential Fit-Out — Shrouk City, Egypt | AHW Architects',
          description: 'A 220 sqm fully furnished residence in Shrouk City, Egypt, delivered turnkey in 90 days with Smart Home integration. By AHW Architects.',
          focusKeyword: 'turnkey fit-out Egypt',
          secondaryKeywords: ['fast residential fit-out Cairo', 'Shrouk City interior design', 'custom furniture Egypt', 'smart home fit-out Egypt'],
          ogTitle: 'A Fully Furnished Home, Delivered in 90 Days',
          ogDescription: 'How AHW delivered a complete, move-in-ready 220 sqm residence in Shrouk City, Egypt, in just 90 days.',
          twitterTitle: 'Shrouk City Residence: Turnkey in 90 Days',
          twitterDescription: 'A fully furnished 220 sqm home in Shrouk City, Egypt, delivered turnkey by AHW Architects in 90 days.'
        }
      }
    }
  },
  {
    id: '15',
    slug: "diyar-park-landscape-new-cairo",
    title: 'Diyar Park Landscape',
    sector: 'Residential',
    city: 'Diyar Park',
    market: 'Egypt',
    area: '200',
    year: '2024',
    tier: 'Standard',
    services: ['Landscape Design', 'Fit-out'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A 200 sqm rooftop landscape transformation in Diyar Park, designed and built by AHW Architects.',
    heroImage: '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-118-h4fw.jpg',
    hubFlagshipImage: '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-119-3qwj.jpg',
    ogImage: '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-118-h4fw.jpg',
    caseStudy: {
      brief: {
        clientProblem: "The client felt the villa's rooftop was a wasted asset and that the main entrance lacked the welcoming impression expected from a premium home. Although the property was spacious, the rooftop remained unused, leaving the family to spend their leisure time in cafés and restaurants instead of enjoying their own home.",
        definitionalSentence: "From an unused rooftop to the family's favorite destination — a complete outdoor living transformation and entrance redesign in Diyar Park."
      },
      design: {
        images: [
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-120-ilet.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-121-6mmk.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-122-6fmi.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-123-2bm9.jpg'
        ],
        keyDecision: "The rooftop was transformed into a fully functional outdoor living destination rather than simply adding seating — zoned into a comfortable lounge area, a dedicated dining space, and an entertainment zone centered around a large-screen TV. The villa entrance was redesigned in parallel to create a stronger first impression through improved architectural detailing, lighting, and material selection."
      },
      build: {
        images: [
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-124-2m6z.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-125-i403.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-126-x73x.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-127-qfdj.jpg'
        ],
        duration: '8–10 Weeks',
        challengeResolution: "Creating a comfortable outdoor environment that could be enjoyed year-round despite the local climate was the biggest challenge — solved by integrating weather-resistant materials, carefully planned lighting, shading solutions, and durable finishes while keeping the rooftop's open, inviting atmosphere.",
        features: ['Multi-Functional Rooftop Lounge & Entertainment Space', 'Outdoor Dining Area for Family Gatherings', 'Large-Screen TV Integrated into the Entertainment Zone', 'Redesigned Villa Entrance with Premium Architectural Lighting & Finishes']
      },
      result: {
        images: [
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-128-enyi.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-129-25jq.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-130-16x8.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-118-h4fw.jpg',
          '/ahw-projects-assets/15-stone-park-landscape/orignal/stone-park-landscape-interior-detail-119-3qwj.jpg'
        ],
        outcomes: [
          "The rooftop became the family's primary entertainment space",
          'The client now hosts family gatherings and friends at home instead of going to cafés',
          "The redesigned entrance significantly enhanced the villa's curb appeal and overall property value",
          'The project transformed an underutilized rooftop into one of the most frequently used spaces in the home'
        ]
      },
      relatedProjects: ['khiran-chalet-kuwait', 'kai-sokhna-egypt'],
      relatedExpertise: {
        title: 'Landscape Design',
        href: '/expertise/fit-out'
      },
      narrative: {
        heroHeadline: 'The Rooftop That Replaced the Café Run.',
        heroSubtitle: "A spacious villa with an empty rooftop is still a house with an unused room — just an outdoor one. This family had spent their leisure time at cafés and restaurants because their own 200 sqm rooftop offered nothing to stay home for. Eight to ten weeks later, it had become the room they used most.",
        story: [
          "The problem wasn't space — the villa had plenty. It was that the rooftop, and the entrance below it, weren't doing any work. An empty rooftop doesn't compete with a nice café for a family's evening, so it doesn't get used, no matter how large the house is. The brief was to make it compete, and win.",
          "The response zoned the roof into a lounge, a dedicated dining space, and an entertainment area built around a large screen — not just furniture added to an open deck, but a destination with a reason to choose each part of it. The villa entrance was redesigned in parallel, since a home that had stopped feeling special on the roof had likely stopped making a strong first impression at the door too. The hardest technical problem was making an outdoor space genuinely usable year-round despite the local climate, solved with weather-resistant materials, planned shading, and lighting that keeps the space inviting after dark."
        ],
        designPhilosophy: "An outdoor space only gets used if it removes the reasons people default to leaving the house — comfort, shade, something to do once you're there. Zoning the roof into distinct lounge, dining, and entertainment areas gave the family a reason to choose their own rooftop over a restaurant, not just permission to sit outside.",
        whyDifferent: "This wasn't a landscaping add-on — it was a behavior-change project measured by where a family actually chooses to spend their evenings. The result is a rooftop and entrance that get used, not admired from a distance, which is a different bar than most outdoor renovations are held to.",
        clientExperience: [
          'An 8–10 week delivery timeline for the full rooftop and entrance transformation',
          'A space designed around actual family routines, not generic outdoor furniture placement',
          'The family now hosts at home rather than defaulting to cafés and restaurants'
        ],
        imageStory: {
          result: "These images show the completed rooftop in use — the zoned lounge, dining, and entertainment areas that turned an empty deck into the family's most-used room in the house."
        },
        faq: [
          { question: 'How long did the rooftop transformation take?', answer: '8–10 weeks, covering the rooftop redesign and the villa entrance.' },
          { question: 'What was the biggest design challenge?', answer: 'Making the outdoor space comfortable to use year-round despite the local climate — solved with weather-resistant materials, shading, and planned lighting.' },
          { question: 'What was included in the scope?', answer: 'A zoned rooftop lounge, dining area, and entertainment space with a large-screen TV, plus a redesigned villa entrance.' }
        ],
        cta: {
          headline: 'Have a Rooftop or Outdoor Space Sitting Unused?',
          subtext: "Let's talk about turning it into the room your family actually chooses."
        },
        seo: {
          title: 'Rooftop Landscape & Entrance Redesign — Diyar Park, Cairo | AHW Architects',
          description: 'A 200 sqm rooftop and entrance transformation in Diyar Park, New Cairo — from unused space to the family\'s primary living area. By AHW Architects.',
          focusKeyword: 'rooftop design Cairo',
          secondaryKeywords: ['outdoor living design Egypt', 'villa entrance redesign', 'rooftop landscape Egypt', 'outdoor entertainment space design'],
          ogTitle: 'From an Empty Rooftop to the Family\'s Favorite Room',
          ogDescription: 'How AHW turned an unused 200 sqm rooftop in New Cairo into a fully zoned outdoor living space the family uses daily.',
          twitterTitle: 'Diyar Park: The Rooftop That Gets Used',
          twitterDescription: 'An unused rooftop in New Cairo, transformed into a family\'s most-used space in 8–10 weeks. By AHW Architects.'
        }
      }
    }
  },
  {
    id: '16',
    slug: "khawaneej-courtyard-villa-dubai",
    title: 'Al Khawaneej Courtyard Villa',
    sector: 'Residential',
    city: 'Al Khawaneej First, Dubai',
    market: 'UAE',
    area: '1,200',
    year: '2026',
    tier: 'Standard',
    services: ['Architecture', 'Interior Design', 'Landscape Design', 'Project Management'],
    client: 'Private Client',
    status: 'Design Completed',
    resultStatement: 'A luxury contemporary villa in Dubai. The comprehensive design phase was delivered in May 2026, with AHW Architects transitioning to lead the project management during construction.',
    heroImage: '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-exterior-facade-4tw6.png',
    hubFlagshipImage: '/ahw-projects-assets/16-uae-villa-coming-soon/uae-villa-coming-soon-interior-detail-132-dpyc.png',
    ogImage: '/ahw-projects-assets/16-uae-villa-coming-soon/uae-villa-coming-soon-interior-detail-133-qzjy.jpg',
    caseStudy: {
      brief: {
        clientProblem: 'The client, an Emirati entrepreneur with an international schedule, required a timeless contemporary villa that offers complete family privacy, exceptional natural light, luxurious outdoor living, and effortless indoor–outdoor connectivity, all designed via remote collaboration.',
        definitionalSentence: 'A contemporary family residence designed entirely through remote collaboration, balancing openness with privacy while embracing modern Emirati living.'
      },
      design: {
        images: [
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-exterior-facade-di2q.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-interior-design-3cot.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-exterior-facade-bkxg.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-exterior-facade-iewv.png'
        ],
        keyDecision: 'Organizing the villa around a generous internal courtyard to create a protected outdoor environment that becomes the heart of the home, while maximizing natural daylight and privacy.'
      },
      build: {
        images: [
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-architectural-plan-jn4y.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-architectural-plan-v8y5.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-architectural-plan-zfk1.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/design/uae-villa-coming-soon-architectural-plan-f8q3.png'
        ],
        duration: '14 Weeks (Design Phase)',
        challengeResolution: 'Delivering the entire project without traditional in-person design meetings, utilizing a structured digital workflow of online workshops, 3D visualization, and cloud-based drawing coordination.',
        features: ['Fully Remote Design Delivery', 'Smart Home Integration', 'Sustainable Design Strategies']
      },
      result: {
        images: [
          '/ahw-projects-assets/16-uae-villa-coming-soon/uae-villa-coming-soon-interior-detail-132-dpyc.png',
          '/ahw-projects-assets/16-uae-villa-coming-soon/uae-villa-coming-soon-interior-detail-142-qbnt.png'
        ],
        outcomes: ['Created a sophisticated residential environment centered around privacy and natural light', 'Successfully delivered premium residential architecture entirely through digital collaboration']
      },
      relatedProjects: ['nozha-private-villa-kuwait', 'jabriya-apartment-kuwait'],
      relatedExpertise: {
        title: 'Residential Architecture',
        href: '/expertise/architecture'
      },
      narrative: {
        heroHeadline: 'A Villa Designed Without a Single In-Person Meeting.',
        heroSubtitle: "The client, an Emirati entrepreneur with an international schedule, was rarely in the same city as the site. Every design decision for this 1,200 sqm courtyard villa in Al Khawaneej was made remotely — through structured digital workshops, 3D visualization, and cloud-based coordination, not a single sit-down meeting.",
        story: [
          "A client who travels constantly doesn't have the option most residential projects assume by default: sitting across a table to sketch and revise together. The entire design phase had to be restructured around that reality — a digital workflow built to carry the same level of trust and precision as an in-person process, without ever requiring one.",
          "The house itself was organized around a generous internal courtyard, giving the family a protected outdoor environment at the center of the home rather than at its edges — maximizing privacy and daylight regardless of which direction the surrounding plot faced. Delivered across 14 weeks of fully remote collaboration, the design phase concluded in May 2026, with AHW transitioning into project management for the construction phase that follows."
        ],
        designPhilosophy: "A courtyard at the center of the plan solves privacy and daylight at the same time — outdoor space that belongs entirely to the family, shielded from the surrounding property line by the building itself rather than by walls or distance.",
        whyDifferent: "The architecture here is only half the story — the other half is that none of it was designed in person. A fully remote process, built on structured digital workshops and cloud-based coordination, delivered a design with the same rigor as an on-site relationship, for a client whose schedule made that impossible.",
        clientExperience: [
          'An entire design phase delivered without in-person meetings',
          'Structured digital workshops, 3D visualization, and cloud-based drawing coordination',
          'A seamless transition from design into AHW-led project management for construction'
        ],
        faq: [
          { question: 'Was this project designed remotely?', answer: 'Yes — the entire design phase was delivered through digital workshops, 3D visualization, and cloud-based coordination, without traditional in-person meetings.' },
          { question: 'What is the design organized around?', answer: 'A generous internal courtyard at the center of the villa, providing a protected, private outdoor environment for the family.' },
          { question: 'What is the current project status?', answer: 'The design phase was completed in May 2026; AHW is now leading project management through construction.' }
        ],
        cta: {
          headline: 'Managing a Project From Another Country?',
          subtext: "Let's talk about a design process built for clients who can't be on-site."
        },
        seo: {
          title: 'Courtyard Villa Design — Al Khawaneej, Dubai | AHW Architects',
          description: 'A 1,200 sqm courtyard villa in Al Khawaneej, Dubai, designed entirely through remote collaboration for an international client. By AHW Architects.',
          focusKeyword: 'courtyard villa design Dubai',
          secondaryKeywords: ['remote architecture design UAE', 'villa design Al Khawaneej', 'luxury villa architecture Dubai', 'remote project management Dubai'],
          ogTitle: 'A Villa Designed Entirely Through Remote Collaboration',
          ogDescription: 'How AHW designed a 1,200 sqm courtyard villa in Dubai for a client whose schedule ruled out in-person meetings entirely.',
          twitterTitle: 'Al Khawaneej Villa: Designed Remotely, Built Around a Courtyard',
          twitterDescription: 'A 1,200 sqm courtyard villa in Dubai, designed through a fully remote process by AHW Architects.'
        }
      }
    }
  },
  {
    id: '18',
    slug: "surra-villa-kuwait",
    title: 'Surra Private Villa',
    sector: 'Residential',
    city: 'Surra',
    market: 'Kuwait',
    area: '750',
    year: '2021',
    tier: 'Flagship',
    services: ['Architecture', 'Interior Design', 'Design & Build', 'Project Management'],
    client: 'Private Client',
    status: 'Completed',
    resultStatement: 'A luxury private residential villa in Surra, Kuwait, designed and delivered by AHW Architects — combining contemporary architecture with refined, timeless interiors built around the family\'s everyday life.',
    heroImage: '/ahw-projects-assets/20-surra-villa/Orignal/surra-villa-interior-detail-143-mfgf.jpg',
    hubFlagshipImage: '/ahw-projects-assets/20-surra-villa/Orignal/surra-villa-interior-detail-144-hoev.jpg',
    ogImage: '/ahw-projects-assets/20-surra-villa/Orignal/surra-villa-interior-detail-143-mfgf.jpg',
    caseStudy: {
      brief: {
        clientProblem: "The client wanted a contemporary family residence that combines elegance, comfort, and long-term functionality — a home designed around how the family actually lives, on a 750 sqm site in Surra.",
        definitionalSentence: 'Luxury Living Designed Around Everyday Life.'
      },
      design: {
        images: [
          '/ahw-projects-assets/20-surra-villa/Orignal/DSC09896.jpg'
        ],
        keyDecision: 'The villa was planned to maximize natural light, privacy, circulation, and spatial balance, using warm natural materials, clean architectural lines, and carefully integrated lighting to create interiors that feel timeless rather than trend-driven.'
      },
      build: {
        images: [
          '/ahw-projects-assets/20-surra-villa/Orignal/DSC09908.jpg'
        ],
        duration: 'Completed in 2021',
        challengeResolution: "AHW Architects managed the complete project lifecycle — architectural design, interior design, design & build, construction management, project management, and site supervision — as a single turnkey scope, with close client collaboration ensuring every decision reflected the family's lifestyle.",
        features: ['Full Turnkey Delivery', 'Integrated Architecture & Interior Design', 'Site Supervision Throughout Construction']
      },
      result: {
        images: [
          '/ahw-projects-assets/20-surra-villa/Orignal/DSC09918.jpg',
          '/ahw-projects-assets/20-surra-villa/Orignal/surra-villa-interior-detail-144-hoev.jpg'
        ],
        outcomes: [
          'Successfully completed and handed over in 2021',
          'Delivered a home that balances refined, elegant design with practical daily family living',
          "Another example of AHW Architects' commitment to quality craftsmanship and transparent project management"
        ]
      },
      relatedProjects: ['khiran-chalet-kuwait', 'nozha-private-villa-kuwait'],
      relatedExpertise: {
        title: 'Residential Design & Build',
        href: '/expertise/design-build'
      },
      narrative: {
        heroHeadline: 'A Family Home Designed Around How They Actually Live.',
        heroSubtitle: "On a 750 sqm site in Surra, the goal wasn't to build the most striking house on the street — it was to build the right one for a specific family's daily rhythm. Natural light, privacy, and circulation were planned around real routines, not around a showroom idea of what a villa should look like.",
        story: [
          "Every successful home starts with understanding the people who'll actually live in it, not just the site it sits on. For this family, that meant a villa where the design decisions — where light enters, how rooms connect, where privacy is protected — were made around daily life rather than around a fixed style to chase.",
          "A full-height glazed atrium ties the floors together visually while pulling daylight deep into the plan, a structural and lighting decision that shapes how the whole house feels from the inside. AHW carried the project as a single turnkey scope — architecture, interior design, construction management, and site supervision — with close client collaboration ensuring every decision reflected how the family actually lives, not how a brochure suggests they should. The villa was completed and handed over in 2021."
        ],
        designPhilosophy: "Warm natural materials, clean architectural lines, and a full-height glazed atrium work together to bring daylight deep into the plan while keeping the interiors calm rather than showy — designed to feel right in five years, not just on handover day.",
        whyDifferent: "The measure of success here wasn't visual drama, it was fit — a home shaped around one family's actual daily life, with a full turnkey scope that meant every discipline, from architecture to site supervision, stayed accountable to that same brief throughout.",
        clientExperience: [
          'A single turnkey scope covering architecture, interior design, construction, and site supervision',
          'Design decisions grounded in the family\'s actual daily routines',
          'Completed and handed over in 2021'
        ],
        imageStory: {
          result: 'The completed interiors show the full-height glazed atrium and skylight that connect the floors and carry daylight deep into the plan — the architectural centerpiece of the home.'
        },
        faq: [
          { question: 'What is the size of Surra Private Villa?', answer: 'Approximately 750 sqm.' },
          { question: 'What services did AHW provide?', answer: 'Architectural design, interior design, design & build, construction, and project management, delivered as a single turnkey scope.' },
          { question: 'When was the project completed?', answer: 'The villa was completed and handed over in 2021.' }
        ],
        cta: {
          headline: 'Planning a Family Home in Kuwait?',
          subtext: "Let's talk about designing around how you actually live, not just how a villa is supposed to look."
        },
        seo: {
          title: 'Surra Private Villa — Residential Design & Build in Kuwait | AHW Architects',
          description: 'A 750 sqm private villa in Surra, Kuwait, designed around daily family life with a full-height glazed atrium. By AHW Architects.',
          focusKeyword: 'Surra Villa Kuwait',
          secondaryKeywords: ['villa design Kuwait', 'residential architecture Kuwait', 'design build Kuwait', 'turnkey villa Kuwait', 'family villa design'],
          ogTitle: 'A Private Villa in Surra, Designed Around Daily Family Life',
          ogDescription: 'Explore a 750 sqm villa in Surra, Kuwait, built around a full-height glazed atrium and delivered as a single turnkey scope by AHW Architects.',
          twitterTitle: 'Surra Villa: Built Around Everyday Life',
          twitterDescription: 'A 750 sqm family villa in Kuwait, designed and delivered turnkey by AHW Architects.'
        }
      }
    }
  },
  {
    id: '19',
    slug: "aurea-social-house-new-capital-egypt",
    title: 'AUREA Social House',
    sector: 'Hospitality',
    city: 'New Administrative Capital, Cairo',
    market: 'Egypt',
    area: '650',
    year: '2026',
    tier: 'Flagship',
    services: ['Architecture', 'Interior Design', 'Design & Build', 'Project Management'],
    client: 'Confidential',
    status: 'Concept Design',
    resultStatement: 'AUREA Social House is envisioned as a landmark hospitality destination within Egypt\'s New Administrative Capital, offering an elevated experience that blends specialty coffee, premium dining, and business hospitality under one refined architectural identity.',
    heroImage: '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-exterior-facade-m41n.png',
    hubFlagshipImage: '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-interior-detail-146-4h82.png',
    ogImage: '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-exterior-facade-m41n.png',
    caseStudy: {
      brief: {
        clientProblem: 'The client required a comprehensive Design & Build service, from concept through execution, maintaining a single point of responsibility for quality, cost, schedule, and coordination for a 650 sqm hospitality space.',
        definitionalSentence: 'A luxury restaurant and specialty coffee destination blending contemporary luxury, biophilic design, and organic modern aesthetics.'
      },
      design: {
        images: [
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-interior-design-5cmr.png',
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-interior-design-kmqz.png',
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-open-kitchen-counter-uu6z.png',
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-open-kitchen-counter-kr56.png'
        ],
        keyDecision: 'Adopting a biophilic, organic modern design language using Autodesk Revit and Corona Renderer to perfectly visualize the integration of specialty coffee, dining, and business lounges.'
      },
      build: {
        images: [
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-open-kitchen-counter-enj9.png',
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-luxury-bathroom-ma5y.png'
        ],
        duration: 'Design Completion: Sept 2026',
        challengeResolution: 'Delivering end-to-end Project Management and Site Supervision to ensure strict adherence to the brand integration, lighting, and MEP coordination documents.',
        features: ['Turnkey Design & Build', 'Project Management', 'Construction Supervision']
      },
      result: {
        images: [
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-exterior-facade-m41n.png',
          '/ahw-projects-assets/18-AUREA SOCIAL HOUSE/design/aurea-social-house-interior-detail-146-4h82.png'
        ],
        outcomes: ['A landmark hospitality destination in the New Administrative Capital', 'Seamlessly blending premium dining, business hospitality, and contemporary lifestyle']
      },
      relatedProjects: ['new-brew-coffee-salmiya-kuwait', 'tmreya-cafe-kout-mall-kuwait'],
      relatedExpertise: {
        title: 'Hospitality Design',
        href: '/expertise/fit-out'
      },
      narrative: {
        heroHeadline: 'One Address, Three Reasons to Walk In.',
        heroSubtitle: "Specialty coffee, premium dining, and business hospitality don't usually share a floor plan — each pulls a space toward a different rhythm. AUREA Social House, a 650 sqm destination taking shape in Egypt's New Administrative Capital, is being designed to hold all three under one architectural identity.",
        story: [
          "A coffee counter, a dining room, and a business lounge each want something different from a space — fast turnover and energy for one, unhurried comfort for another, quiet and privacy for the third. Designing all three into 650 sqm without any of them undermining the others is the core problem AUREA Social House is solving in its design phase.",
          "The direction taken is biophilic and organic-modern — a design language chosen specifically because natural materials, planting, and softened forms can shift register across a coffee bar, a dining room, and a lounge without feeling like three different buildings stitched together. AHW is carrying the project as a single Design & Build scope, holding one point of responsibility for quality, cost, schedule, and coordination through to project management and site supervision during construction."
        ],
        designPhilosophy: "A biophilic, organic-modern language — natural materials, planting, softened architectural forms — was chosen because it can flex across genuinely different uses without breaking character, letting a coffee counter, a dining room, and a business lounge read as one place rather than three.",
        whyDifferent: "Most hospitality projects design for one mode of use. AUREA Social House is being designed for three simultaneously — specialty coffee, dining, and business hospitality — under a single architectural identity, with AHW holding the full Design & Build scope end to end.",
        clientExperience: [
          'A single Design & Build point of responsibility across quality, cost, schedule, and coordination',
          'Biophilic design direction developed and visualized in detail before construction begins',
          'AHW-led project management and site supervision carrying the project through construction'
        ],
        faq: [
          { question: 'What is AUREA Social House?', answer: 'A 650 sqm hospitality destination in the New Administrative Capital, Egypt, combining specialty coffee, premium dining, and business hospitality in one space.' },
          { question: 'What is the design direction?', answer: 'A biophilic, organic-modern design language, chosen to let the space shift between coffee, dining, and business hospitality uses under one architectural identity.' },
          { question: 'What is AHW\'s scope?', answer: 'A full Design & Build scope — architecture, interior design, project management, and site supervision — under a single point of responsibility.' }
        ],
        cta: {
          headline: 'Building a Multi-Concept Hospitality Destination in Egypt?',
          subtext: "Let's talk about designing several experiences into one coherent identity."
        },
        seo: {
          title: 'AUREA Social House — Hospitality Design, New Capital Egypt | AHW Architects',
          description: 'A 650 sqm hospitality destination in Egypt\'s New Administrative Capital, blending coffee, dining, and business hospitality. By AHW Architects.',
          focusKeyword: 'hospitality design New Capital Egypt',
          secondaryKeywords: ['restaurant design Egypt', 'biophilic interior design', 'business lounge design Egypt', 'Design & Build hospitality Egypt'],
          ogTitle: 'A Hospitality Destination Designed to Hold Three Experiences at Once',
          ogDescription: 'AUREA Social House: a 650 sqm coffee, dining, and business hospitality destination taking shape in Egypt\'s New Administrative Capital.',
          twitterTitle: 'AUREA Social House: Coffee, Dining, Business — One Address',
          twitterDescription: 'A 650 sqm hospitality destination in New Capital, Egypt, designed by AHW Architects.'
        }
      }
    }
  },
  {
    id: '20',
    slug: "beit-al-watan-residential-new-cairo-egypt",
    title: 'Beit Al Watan Smart Residential Building',
    sector: 'Residential',
    city: 'New Cairo',
    market: 'Egypt',
    area: 'Unknown',
    year: '2027',
    tier: 'Flagship',
    services: ['Architecture', 'Design & Build', 'Project Management', 'Construction Supervision'],
    client: 'Confidential',
    status: 'Under Construction',
    resultStatement: 'A smart residential development in New Cairo\'s Beit Al Watan district, guided by AHW Architects from land evaluation and acquisition through design, construction, and future smart-building integration. Expected completion March 2027.',
    heroImage: '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-hero.png',
    hubFlagshipImage: '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-10.png',
    ogImage: '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-hero.png',
    caseStudy: {
      brief: {
        clientProblem: 'The client needed guidance through an entire property development lifecycle in New Cairo\'s Third District — evaluating whether the land itself was worth buying, through acquisition, design, authority approvals, construction, and eventual smart-building delivery — not just an architect brought on after a plot was already purchased.',
        definitionalSentence: 'Property Development Guided From Before the Land Was Bought.'
      },
      design: {
        images: [
          '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-hero.png',
          '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-01.jpg',
          '/ahw-projects-assets/19-beit-al-watan-building/design/beit-al-watan-design-02.png'
        ],
        keyDecision: 'Existing approved drawings were comprehensively redesigned rather than built as-is — every decision weighed against investment return, construction cost, long-term value, functional efficiency, luxury living, and regulatory compliance, aiming for the spatial quality typically associated with premium gated communities.'
      },
      build: {
        images: [
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-01.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-02.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-03.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-04.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-05.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-06.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-07.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-08.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-09.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-10.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-11.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-12.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-13.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-14.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-15.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-16.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-17.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-18.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-19.png'
        ],
        duration: 'Ongoing — Expected Completion March 2027',
        challengeResolution: 'Material approval requirements and façade colour regulations both changed mid-construction under New Cairo Authority review. Rather than reducing quality to satisfy the revised rules, AHW upgraded the façade specification to Royal Travertine Stone — preserving the building\'s architectural identity while fully complying with the updated authority requirements.',
        features: ['Solid Concrete Block Masonry (First Two Courses)', 'Premium Waterproof Concrete & High-Performance Waterproofing', 'Royal Travertine Stone Façade', 'Future-Ready Smart Building Infrastructure']
      },
      result: {
        images: [
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-10.png',
          '/ahw-projects-assets/19-beit-al-watan-building/orignal/beit-al-watan-construction-07.png'
        ],
        outcomes: [
          'Façade specification upgraded to Royal Travertine Stone in direct response to revised New Cairo Authority regulations, with no compromise to architectural identity',
          'Structural frame and masonry construction underway to standards exceeding typical residential norms',
          'Infrastructure planned from the outset for smart-building integration ahead of expected completion in March 2027'
        ]
      },
      relatedProjects: ['stone-residence-new-cairo-egypt', 'shrouk-city-apartment-egypt'],
      relatedExpertise: {
        title: 'Design & Build',
        href: '/expertise/design-build'
      },
      narrative: {
        heroHeadline: 'A Building AHW Shaped Before the Land Was Even Bought.',
        heroSubtitle: 'Beit Al Watan is not a design commission that started with a finished plot. AHW Architects evaluated the investment opportunity, advised on land acquisition, and has stayed on through design, authority approvals, and construction — one continuous engagement instead of three separate hires.',
        story: [
          'The development began before the site was purchased. AHW Architects evaluated the investment opportunity, reviewed the land in New Cairo\'s Third District, advised on acquisition strategy, and supported the client through the approval process that followed — work that normally happens before an architect is ever involved.',
          'Existing approved drawings were comprehensively redesigned while maintaining full regulatory compliance, coordinated directly with both the licensing office and the New Cairo Authority. Every design decision was weighed against investment return, construction cost, long-term value, functional efficiency, luxury living, and regulatory compliance at once — aiming for apartments that deliver the spatial quality typically associated with premium gated communities, without treating investment performance as an afterthought.',
          'That balancing act was tested directly during construction: material approval requirements and façade colour regulations both changed under New Cairo Authority review mid-project. AHW\'s response was to upgrade the façade specification to Royal Travertine Stone rather than dilute the design to meet the revised rules — full compliance without a compromised building.'
        ],
        designPhilosophy: 'Luxury is not created by increasing construction cost — it is achieved through intelligent engineering. Every architectural and engineering decision on this project was measured against whether it improved investment return, construction cost, operational efficiency, maintenance, durability, user experience, resale value, architectural quality, execution quality, or future technology readiness.',
        whyDifferent: 'Most residential projects start with a purchased plot and a set of drawings. This one started with AHW evaluating whether the land was worth buying at all. The scope that followed — investment consultancy, developer representation, land evaluation, architectural design, authority coordination, value engineering, cash flow planning, tender support, material engineering, construction supervision, and smart-building planning — is a full property development lifecycle under one roof, not a design service handed off between specialists.',
        clientExperience: [
          'Involved before land acquisition — investment analysis and acquisition support, not just design after the purchase',
          'Existing approved drawings comprehensively redesigned while maintaining full regulatory compliance',
          'Direct, ongoing coordination with the licensing office and New Cairo Authority',
          'Façade upgraded to Royal Travertine Stone in direct response to evolving authority regulations, with no compromise to design identity',
          'Construction executed to standards exceeding typical residential norms — solid concrete block masonry, premium waterproofing, high-performance façade systems',
          'Infrastructure planned from day one for future smart-building technology, not retrofitted later'
        ],
        imageStory: {
          design: 'The approved design vision: a Royal Travertine façade over a smart-building-ready structure, redrawn from the original approved plans to balance investment performance with premium gated-community-level living.',
          build: 'Construction documentation from excavation through the current structural and façade stage — solid masonry, premium waterproofing, and the travertine stone specification taking shape on site.',
          result: 'Progress to date: structural frame and façade construction underway, ahead of an expected completion in March 2027.'
        },
        faq: [
          { question: 'Is Beit Al Watan Smart Residential Building completed?', answer: 'No — the project is currently under construction, with completion expected in March 2027.' },
          { question: 'What makes AHW\'s role on this project different from a typical residential commission?', answer: 'AHW Architects was involved before the land was purchased — evaluating the investment opportunity, advising on acquisition, and then staying on through design, authority coordination, and construction as one continuous engagement.' },
          { question: 'Why does the façade use Royal Travertine Stone?', answer: 'New Cairo Authority\'s material approval requirements and façade colour regulations changed during construction. Rather than reduce quality to meet the revised rules, AHW upgraded the façade specification to Royal Travertine Stone, preserving the architectural identity while fully complying with the new requirements.' },
          { question: 'What smart building technology is the project designed to support?', answer: 'The infrastructure is designed to support license plate recognition, smart gates, access control, video intercom, building automation, home automation, and energy monitoring, so the resident experience can extend seamlessly from arrival through daily living.' },
          { question: 'What services did AHW provide beyond architectural design?', answer: 'Investment consultancy, developer representation, land evaluation, project management, authority coordination, value engineering, cash flow and tender support, material engineering, construction supervision, quality control, and smart-building planning.' }
        ],
        cta: {
          headline: 'Evaluating Land Before You\'ve Committed to Buy It?',
          subtext: 'Talk to AHW about treating investment evaluation, design, and construction as one continuous process instead of three separate hires.'
        },
        seo: {
          title: 'Beit Al Watan Smart Residential Building — New Cairo | AHW Architects',
          description: 'A smart residential development in New Cairo\'s Beit Al Watan, guided by AHW Architects from land evaluation through construction. Under construction, expected completion March 2027.',
          focusKeyword: 'smart residential building New Cairo',
          secondaryKeywords: ['Beit Al Watan development', 'New Cairo investment development', 'smart building design Egypt', 'design and build New Cairo', 'Royal Travertine facade'],
          ogTitle: 'A Residential Building AHW Shaped Before the Land Was Even Bought',
          ogDescription: 'Beit Al Watan Smart Residential Building: investment evaluation through construction, one continuous engagement in New Cairo. By AHW Architects.',
          twitterTitle: 'Beit Al Watan: Smart Residential, New Cairo',
          twitterDescription: 'From land evaluation to smart-building integration — a New Cairo residential development guided end-to-end by AHW Architects.'
        }
      }
    }
  }
];

export interface PrincipalExperienceEntry {
  id: string;
  slug: string;
  title: string;
  sector: string;
  city: string;
  market: string;
  area?: string;
  images: {
    feature: string;
    detail01?: string;
    detail02?: string;
    detail03?: string;
    detail04?: string;
  };
  description?: string;
  clientTestimonial?: string;
}

export const principalExperience: PrincipalExperienceEntry[] = [
  {
    id: 'p1',
    slug: 'starbucks-lebanon',
    title: 'Starbucks Drive-Thru',
    sector: 'Hospitality',
    city: 'Mastita',
    market: 'Lebanon',
    area: '650',
    images: {
      feature: '/ahw-projects-assets/principal-portfolio/starbucks-lebanon/principal-portfolio-interior-detail-153-tx4w.jpg',
      detail01: '/ahw-projects-assets/principal-portfolio/starbucks-lebanon/principal-portfolio-interior-detail-154-0syr.jpg',
      detail02: '/ahw-projects-assets/principal-portfolio/starbucks-lebanon/principal-portfolio-interior-detail-155-lwpr.jpg',
    },
    description: "Located in Mastita, Lebanon, this Starbucks drive-thru began with structural site supervision from the concrete stage. After the building was handed over as a completed concrete shell, Mahmoud Al Wardany led the full fit-out — from foundation and infrastructure work through to final key handover, including installation of the signage and branding — during his tenure at a previous firm, prior to founding AHW Architects.",
    clientTestimonial: "Working with Mahmoud on this drive-thru ensured the build met international brand standards without sacrificing local execution speed."
  },
  {
    id: 'p2',
    slug: 'sultan-center-al-kout-personal',
    title: 'Sultan Center — Al Kout',
    sector: 'Commercial',
    city: 'Fahaheel',
    market: 'Kuwait',
    area: '2,000',
    images: {
      feature: '/ahw-projects-assets/principal-portfolio/sultan-center-al-kout-personal/principal-portfolio-interior-detail-156-qwjy.jpg',
      detail01: '/ahw-projects-assets/principal-portfolio/sultan-center-al-kout-personal/principal-portfolio-interior-detail-157-fyw3.jpg',
      detail02: '/ahw-projects-assets/principal-portfolio/sultan-center-al-kout-personal/principal-portfolio-interior-detail-158-0vvf.jpg',
      detail03: '/ahw-projects-assets/principal-portfolio/sultan-center-al-kout-personal/principal-portfolio-interior-detail-159-3044.jpg',
      detail04: '/ahw-projects-assets/principal-portfolio/sultan-center-al-kout-personal/principal-portfolio-interior-detail-160-hu0t.jpg',
    },
    description: 'A 2,000 m² hypermarket fit-out in Fahaheel — the kind of project where retail design and operational logistics have to work as one system, from refrigerated aisles to peak-hour circulation. Mahmoud Al Wardany led execution and fit-out delivery here during his tenure at a previous firm, prior to founding AHW Architects.\n\nThe relationship built on this project carried forward: Sultan Center later entrusted AHW Architects with the renovation and remodelling of its 4,500 m² Hawally branch — one of the firm\'s flagship projects today.',
    clientTestimonial: undefined
  }
];
