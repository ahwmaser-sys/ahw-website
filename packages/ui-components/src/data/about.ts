export interface LeadershipProfile {
  id: string;
  name: string;
  role: string;
  title: string;
  description: string;
}

export interface ValueProposition {
  id: string;
  title: string;
  description: string;
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
}

export interface Strength {
  id: string;
  title: string;
  description: string;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  milestone?: boolean;
  image?: string;
}

export interface AboutTextContent {
  aboutHeroSubtitle: string;
  aboutIntroTitle: string;
  aboutIntroParagraph1: string;
  aboutIntroParagraph2: string;
  storyHeroTitle: string;
  storyHeroSubtitle: string;
  storySectionTitle: string;
  storyParagraph1: string;
  storyParagraph2: string;
  processSectionTitle: string;
  processSectionIntro: string;
  leadershipSectionTitle: string;
  leadershipSectionIntro: string;
  aboutUsNextStepTitle: string;
  aboutUsNextStepText: string;
  whyAhwHeroTitle: string;
  whyAhwHeroSubtitle: string;
  whyAhwIntroParagraph: string;
  whyAhwPillarsTitle: string;
  whyAhwStrengthsTitle: string;
  whyAhwConfidenceTitle: string;
  whyAhwConfidenceText: string;
  whyAhwCtaTitle: string;
  whyAhwCtaText: string;
  careersHeroTitle: string;
  careersHeroSubtitle: string;
  careersIntroTitle: string;
  careersIntroText: string;
  careersDownloadTitle: string;
  careersDownloadText: string;
  careersFormTitle: string;
  careersFormText: string;
}

export interface AboutData {
  companyName: string;
  founded: string;
  headquarters: string;
  offices: string[];
  totalProjects: string;
  yearsOfExperience: string;
  visionStatement: string;
  missionStatement: string;
  tagline: string;
  leadership: LeadershipProfile[];
  process: ValueProposition[];
  whyAhwPillars: Pillar[];
  whyAhwStrengths: Strength[];
  timeline: TimelineEvent[];
  textContent: AboutTextContent;
}

export const aboutData: AboutData = {
  companyName: 'AHW Architects',
  founded: '2012',
  headquarters: 'Kuwait City, Kuwait',
  offices: ['Kuwait', 'Egypt', 'UAE', 'China (Supported Office)'],
  totalProjects: '250+',
  yearsOfExperience: '22+',
  tagline: 'We don\'t just design spaces. WE BUILD LEGACIES.',
  visionStatement: 'To be the integrated Design-Build partner developers, investors, and homeowners turn to first across Kuwait, Egypt, and the UAE — where architecture, engineering, and construction are never separate hires.',
  missionStatement: 'We design and build every project — from private residences to commercial fit-outs — under one accountable team, from first concept through final handover, so clients never have to coordinate between separate architects, engineers, and contractors themselves.',
  leadership: [
    {
      id: 'ahmed-al-wardany',
      name: 'Ahmed Al Wardany',
      role: 'Founder | Principal',
      title: 'Visionary Design Leader',
      description: 'Ahmed Al Wardany founded AHW Architects in Kuwait City in 2012, structuring it from day one as an integrated Architecture, Engineering, and Construction practice rather than a design-only studio. As Principal, he sets the firm\'s design direction across all three of AHW\'s markets — Kuwait, Egypt, and the UAE — with a focus on buildings designed to hold their value over decades, not just at handover.'
    },
    {
      id: 'mahmoud-al-wardany',
      name: 'Mahmoud Al Wardany',
      role: 'Managing Partner | Egypt CEO',
      title: 'Design & Execution Expert',
      description: 'Mahmoud Al Wardany leads AHW\'s Egypt operations as Managing Partner and Egypt CEO. His path into the firm ran through years of hands-on fit-out and construction delivery at a previous firm — including a Starbucks drive-thru in Lebanon and the Sultan Center hypermarket in Al Kout, Kuwait, shown below under Professional Experience — before he co-founded AHW to bring design and execution under one accountable team. He applies that same site-level discipline to AHW\'s own projects today, from the firm\'s Egypt headquarters build-out to Sultan Center\'s later Hawally renovation.'
    }
  ],
  whyAhwPillars: [
    {
      id: 'integrated-design-build',
      title: 'Integrated Design-Build',
      description: 'One team carries a project from concept through construction — architecture, engineering, and site supervision under a single scope, not handed between separate firms at each phase.'
    },
    {
      id: 'precision-engineering',
      title: 'Precision Engineering',
      description: 'Structural and MEP coordination happens during design, not after — catching engineering conflicts on paper instead of on site, where they cost far more to fix.'
    },
    {
      id: 'timeless-architecture',
      title: 'Timeless Architecture',
      description: 'Design decisions are weighed for how a building performs over decades — materials, maintenance, and resale value — not just how it looks at handover.'
    },
    {
      id: 'transparent-delivery',
      title: 'Transparent Project Delivery',
      description: 'Clients see where budget and schedule actually stand throughout construction, reported at every phase rather than surfaced only at milestones.'
    },
    {
      id: 'quality-uncompromised',
      title: 'Quality Without Compromise',
      description: 'When authority regulations or site conditions force a change, the response is to upgrade the specification, not lower it — as with the Royal Travertine façade upgrade on Beit Al Watan, made to meet revised New Cairo Authority requirements without compromising the design.'
    },
    {
      id: 'long-term-partnership',
      title: 'Long-Term Partnership',
      description: 'Client relationships extend past handover — Sultan Center returned to AHW for a second, larger project after their first, and that pattern shapes how every new engagement is run.'
    }
  ],
  whyAhwStrengths: [
    {
      id: 'years-exp',
      title: '22+ Years of Founders\' Experience',
      description: 'Combined professional experience of AHW\'s founders across the MENA region, spanning their careers before and since founding the firm in 2012.'
    },
    {
      id: 'integrated-aec',
      title: 'Integrated AEC',
      description: 'Architecture, Engineering, and Construction under one roof.'
    },
    {
      id: 'turnkey',
      title: 'Turnkey Project Delivery',
      description: 'From initial concept to final handover, we manage it all.'
    },
    {
      id: 'project-management',
      title: 'Dedicated Project Management',
      description: 'Proactive oversight ensuring on-time and on-budget delivery.'
    },
    {
      id: 'commercial',
      title: 'Commercial Projects',
      description: 'Strategic designs that elevate brand presence and operational efficiency.'
    },
    {
      id: 'residential',
      title: 'Luxury Residential',
      description: 'Bespoke, high-end living spaces tailored to discerning lifestyles.'
    },
    {
      id: 'hospitality',
      title: 'Hospitality Design',
      description: 'Creating immersive, world-class guest experiences.'
    },
    {
      id: 'office-fitout',
      title: 'Office Fit-Out',
      description: 'Premium corporate interiors that inspire productivity and innovation.'
    },
    {
      id: 'quality-standards',
      title: 'International Quality Standards',
      description: 'Rigorous compliance with global best practices.'
    }
  ],
  process: [
    {
      id: 'consultation',
      title: 'Consultation & Briefing',
      description: 'Engaging a design and construction partner early in our process is a key element in creating a successful journey. We ensure all essential requirements are analysed and included.'
    },
    {
      id: 'concept',
      title: 'Concept & Cost Planning',
      description: 'Following the brief, we produce comprehensive sketches and preliminary planning concepts to match your vision and eventually reach your budget goals.'
    },
    {
      id: 'design',
      title: 'Design & Documentation',
      description: 'The decisions made and requirements specified are brought to life in drawings and 3D modeling.'
    },
    {
      id: 'engineering',
      title: 'Value Engineering',
      description: 'A process focused on cost reduction and performance improvements which are paramount in the value equation without affecting the main concept.'
    },
    {
      id: 'construction',
      title: 'Construction & Project Delivery',
      description: 'We use an integrated approach to design and construct to transform your project workspace and deliver unique, exceptional environments.'
    },
    {
      id: 'maintenance',
      title: 'Maintenance & Warranty',
      description: 'We take great pride in our work and ensure that all elements of your project operate correctly before handover, remaining ready for any problems.'
    }
  ],
  timeline: [
    {
      year: '2012',
      title: 'Foundation',
      description: 'Founded in Kuwait City, AHW Architects formalized the founders\' design, construction, and project management experience into a single integrated Design-Build practice, with its head office established in Kuwait.',
      milestone: true,
      image: '/images/about/timeline_foundation.jpg',
    },
    {
      year: '2015',
      title: 'China Partnership',
      description: 'AHW partnered with a regional office in China to source materials and support the delivery of specialized designs, strengthening the firm\'s supply chain for premium finishes.',
      image: '/images/about/timeline_china.jpg',
    },
    {
      year: '2021',
      title: 'Dubai Expansion',
      description: 'AHW Architects expanded into the UAE, opening a new office in Dubai.',
      milestone: true,
      image: '/images/about/timeline_dubai.jpg',
    },
    {
      year: '2022',
      title: 'Egypt Office',
      description: 'AHW Architects officially launched its Egypt office in Cairo.',
      milestone: true,
      image: '/images/about/timeline_egypt.jpg',
    }
  ],
  textContent: {
    aboutHeroSubtitle: 'From intimate residential spaces to expansive commercial projects, our goal is to enhance functionality while creating beautiful, well-designed environments tailored to your needs.',
    aboutIntroTitle: 'From Concept to Iconic Reality',
    aboutIntroParagraph1: 'At AHW Architects, innovation and craftsmanship converge to transform your vision into reality. As a leader in design, construction, and fit-out services, we are committed to bringing your ideas to life with precision and creativity.',
    aboutIntroParagraph2: 'With over 22+ years of experience and 250+ projects delivered across the MENA and GCC regions, we provide a multidisciplinary approach that ensures precision from pre-construction to final handover.',
    storyHeroTitle: 'Our Story',
    storyHeroSubtitle: 'Building Legacies Since 2012',
    storySectionTitle: 'The Journey',
    storyParagraph1: 'AHW Architects was founded in Kuwait City in 2012, built around a simple structural choice: keep architecture, engineering, and construction inside one accountable team, instead of handing a project between separate firms at every phase.',
    storyParagraph2: 'Since then, the firm has grown into a three-market practice across Kuwait, Egypt, and the UAE, working across residential, commercial, hospitality, retail, and workplace projects — from private villas and apartment renovations to retail fit-outs and full commercial builds. The combined track record behind AHW today spans 250+ delivered projects and 22+ years of the founders\' professional experience.',
    processSectionTitle: 'Our Process',
    processSectionIntro: 'We develop the design and construction requirements of each client through a deep understanding of project budgets, goals, surrounding environment, legal aspects, and economic considerations.',
    leadershipSectionTitle: 'Our Leadership',
    leadershipSectionIntro: 'When you work with AHW, you connect with an experienced leadership team who will work directly on your project from beginning to completion.',
    aboutUsNextStepTitle: 'Ready to Build Your Legacy?',
    aboutUsNextStepText: 'Whether you\'re evaluating land before you buy it or ready to break ground, AHW brings architecture, engineering, and construction under one team. Let\'s talk about your next project.',
    whyAhwHeroTitle: 'Design Creates Vision.',
    whyAhwHeroSubtitle: 'Execution Delivers Trust.',
    whyAhwIntroParagraph: 'AHW Architects is structured as a fully integrated Architecture, Interior Design, Engineering, and Construction management firm — not a design studio that subcontracts execution. That means the same team that draws a project is accountable for building it, from commercial and hospitality fit-outs to residential developments, across every stage from concept to handover.',
    whyAhwPillarsTitle: 'The Architecture of Excellence',
    whyAhwStrengthsTitle: 'What Drives Our Global Edge',
    whyAhwConfidenceTitle: 'Uncompromising Integrated Delivery',
    whyAhwConfidenceText: 'When architecture, engineering, and construction sit inside separate firms, every handoff between them is a place where scope, cost, and timeline can quietly drift. AHW removes those handoffs: one team carries a project from land evaluation and concept through construction supervision and final handover, accountable for the whole outcome rather than just their piece of it. That structure is why AHW gets brought back — Sultan Center returned for a second, larger project after the first, and Beit Al Watan\'s developer kept AHW on through land acquisition, design, and construction as one continuous engagement.',
    whyAhwCtaTitle: 'Let\'s Build Something Exceptional Together.',
    whyAhwCtaText: 'We invite you to discuss your next commercial, hospitality, luxury residential, mixed-use, or corporate interior fit-out project with our executive team.',
    careersHeroTitle: 'Careers at AHW',
    careersHeroSubtitle: 'Build Your Legacy With Us',
    careersIntroTitle: 'Join a team driven by excellence.',
    careersIntroText: 'We are always looking for talented architects, engineers, interior designers, and construction professionals who share our passion for creating meaningful spaces. Even if there are no current openings that match your profile, we encourage you to submit a general application.',
    careersDownloadTitle: 'HR Application Form',
    careersDownloadText: 'Please download our official HR Application Form, fill it out completely, and upload it below along with your CV.',
    careersFormTitle: 'General Application',
    careersFormText: 'Fill out the form below to submit your profile to our recruitment team.',
  }
};
