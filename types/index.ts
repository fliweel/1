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
      'The user is a hardware or software vendor (OEM) who designs and manufactures AV/UC products or platforms. They want to understand how the overall market is performing and what each part of the channel — vendors, distributors, resellers, and end users — thinks about market growth, direction, and challenges. Surface cross-channel sentiment and highlight where perspectives diverge between channel groups.',
  },
  {
    id: 'distributor',
    name: 'Distributor',
    description: 'Buys from vendors, sells to resellers — adding value through credit, logistics and services (e.g. Ingram)',
    systemPromptHint:
      'The user is a distributor who aggregates products from vendors and sells to resellers. Their value lies in credit facilities, logistics, and added services. They want to understand what each part of the channel thinks about the market — whether it is growing, why, and where perspectives differ between vendors, distributors, resellers, and end users.',
  },
  {
    id: 'reseller',
    name: 'Reseller',
    description: 'Buys from vendors or distributors and sells to end users, typically including installation services',
    systemPromptHint:
      'The user is a reseller who buys products from vendors or distributors and sells to end users, typically bundling professional services such as installation and configuration. They want insights on solution demand, end user buying trends, and dynamics with vendors and distributors.',
  },
  {
    id: 'end_user',
    name: 'End User',
    description: 'Organisations buying and using AV/UC solutions — offices, corporate spaces, campuses',
    systemPromptHint:
      'The user is an end user organisation (e.g. a corporate office or campus) that buys and deploys AV/UC hardware and software. They want insights about product options, market direction, and what vendors and resellers are bringing to market.',
  },
  {
    id: 'consultant',
    name: 'Consultant',
    description: 'Designs solutions for large end users — does not sell or install',
    systemPromptHint:
      'The user is an independent consultant who designs AV/UC solutions for large end user organisations. They do not sell or install products. Their primary focus is understanding what end users are experiencing and requiring — prioritise end user sentiment, buying priorities, and technology challenges above all else.',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Views all channel data as a market intelligence consultancy',
    systemPromptHint:
      'The user is a market intelligence researcher or analyst. Present all data and insights across the full channel — vendor, distributor, reseller, and end user — with analytical rigour, as a market intelligence consultancy would. Highlight trends, divergences, and market signals across all channel segments.',
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
