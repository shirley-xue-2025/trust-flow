import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GovernanceReviewerRole } from '@/governance/GovernanceRoleSwitcher';

const VALID: GovernanceReviewerRole[] = ['all', 'dpo', 'procurement', 'it'];

export function parseGovernanceRole(raw: string | null): GovernanceReviewerRole {
  if (raw && VALID.includes(raw as GovernanceReviewerRole)) {
    return raw as GovernanceReviewerRole;
  }
  return 'dpo';
}

export function governanceLink(
  path: string,
  role: GovernanceReviewerRole,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams({ role, ...extra });
  return `${path}?${params.toString()}`;
}

export function useGovernanceRole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = parseGovernanceRole(searchParams.get('role'));

  useEffect(() => {
    if (!searchParams.get('role')) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('role', 'dpo');
          return p;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  function setRole(next: GovernanceReviewerRole) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('role', next);
        return p;
      },
      { replace: true },
    );
  }

  return { role, setRole };
}
