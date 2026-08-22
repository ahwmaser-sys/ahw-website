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
      'Design & Build means a single firm is responsible for both the architectural design and the physical construction, from concept through to handover. Instead of coordinating between a separate architect and a separate contractor — and absorbing the risk when their drawings and site realities don\'t match — one team carries the project end to end. AHW Architects operates this way across Architecture, Interior Design, Engineering & Project Management, Fit-Out, and Design & Build, so design intent and construction execution stay aligned under one point of responsibility.',
  },
  {
    id: 'services-offered',
    question: 'What services does AHW Architects offer?',
    answer:
      'Five core disciplines: Architecture, Interior Design, Engineering & Project Management, Fit-Out, and Design & Build — covering everything from master planning and structural/engineering design to space planning, bespoke joinery, construction management, MEP coordination, procurement, and authority approvals. Projects span Residential, Commercial, Hospitality, Workplace, and Retail sectors.',
  },
  {
    id: 'where-do-you-operate',
    question: 'Where does AHW Architects operate?',
    answer:
      'AHW Architects is headquartered in Kuwait City, with an office in Cairo, Egypt, and project experience across the wider Gulf Cooperation Council region.',
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
      'Yes. Design & Build is one of AHW Architects\' five core disciplines, meaning the same firm can take a project from initial concept and architectural drawings through to on-site construction and final handover, rather than handing off between separate design and construction firms.',
  },
];
