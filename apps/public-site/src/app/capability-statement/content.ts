// Single source of truth for both the print (/capability-statement/print)
// and web (/capability-statement) surfaces.
//
// Company-wide statistics, owner-verified (not computed from the
// website's own published project list — see git history for why that
// distinction matters: the site's published-project count is always
// smaller than the firm's real track record).
export const stats = [
  { value: '22+', label: 'Years of Experience' },
  { value: '250+', label: 'Projects Completed' },
  { value: '140,000+', label: 'm² Delivered' },
  { value: '3+', label: 'Markets Served' },
] as const;

// Opens on the problem an executive reader already recognizes (design
// and delivery are not the same skill) rather than a firm-description
// sentence any practice could write about itself.
export const firmOverview =
  'Buildings are easy to design. Delivering them exactly as designed — on budget, on programme, without surprises — is where experience matters. At AHW Architects, every decision is tested against buildability, cost and long-term performance before it ever reaches a drawing.';

export const firmPromise =
  'Architecture, interior design and construction sit inside one accountable team — so clients deal with a single point of contact, a single budget and a single outcome, not a chain of consultants passing risk down the line.';

// ── Why Clients Choose AHW ── four reasons a client engages a
// design-build firm over a conventional design-then-tender process,
// each carrying its own weight rather than one of many bullets.
export const whyAhw = [
  {
    title: 'Single Point of Accountability',
    desc: 'One team carries design, cost, schedule and quality from concept to handover. When a decision is needed, there is one number to call — not three consultants pointing at each other.',
  },
  {
    title: 'Construction-Led Design',
    desc: 'Every drawing is resolved for how it will actually be built. Sequencing and site constraints are considered from concept, not discovered on site.',
  },
  {
    title: 'Value Engineering',
    desc: 'Material and method decisions are tested against cost and performance before they reach a drawing — protecting design intent instead of cutting it at tender.',
  },
  {
    title: 'Integrated Delivery',
    desc: 'Design, procurement and construction run on one programme, not three handoffs. Fewer parties means fewer delays, and a building that matches exactly what was approved.',
  },
] as const;

// High-level disciplines only — an executive reader wants to know what
// a firm does, not a service-menu breakdown.
export const services = [
  { title: 'Architecture', desc: 'Context-driven design for complex, large-scale programs.' },
  { title: 'Interior Design', desc: 'Brand-led environments engineered for experience and flow.' },
  { title: 'Design & Build', desc: 'One team, one contract, from concept to construction.' },
  { title: 'Commercial Fit-Out', desc: 'Rapid, precise fit-outs for retail, F&B, and corporate brands.' },
  { title: 'Turnkey Delivery', desc: 'Full lifecycle management through handover and aftercare.' },
  { title: 'Project Management', desc: 'Schedule, budget, and quality governed under one accountable team.' },
] as const;

// Who the practice is built to serve — reads as a client recognizing
// themselves in the list, not a sector-share statistic (no counts:
// only real, owner-verified figures belong on this document, and
// per-sector project counts aren't currently tracked as a verified
// number — see the stats note above for the same principle).
export const audiences = [
  'Developers',
  'Corporate Clients',
  'Retail & F&B Brands',
  'Hospitality',
  'Luxury Residential',
  'Government & Institutional',
] as const;

// Six steps, each a plain client-facing verb rather than an internal
// project-management term — the shape of the process an executive
// reader actually wants to see, not a task list.
export const approach = [
  { number: '01', title: 'Understand', desc: 'Objectives, site, budget and constraints defined before a single line is drawn.' },
  { number: '02', title: 'Design', desc: 'Concept translated into construction-ready architecture, interiors and systems — resolved together, not in sequence.' },
  { number: '03', title: 'Coordinate', desc: 'Materials and methods value-engineered and procured through a vetted supply network, without compromising design intent.' },
  { number: '04', title: 'Build', desc: 'Site delivery under strict safety, schedule and quality discipline, with continuous inspection against international standards.' },
  { number: '05', title: 'Deliver', desc: 'Complete documentation, training and certification handed over on completion — nothing left for the client to chase.' },
  { number: '06', title: 'Support', desc: 'Warranty response and operational support continue after handover. The relationship does not end at the ribbon-cutting.' },
] as const;

// The comparison this document exists to make: why a single
// accountable team outperforms the conventional split-responsibility
// model, shown rather than argued.
export const designBuildComparison = {
  headline: 'Why Design & Build',
  intro: 'The traditional model splits responsibility across parties with competing incentives. AHW Architects removes the split.',
  traditional: {
    label: 'Traditional Method',
    steps: ['Owner', 'Designer', 'Contractor', 'Supplier'],
    outcome: 'Conflicts & Delays',
  },
  ahw: {
    label: 'AHW Method',
    steps: ['One Team', 'One Budget', 'One Programme'],
    outcome: 'Single Responsibility',
  },
} as const;

// Discipline that protects the client's investment at every stage of
// construction — the answer to a developer's real underlying question:
// "what stops this from going wrong."
export const qualityAssurance = [
  { title: 'Drawing Reviews', desc: 'Every construction drawing checked for buildability and coordination before it reaches site.' },
  { title: 'Material Approvals', desc: 'Samples and specifications approved against design intent before procurement is committed.' },
  { title: 'Site Inspections', desc: 'Scheduled inspection at every construction milestone, held to international quality standards.' },
  { title: 'Snagging & Defects', desc: 'Systematic identification and close-out before a space is presented for handover.' },
  { title: 'Testing & Commissioning', desc: 'MEP and building systems tested and commissioned under full operating conditions.' },
  { title: 'Handover Documentation', desc: 'As-built drawings, warranties and O&M manuals delivered complete, not chased after.' },
  { title: 'Warranty & Aftercare', desc: 'Defined response times for post-handover issues — support continues after the ribbon-cutting.' },
] as const;

export const clients = ['Starbucks', 'Samsung', 'Alshaya Co.', 'Giorgio Di Mare', 'Tmreya', 'The Sultan Center'] as const;

// The document's emotional closer before Contact — what working with
// the firm actually feels like, in outcomes a client can hold them to.
export const clientExpectations = [
  { title: 'Predictable Delivery', desc: 'Budget and programme tracked against the approved figure from day one — not discovered at completion.' },
  { title: 'Transparent Communication', desc: 'Direct access to the team accountable for outcomes, not a layer of account management.' },
  { title: 'Consistent Quality', desc: 'The same inspection discipline applied on day one and on the final day of construction.' },
  { title: 'Practical Engineering', desc: 'Solutions resolved for how a building will actually perform and be maintained, not just how it renders.' },
  { title: 'Cost Control', desc: 'No surprise variations disguised as scope creep — changes are priced and approved before they happen.' },
  { title: 'Long-Term Support', desc: 'A relationship that continues after handover, through warranty and beyond.' },
] as const;

// The heading and disclaimer for the project showcase — these are
// representative examples, never presented as the firm's complete body
// of work (see the stats note above for why).
export const projectsSectionTitle = 'Representative Projects';
export const projectsSectionNote =
  'The projects presented here represent a selection of completed work across different sectors and locations. Additional projects are available upon request.';

// Hand-curated for photographic strength, not just tier/order — see RC
// review notes: several Flagship-tier projects' own tagged hero/flagship
// images (e.g. Sultan Center's grocery-aisle interior, the Lawyer Office's
// hub-flagship crop) are not premium-editorial-worthy, so this list
// deliberately points at the strongest available frame per project,
// cross-checked visually against the whole asset folder.
export const featuredWork = [
  {
    slug: 'aurea-social-house-new-capital-egypt',
    title: 'AUREA Social House',
    sector: 'Hospitality',
    location: 'New Capital, Egypt',
    stat: '650 m²',
    image: '/homepage-assets/hero/05-aurea-social-house-exterior.png',
    orientation: 'landscape',
  },
  {
    slug: 'beit-al-watan-residential-new-cairo-egypt',
    title: 'Beit Al Watan',
    sector: 'Residential',
    location: 'New Cairo, Egypt',
    stat: 'Smart Residential Tower',
    image: '/homepage-assets/hero/06-beit-al-watan-facade-night.png',
    orientation: 'portrait',
  },
  {
    slug: 'khiran-chalet-kuwait',
    title: 'Khiran Chalet',
    sector: 'Residential',
    location: 'Khiran, Kuwait',
    stat: '2,700 m²',
    image: '/homepage-assets/hero/01-khiran-chalet-interior-detail.jpg',
    orientation: 'portrait',
  },
  {
    slug: 'aliaa-behbehani-lawyer-office-bneid-al-gar',
    title: 'Lawyer Aliaa Behbehani Offices',
    sector: 'Workplace',
    location: 'Bneid Al Gar, Kuwait',
    stat: '750 m²',
    image: '/ahw-projects-assets/03-lawyer-offices-bneid-al-gar/Orignal/lawyer-offices-bneid-al-gar-interior-detail-26-925j.jpg',
    orientation: 'landscape',
  },
  {
    slug: 'samsung-store-nasr-city-egypt',
    title: 'Samsung Store',
    sector: 'Retail',
    location: 'Nasr City, Egypt',
    stat: 'Flagship Retail Fit-Out',
    image: '/ahw-projects-assets/05-samsung-nasr-city/Orignal/samsung-nasr-city-exterior-facade-4cks.png',
    orientation: 'landscape',
  },
] as const;

export const coverImage = '/homepage-assets/hero/04-ahw-hero-background.jpg';
export const firmImage = '/ahw-projects-assets/06-ahw-hq-zahraa-al-maadi/build/ahw-hq-zahraa-al-maadi-exterior-facade-yjjb.jpg';
