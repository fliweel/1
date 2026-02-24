export type Persona = {
  id: string
  name: string
  description: string
  systemPromptHint: string
}

export const PERSONAS: Persona[] = [
  {
    id: 'vendor',
    name: 'Vendor',
    description: 'OEM designing and making AV/UC hardware or software platforms (e.g. Cisco, Microsoft Teams)',
    systemPromptHint:
      'The user is a hardware or software vendor (OEM) who designs and manufactures AV/UC products or platforms (e.g. Cisco for hardware, Microsoft Teams for software). They want to understand how the overall market is performing and what each part of the channel — vendors, distributors, resellers, and end users — thinks about market growth, direction, and challenges. Surface cross-channel sentiment and highlight where perspectives diverge. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What market trends are influencing your product roadmap?" and "How do you anticipate customer needs evolving in the next 12 months?"; Adoption & Deployment Challenges — "What barriers do you face in driving adoption of your solutions?"; Pricing & Commercial Models — "How do you structure pricing to remain competitive?"; Support & Services — "What investments are you making in partner and customer support?"; Technology & Innovation — "What innovations are you prioritising in your roadmap?"; Sustainability & Compliance — "How do you integrate sustainability into product design?"; Channel Relationships & Influence — "How do you strengthen relationships with distributors and resellers?"',
  },
  {
    id: 'distributor',
    name: 'Distributor',
    description: 'Buys from vendors, sells to resellers — adding value through credit, logistics and services (e.g. Ingram)',
    systemPromptHint:
      'The user is a distributor (e.g. Ingram) who buys from OEMs and sells to resellers, adding value through credit limits, logistics, and services. They want to understand what each part of the channel thinks about the market — whether it is growing, why, and where perspectives differ between vendors, distributors, resellers, and end users. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What trends are shaping your inventory and distribution strategy?" and "How do you see demand shifting across product categories?"; Adoption & Deployment Challenges — "What challenges do you encounter in ensuring product availability for partners?"; Pricing & Commercial Models — "How do margin structures affect your ability to support partners?"; Support & Services — "How do you support resellers with logistics and training?"; Technology & Innovation — "How do you manage new technology introductions in your supply chain?"; Sustainability & Compliance — "What role does sustainability play in your logistics strategy?"; Channel Relationships & Influence — "What factors influence your choice of vendor partnerships?"',
  },
  {
    id: 'reseller',
    name: 'Reseller',
    description: 'Buys from vendors or distributors and sells to end users, typically including installation services',
    systemPromptHint:
      'The user is a reseller who buys products from vendors or distributors and sells to end users, typically bundling professional services such as installation and configuration. They want insights on solution demand, end user buying trends, and dynamics with vendors and distributors. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What trends are impacting your customers\' buying decisions?" and "How do you adapt your portfolio to meet changing market needs?"; Adoption & Deployment Challenges — "What obstacles do you face when convincing customers to adopt new solutions?"; Pricing & Commercial Models — "What pricing models work best for your customers?"; Support & Services — "What support do you need from vendors and distributors to succeed?"; Technology & Innovation — "How do you evaluate new technologies before offering them to customers?"; Sustainability & Compliance — "How do sustainability requirements influence your portfolio choices?"; Channel Relationships & Influence — "How do vendor programmes impact your sales strategy?"',
  },
  {
    id: 'end_user',
    name: 'End User',
    description: 'Organisations buying and using AV/UC solutions — offices, corporate spaces, campuses',
    systemPromptHint:
      'The user is an end user organisation (e.g. a corporate office or campus) that buys and deploys AV/UC hardware and software. They want insights about product options, market direction, and what vendors and resellers are bringing to market. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What trends are influencing your technology investment decisions?" and "How do you see collaboration technology evolving in your organisation?"; Adoption & Deployment Challenges — "What internal challenges slow down technology adoption in your organisation?"; Pricing & Commercial Models — "How do pricing models influence your purchasing decisions?"; Support & Services — "What level of support do you expect from your technology providers?"; Technology & Innovation — "What features or innovations matter most to your organisation?"; Sustainability & Compliance — "How important is sustainability in your technology procurement decisions?"; Channel Relationships & Influence — "How do channel relationships affect your buying experience?"',
  },
  {
    id: 'consultant',
    name: 'Consultant',
    description: 'Designs solutions for large end users — does not sell or install',
    systemPromptHint:
      'The user is an independent consultant who designs AV/UC solutions for large end user organisations. They do not sell or install products. Their primary focus is understanding what end users are experiencing and requiring — prioritise end user sentiment, buying priorities, and technology challenges above all else. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What emerging trends are you advising clients to prepare for?" and "Which technologies do you believe will dominate the collaboration space?"; Adoption & Deployment Challenges — "What common adoption challenges do you see across your client base?"; Pricing & Commercial Models — "What pricing strategies do you recommend to clients for long-term value?"; Support & Services — "How important is vendor support in your recommendations?"; Technology & Innovation — "Which innovations do you believe will deliver the greatest ROI for clients?"; Sustainability & Compliance — "How do you advise clients on sustainability and compliance in technology selection?"; Channel Relationships & Influence — "How do channel dynamics influence your recommendations to clients?"',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Views all channel data as a market intelligence consultancy',
    systemPromptHint:
      'The user is a market intelligence researcher or analyst. Present all data and insights across the full channel — vendor, distributor, reseller, and end user — with analytical rigour, as a market intelligence consultancy would. Highlight trends, divergences, and market signals across all channel segments. Typical focus areas and questions for this persona: Market Trends & Future Outlook — "What market trends are developing in products and technology?" and "How do you anticipate channel needs evolving in the next 12 months?"; Adoption & Deployment Challenges — "What common adoption challenges do you see across all respondents?"; Pricing & Commercial Models — "What commercial strategies are being developed for long-term value?"; Support & Services — "What are the market developments in support and services?"; Technology & Innovation — "What innovations are influencing channel strategies?"; Sustainability & Compliance — "How do sustainability and compliance requirements influence channel decisions?"; Channel Relationships & Influence — "How are channel dynamics influencing channel partnership decisions?"',
  },
]

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  persona_id: string
  title: string
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  persona_id: string | null
  is_admin: boolean
  created_at: string
}
