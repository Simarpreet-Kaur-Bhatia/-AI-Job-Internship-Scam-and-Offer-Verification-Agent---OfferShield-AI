/**
 * AGENT 3 — Scam Pattern Detection Agent
 * Detects suspicious indicators and warning signs in job/internship offers.
 */

const PATTERN_RULES = [
  {
    id: 'upfront_payment',
    indicator: 'Upfront Payment Request',
    severity: 'critical',
    scoreContribution: 35,
    patterns: [
      /(?:pay|deposit|transfer|send)[^.]{0,60}(?:₹|rs\.?|inr|\$)[^.]{0,40}/gi,
      /(?:registration|security|training|processing|verification)\s+(?:fee|deposit|charge|amount|payment)/gi,
      /(?:fee|payment)\s+(?:of|:)?\s*(?:₹|rs\.?|inr|\$)\s*[\d,]+/gi,
      /(?:₹|rs\.?|inr|\$)\s*[\d,]+\s*(?:fee|charge|deposit|payment)/gi,
      /upfront\s+(?:fee|payment|deposit)/gi,
      /pay\s+(?:to\s+get|before\s+joining|to\s+confirm|to\s+receive|for\s+(?:offer|letter|kit))/gi,
    ],
    whyItMatters:
      'Legitimate employers do not ask candidates to pay fees before or during the hiring process. Payment requests before joining are a significant warning indicator that warrants independent verification.',
  },
  {
    id: 'urgency_pressure',
    indicator: 'Urgency and Pressure Language',
    severity: 'high',
    scoreContribution: 20,
    patterns: [
      /within\s+\d+\s+hours?/gi,
      /(?:respond|confirm|reply)\s+(?:immediately|asap|urgently|now)/gi,
      /(?:offer|position)\s+(?:expires?|valid only|for limited time)/gi,
      /last\s+chance/gi,
      /(?:urgent|immediate)\s+(?:response|confirmation|action|joining)/gi,
      /(?:act|confirm)\s+now/gi,
      /don'?t\s+(?:miss|delay|wait)/gi,
      /(?:deadline|expires?)\s+(?:today|tomorrow|soon)/gi,
    ],
    whyItMatters:
      'Creating artificial time pressure is a tactic to prevent candidates from independently verifying an offer. Legitimate recruitment processes allow reasonable time for candidate decision-making.',
  },
  {
    id: 'suspicious_email',
    indicator: 'Personal Email Domain for Official Communication',
    severity: 'high',
    scoreContribution: 20,
    patterns: [], // Handled separately via companyAnalysis
    whyItMatters:
      'Official recruitment communication from legitimate organizations typically uses corporate email addresses rather than free personal email providers.',
  },
  {
    id: 'sensitive_info_request',
    indicator: 'Unnecessary Sensitive Information Request',
    severity: 'high',
    scoreContribution: 25,
    patterns: [
      /(?:aadhar|aadhaar|pan\s+card|passport|bank\s+account|account\s+number|ifsc|credit\s+card|debit\s+card|cvv|pin\s+number)\s+(?:number|details|copy|scan)/gi,
      /send\s+(?:your\s+)?(?:id\s+proof|identity|aadhaar|pan|passport)/gi,
      /(?:otp|one[-\s]time\s+password)[^.]{0,30}(?:share|send|provide)/gi,
    ],
    whyItMatters:
      'Requests for unnecessary sensitive personal or financial information before employment verification can be a significant risk indicator.',
  },
  {
    id: 'unrealistic_offer',
    indicator: 'Potentially Unrealistic Offer Details',
    severity: 'medium',
    scoreContribution: 15,
    patterns: [
      /(?:₹|rs\.?|inr)\s*[\d,]*\s*(?:lakh|lac|l)\s*(?:per\s+month|pm|\/month)/gi,
      /(?:guaranteed|assured)\s+(?:job|placement|selection|income)/gi,
      /work\s+from\s+home.{0,30}(?:₹|rs\.?|inr)\s*[\d,]+/gi,
      /(?:no\s+experience|0\s+experience|freshers?)\s+.{0,30}(?:₹|rs\.?|inr)\s*[\d,]+/gi,
    ],
    whyItMatters:
      'Offers with unusually high compensation for minimal requirements or guaranteed outcomes should be independently verified.',
  },
  {
    id: 'suspicious_links',
    indicator: 'Suspicious or Unverified Links',
    severity: 'medium',
    scoreContribution: 15,
    patterns: [
      /(?:click here|visit now|apply here|confirm here)\s*(?:to|:)?\s*https?:\/\/[^\s]+/gi,
      /https?:\/\/(?:[a-z0-9-]+\.){2,}(?:xyz|tk|ml|ga|cf|gq|top|click|link|bit\.ly|tinyurl)/gi,
      /bit\.ly\/[a-zA-Z0-9]+/gi,
      /tinyurl\.com\/[a-zA-Z0-9]+/gi,
    ],
    whyItMatters:
      'Suspicious or shortened links in offer communications may direct to phishing sites or harmful content. Always verify URLs through official channels before clicking.',
  },
  {
    id: 'interview_bypass',
    indicator: 'Non-Standard or Bypassed Recruitment Process',
    severity: 'medium',
    scoreContribution: 15,
    patterns: [
      /(?:no\s+interview|without\s+interview|skip\s+interview|direct\s+selection)/gi,
      /(?:selected\s+based\s+on\s+(?:your\s+)?(?:resume|profile|application))\s+(?:only|alone|without)/gi,
      /(?:immediate|direct|instant)\s+(?:offer|joining|selection|placement)/gi,
      /(?:background\s+check|verification)\s+(?:fee|charge|deposit)/gi,
    ],
    whyItMatters:
      'Legitimate recruitment processes typically involve structured interviews or assessments. Bypassed processes or selection without proper evaluation may be a warning indicator.',
  },
  {
    id: 'vague_company',
    indicator: 'Vague or Unverifiable Company Information',
    severity: 'low',
    scoreContribution: 10,
    patterns: [
      /(?:our\s+company|the\s+company|a\s+leading\s+company|top\s+company)\s+(?:in\s+india|globally|worldwide)/gi,
      /(?:well-established|reputed|renowned)\s+(?:company|firm|organization)/gi,
    ],
    whyItMatters:
      'Vague organizational descriptions without verifiable details make independent verification difficult.',
  },
];

function detectPatternInText(text, patterns) {
  const found = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    found.push(...matches.map((m) => m.trim().slice(0, 200)));
  }
  return [...new Set(found)];
}

async function analyze(text, companyAnalysis, extractedEvidence) {
  const detectedIndicators = [];

  for (const rule of PATTERN_RULES) {
    if (rule.id === 'suspicious_email') {
      // Use company analysis results
      if (companyAnalysis && (companyAnalysis.isFreeEmail || companyAnalysis.isSuspiciousDomain)) {
        detectedIndicators.push({
          indicator: rule.indicator,
          severity: rule.severity,
          scoreContribution: rule.scoreContribution,
          evidence: companyAnalysis.emailDomain
            ? `Recruiter email uses domain: ${companyAnalysis.emailDomain}`
            : 'Personal email provider detected',
          whyItMatters: rule.whyItMatters,
        });
      }
      continue;
    }

    const evidenceMatches = detectPatternInText(text, rule.patterns);
    if (evidenceMatches.length > 0) {
      detectedIndicators.push({
        indicator: rule.indicator,
        severity: rule.severity,
        scoreContribution: rule.scoreContribution,
        evidence: evidenceMatches.slice(0, 3).join(' | '),
        whyItMatters: rule.whyItMatters,
      });
    }
  }

  // Also check extracted evidence for payment mentions
  if (extractedEvidence && extractedEvidence.paymentMentions && extractedEvidence.paymentMentions.length > 0) {
    const alreadyDetected = detectedIndicators.find((i) => i.indicator === 'Upfront Payment Request');
    if (!alreadyDetected) {
      detectedIndicators.push({
        indicator: 'Upfront Payment Request',
        severity: 'critical',
        scoreContribution: 35,
        evidence: extractedEvidence.paymentMentions[0],
        whyItMatters: PATTERN_RULES[0].whyItMatters,
      });
    }
  }

  return { riskIndicators: detectedIndicators };
}

module.exports = { analyze };
