export type Persona = {
  id: string
  name: string
  description: string
  systemPromptHint: string
}

export const PERSONAS: Persona[] = [
  {
    id: 'av_integrator',
    name: 'AV Integrator',
    description: 'Systems integrators who design and install AV solutions',
    systemPromptHint:
      'The user is an AV integrator focused on system design, installation practices, and technology selection for clients.',
  },
  {
    id: 'manufacturer',
    name: 'Manufacturer / Vendor',
    description: 'AV product manufacturers and technology vendors',
    systemPromptHint:
      'The user is an AV manufacturer or vendor interested in market positioning, competitor landscape, and channel strategy.',
  },
  {
    id: 'distributor',
    name: 'Distributor',
    description: 'AV product distributors and supply chain partners',
    systemPromptHint:
      'The user is a distributor focused on supply chain dynamics, product demand trends, and dealer relationships.',
  },
  {
    id: 'end_user',
    name: 'End User / IT Manager',
    description: 'Corporate IT managers and facilities teams deploying AV',
    systemPromptHint:
      'The user is an end user or IT manager evaluating and managing AV technology in their organization.',
  },
  {
    id: 'consultant',
    name: 'AV Consultant',
    description: 'Independent consultants advising on AV strategy and procurement',
    systemPromptHint:
      'The user is an AV consultant providing strategic advice to clients on technology selection and project planning.',
  },
  {
    id: 'managed_services',
    name: 'Managed Services Provider',
    description: 'MSPs offering ongoing AV support and management',
    systemPromptHint:
      'The user is a managed services provider focused on recurring service models, SLA trends, and customer retention in AV.',
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
