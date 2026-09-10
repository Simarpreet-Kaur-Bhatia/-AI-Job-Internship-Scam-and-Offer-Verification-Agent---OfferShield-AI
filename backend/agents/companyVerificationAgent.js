/**
 * AGENT 2 — Company Verification Agent
 * Analyzes company information, email domains, and consistency signals.
 */

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com',
  'ymail.com', 'live.com', 'aol.com', 'icloud.com', 'protonmail.com',
  'mail.com', 'zoho.com', 'yandex.com', 'inbox.com', 'fastmail.com',
];

const SUSPICIOUS_DOMAIN_PATTERNS = [
  /career[s]?-\d+/i,
  /jobs?-\d+/i,
  /recruit-/i,
  /hr-/i,
  /\d{4,}/,
];

function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase().trim();
}

function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*(pvt\.?\s*ltd\.?|ltd\.?|inc\.?|llc|corp\.?|limited|private|solutions|technologies|services|systems|group|international|consulting|global)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function domainMatchesCompany(domain, companyName) {
  if (!domain || !companyName) return false;
  const normalCompany = normalizeCompanyName(companyName);
  const normalDomain = domain.replace(/\.(com|in|org|net|co\.in|io)$/i, '').replace(/[^a-z0-9]/g, '');
  if (normalDomain.length < 3 || normalCompany.length < 3) return false;
  // Check if domain contains major part of company name or vice versa
  if (normalDomain.includes(normalCompany.slice(0, 5))) return true;
  if (normalCompany.includes(normalDomain.slice(0, 5))) return true;
  return false;
}

function analyzeEmailDomain(email, companyName) {
  const domain = extractDomain(email);
  if (!domain) return { status: 'missing', notes: ['No recruiter email identified.'] };

  const isFreeEmail = FREE_EMAIL_DOMAINS.includes(domain);
  const isSuspiciousDomain = SUSPICIOUS_DOMAIN_PATTERNS.some((p) => p.test(domain));
  const matchesCompany = domainMatchesCompany(domain, companyName);

  const notes = [];
  let status = 'verified';

  if (isFreeEmail) {
    notes.push(`Recruiter email uses a free email provider (${domain}). Legitimate organizations typically use corporate email domains.`);
    status = 'warning';
  }

  if (isSuspiciousDomain) {
    notes.push(`Email domain (${domain}) contains patterns that may indicate an unofficial or suspicious domain.`);
    status = 'warning';
  }

  if (!isFreeEmail && !matchesCompany && companyName && companyName !== 'Not identified') {
    notes.push(`Recruiter email domain (${domain}) could not be independently matched to the identified company name.`);
    if (status !== 'warning') status = 'needs_verification';
  }

  if (!isFreeEmail && matchesCompany) {
    notes.push(`Recruiter email domain (${domain}) appears consistent with the identified company name.`);
  }

  return { domain, isFreeEmail, isSuspiciousDomain, matchesCompany, status, notes };
}

async function analyze(offerSummary, extractedEvidence) {
  const { companyName, recruiterEmail, urls } = offerSummary;
  const emailAnalysis = analyzeEmailDomain(recruiterEmail, companyName);
  const emailDomain = emailAnalysis.domain;

  // Try to identify official domain from URLs
  let identifiedDomain = null;
  if (urls && urls.length > 0) {
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const host = urlObj.hostname.replace(/^www\./, '');
        if (!FREE_EMAIL_DOMAINS.includes(host)) {
          identifiedDomain = host;
          break;
        }
      } catch (_) {}
    }
  }

  const notes = [...emailAnalysis.notes];
  const domainMatch = emailDomain && identifiedDomain
    ? emailDomain === identifiedDomain || emailDomain.includes(identifiedDomain) || identifiedDomain.includes(emailDomain)
    : null;

  if (identifiedDomain && emailDomain && !emailAnalysis.isFreeEmail) {
    if (domainMatch) {
      notes.push(`The recruiter email domain and the URL domain appear consistent.`);
    } else {
      notes.push(`Recruiter email domain (${emailDomain}) does not match the URL domain (${identifiedDomain}). Independent verification recommended.`);
    }
  }

  if (!companyName || companyName === 'Not identified') {
    notes.push('Company name could not be identified from the offer. This may warrant further investigation.');
  }

  let overallStatus = 'needs_verification';
  if (emailAnalysis.status === 'warning' || domainMatch === false) {
    overallStatus = 'warning';
  } else if (emailAnalysis.status === 'verified' && domainMatch !== false) {
    overallStatus = 'needs_verification';
  }

  return {
    companyAnalysis: {
      companyName: companyName || 'Not identified',
      status: overallStatus,
      identifiedDomain: identifiedDomain || 'Could not independently determine',
      emailDomain: emailDomain || 'No email identified',
      domainMatch: domainMatch,
      isFreeEmail: emailAnalysis.isFreeEmail,
      isSuspiciousDomain: emailAnalysis.isSuspiciousDomain,
      notes,
    },
  };
}

module.exports = { analyze };
