import { aboutData } from './about';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: 'what-is-design-build',
    question: 'What is "Design & Build" and how is it different from hiring an architect and a contractor separately?',
    answer:
      'Design & Build means a single firm is responsible for both the architectural design and the physical construction, from concept through to handover. Instead of coordinating between a separate architect and a separate contractor — and absorbing the risk when their drawings and site realities don\'t match — one team carries the project end to end. AHW Architects operates this way across Architecture, Interior Design, Design & Build, and Fit-Out, so design intent and construction execution stay aligned under one point of responsibility.',
  },
  {
    id: 'services-offered',
    question: 'What services does AHW Architects offer?',
    answer:
      'Four core disciplines: Architecture, Interior Design, Design & Build, and Fit-Out — supported by integrated Engineering & Project Management capabilities that run through every project, including master planning, structural/engineering design, construction management, MEP coordination, and authority approvals. Projects span Residential, Commercial, Hospitality, Workplace, and Retail sectors.',
  },
  {
    id: 'engineering-and-project-management',
    question: 'Does AHW Architects provide engineering and project management?',
    answer:
      'Yes. Engineering and project management run through every AHW project as integrated, supporting capabilities alongside the four core disciplines — structural engineering, MEP coordination, procurement, site supervision, and authority approvals, delivered by the same team responsible for the design.',
  },
  {
    id: 'where-do-you-operate',
    question: 'Where does AHW Architects operate?',
    answer:
      'AHW Architects is headquartered in Kuwait City, with an office in Cairo, Egypt, and project experience across the wider Gulf Cooperation Council region.',
  },
  {
    id: 'egypt-office',
    question: "Does AHW Architects have an office in Egypt?",
    answer:
      "Yes — AHW Architects Masr is AHW's Egypt operation, based in Cairo and led by Mahmoud Al Wardany, Managing Partner and Egypt CEO. It offers the same core disciplines as the wider practice — Architecture, Interior Design, Design & Build, and Fit-Out — as part of the firm headquartered in Kuwait City.",
  },
  {
    id: 'how-experienced',
    question: 'How experienced is AHW Architects?',
    answer:
      `AHW Architects has delivered ${aboutData.totalProjects} projects across the MENA and GCC region, with ${aboutData.yearsOfExperience} years of design and construction experience.`,
  },
  {
    id: 'project-types',
    question: 'What types of projects does AHW Architects work on?',
    answer:
      'Residential (private villas, chalets, and apartment buildings), commercial and retail spaces, hospitality and F&B venues, and corporate workplace fit-outs — see the Projects page for completed and in-progress work in each category.',
  },
  {
    id: 'how-to-start',
    question: 'How do I start a project with AHW Architects?',
    answer:
      'Reach out through the Contact page, call or WhatsApp either office directly, or send a message describing your project — including location, project type, and rough timeline — and the relevant office will follow up to schedule a consultation.',
  },
  {
    id: 'design-and-construction-together',
    question: 'Does AHW Architects handle both design and construction under one roof?',
    answer:
      'Yes. Design & Build is one of AHW Architects\' four core disciplines, meaning the same firm can take a project from initial concept and architectural drawings through to on-site construction and final handover, rather than handing off between separate design and construction firms.',
  },
  {
    id: 'villa-private-residence',
    question: 'Can AHW design and build my villa or private residence?',
    answer:
      'Yes. Private villas, chalets, and apartment buildings are one of the sectors AHW works in most often — see the Residential projects on the Projects page for completed and in-progress examples. A residential project draws on the same integrated model as any other: Interior Design and Architecture for the space itself, Engineering for the structural and MEP work behind it, and Design & Build or Fit-Out to carry it through construction, authority approvals, and handover — all under the one team responsible for the design.',
  },
];
