import type { GovernanceReviewerRole } from '@/governance/GovernanceRoleSwitcher';

export const GOVERNANCE_PERSONAS: Record<
  GovernanceReviewerRole,
  { name: string; title: string; hint: string }
> = {
  all: {
    name: 'Governance oversight',
    title: 'All reviewer queues · NordPay AG',
    hint: 'See every pending sign-off, appeal, and external gate.',
  },
  dpo: {
    name: 'Katrin Müller',
    title: 'Data Protection Officer · NordPay AG',
    hint: 'Sign-off on privacy risk, appeals, and policy activation.',
  },
  procurement: {
    name: 'Procurement Lead',
    title: 'Vendor & DPA risk · NordPay AG',
    hint: 'Sign-off when vendor DPA or procurement gates apply.',
  },
  it: {
    name: 'IT Security',
    title: 'CISO · NordPay AG',
    hint: 'Sign-off on technical controls, logging, and gateway posture.',
  },
};
