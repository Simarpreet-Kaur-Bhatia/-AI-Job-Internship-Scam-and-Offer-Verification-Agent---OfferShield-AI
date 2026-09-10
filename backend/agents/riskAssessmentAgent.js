/**
 * AGENT 5 — Risk Assessment Agent
 * Calculates a transparent, explainable risk score from 0-100.
 */

const RISK_LEVELS = [
  { min: 0,  max: 29,  level: 'low',               label: 'Low Risk',          color: '#16a34a' },
  { min: 30, max: 59,  level: 'needs_verification', label: 'Needs Verification', color: '#d97706' },
  { min: 60, max: 79,  level: 'high',               label: 'High Risk',          color: '#ea580c' },
  { min: 80, max: 100, level: 'very_high',           label: 'Very High Risk',     color: '#dc2626' },
];

// Consistency issue weights
const CONSISTENCY_SEVERITY_SCORES = {
  high: 12,
  medium: 8,
  low: 4,
};

// Company analysis weights
const COMPANY_STATUS_SCORES = {
  warning: 15,
  needs_verification: 5,
  verified: 0,
};

function getRiskLevel(score) {
  return RISK_LEVELS.find((r) => score >= r.min && score <= r.max) || RISK_LEVELS[1];
}

async function analyze(riskIndicators, consistencyIssues, companyAnalysis, extractedEvidence) {
  const scoreBreakdown = [];
  let totalScore = 0;

  // 1. Score from risk indicators (deduplicated, capped per severity)
  const severityCaps = { critical: 35, high: 25, medium: 15, low: 10 };
  for (const indicator of riskIndicators) {
    const contribution = Math.min(indicator.scoreContribution, severityCaps[indicator.severity] || 10);
    scoreBreakdown.push({ indicator: indicator.indicator, contribution });
    totalScore += contribution;
  }

  // 2. Score from consistency issues
  for (const issue of consistencyIssues) {
    const contribution = CONSISTENCY_SEVERITY_SCORES[issue.severity] || 5;
    scoreBreakdown.push({ indicator: `Consistency: ${issue.field}`, contribution });
    totalScore += contribution;
  }

  // 3. Score from company analysis
  if (companyAnalysis) {
    const companyContrib = COMPANY_STATUS_SCORES[companyAnalysis.status] || 0;
    if (companyContrib > 0) {
      scoreBreakdown.push({ indicator: 'Company/Domain Verification Concerns', contribution: companyContrib });
      totalScore += companyContrib;
    }
  }

  // 4. Bonus for missing critical information
  if (extractedEvidence && (!extractedEvidence.contactInfo || !extractedEvidence.contactInfo.emails || extractedEvidence.contactInfo.emails.length === 0)) {
    scoreBreakdown.push({ indicator: 'No verifiable contact information', contribution: 8 });
    totalScore += 8;
  }

  // Cap at 100
  const finalScore = Math.min(100, Math.round(totalScore));
  const riskLevelData = getRiskLevel(finalScore);

  return {
    riskScore: finalScore,
    riskLevel: riskLevelData.level,
    riskLabel: riskLevelData.label,
    riskColor: riskLevelData.color,
    scoreBreakdown: scoreBreakdown.sort((a, b) => b.contribution - a.contribution),
  };
}

module.exports = { analyze, getRiskLevel };
