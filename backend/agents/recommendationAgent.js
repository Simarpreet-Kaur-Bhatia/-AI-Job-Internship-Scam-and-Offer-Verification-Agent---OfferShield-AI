/**
 * AGENT 6 — Safety Recommendation Agent
 * Generates evidence-based, actionable recommendations.
 */

const BASE_RECOMMENDATIONS = [
  {
    id: 'preserve_offer',
    priority: 'medium',
    icon: '📁',
    action: 'Preserve original offer and communications',
    detail: 'Keep copies of all communications, offer letters, and related materials for reference.',
    condition: () => true,
  },
];

const CONDITIONAL_RECOMMENDATIONS = [
  {
    id: 'no_payment',
    priority: 'critical',
    icon: '🛑',
    action: 'Do not make any upfront payment',
    detail: 'Do not transfer funds, pay registration fees, or make deposits until the organization has been thoroughly and independently verified.',
    condition: (data) => data.indicators.some((i) =>
      i.indicator === 'Upfront Payment Request'
    ),
  },
  {
    id: 'verify_company',
    priority: 'high',
    icon: '🔎',
    action: 'Independently verify the organization',
    detail: 'Search for the organization using independent sources such as official government registries, LinkedIn, or established business directories.',
    condition: (data) => data.riskScore >= 30 || data.companyStatus === 'warning' || data.companyStatus === 'needs_verification',
  },
  {
    id: 'visit_official_website',
    priority: 'high',
    icon: '🌐',
    action: 'Visit the official website independently',
    detail: 'Do not use links provided in the offer. Find the official website through independent search and compare the recruiter contact information.',
    condition: (data) => data.riskScore >= 25 || data.indicators.some((i) => i.indicator === 'Suspicious or Unverified Links'),
  },
  {
    id: 'verify_contact',
    priority: 'high',
    icon: '📧',
    action: 'Contact the organization using independently obtained information',
    detail: 'Do not use the contact details provided in the offer. Find official contact information independently and reach out to confirm the offer.',
    condition: (data) => data.companyStatus === 'warning' || data.indicators.some((i) => i.indicator === 'Personal Email Domain for Official Communication'),
  },
  {
    id: 'no_sensitive_info',
    priority: 'high',
    icon: '🔐',
    action: 'Do not share sensitive personal information',
    detail: 'Do not provide Aadhaar, PAN, bank account details, OTPs, or other sensitive information to unverified recruiters.',
    condition: (data) => data.indicators.some((i) => i.indicator === 'Unnecessary Sensitive Information Request') || data.riskScore >= 50,
  },
  {
    id: 'check_links',
    priority: 'high',
    icon: '🔗',
    action: 'Do not click unverified links',
    detail: 'Avoid entering credentials or personal information through links provided in the offer until the organization is independently verified.',
    condition: (data) => data.indicators.some((i) => i.indicator === 'Suspicious or Unverified Links'),
  },
  {
    id: 'take_time',
    priority: 'medium',
    icon: '⏳',
    action: 'Take adequate time for verification',
    detail: 'Do not be rushed into accepting or acting on an offer. Legitimate organizations allow reasonable time for candidates to independently verify and make informed decisions.',
    condition: (data) => data.indicators.some((i) => i.indicator === 'Urgency and Pressure Language'),
  },
  {
    id: 'seek_guidance',
    priority: 'medium',
    icon: '👥',
    action: 'Seek guidance from trusted sources',
    detail: 'Consult with a trusted mentor, career counselor, or institutional placement cell before proceeding with an offer containing high-risk indicators.',
    condition: (data) => data.riskScore >= 60,
  },
  {
    id: 'report_suspicious',
    priority: 'medium',
    icon: '🚨',
    action: 'Consider reporting to appropriate authorities',
    detail: 'If you believe this offer may be fraudulent, consider reporting to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or your institution\'s placement cell.',
    condition: (data) => data.riskScore >= 80,
  },
  {
    id: 'check_recruitment_process',
    priority: 'medium',
    icon: '📋',
    action: 'Verify the recruitment process independently',
    detail: 'Confirm that the described recruitment process matches the organization\'s official stated procedures.',
    condition: (data) => data.indicators.some((i) => i.indicator === 'Non-Standard or Bypassed Recruitment Process'),
  },
];

async function analyze(riskScore, riskLevel, riskIndicators, companyAnalysis, consistencyIssues) {
  const data = {
    riskScore,
    riskLevel,
    indicators: riskIndicators,
    companyStatus: companyAnalysis ? companyAnalysis.status : 'needs_verification',
    hasConsistencyIssues: consistencyIssues && consistencyIssues.length > 0,
  };

  const recommendations = [];

  for (const rec of CONDITIONAL_RECOMMENDATIONS) {
    if (rec.condition(data)) {
      recommendations.push({
        priority: rec.priority,
        icon: rec.icon,
        action: rec.action,
        detail: rec.detail,
      });
    }
  }

  for (const rec of BASE_RECOMMENDATIONS) {
    if (rec.condition(data)) {
      recommendations.push({
        priority: rec.priority,
        icon: rec.icon,
        action: rec.action,
        detail: rec.detail,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return { recommendations };
}

module.exports = { analyze };
