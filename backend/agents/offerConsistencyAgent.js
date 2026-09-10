/**
 * AGENT 4 — Offer Consistency Agent
 * Checks internal consistency of the offer information.
 */

function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase().trim();
}

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function similarityScore(a, b) {
  if (!a || !b) return 0;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  if (intersection.length === 0) return 0;
  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

async function analyze(offerSummary, companyAnalysis, extractedEvidence) {
  const issues = [];

  const { companyName, recruiterEmail, jobTitle, salary, location, urls } = offerSummary;
  const emailDomain = extractDomain(recruiterEmail);

  // 1. Email domain vs company name consistency
  if (emailDomain && companyName && companyName !== 'Not identified') {
    const domainCore = emailDomain.replace(/\.(com|in|org|net|co\.in|io)$/i, '');
    const simScore = similarityScore(domainCore, companyName);
    if (simScore < 0.3 && companyAnalysis && !companyAnalysis.isFreeEmail) {
      issues.push({
        field: 'Email Domain vs Company Name',
        issue: `The recruiter email domain (${emailDomain}) does not appear to closely match the identified company name (${companyName}). Independent verification recommended.`,
        severity: 'medium',
      });
    }
  }

  // 2. Multiple email addresses with different domains
  if (extractedEvidence && extractedEvidence.contactInfo && extractedEvidence.contactInfo.emails) {
    const emails = extractedEvidence.contactInfo.emails;
    if (emails.length > 1) {
      const domains = [...new Set(emails.map(extractDomain).filter(Boolean))];
      if (domains.length > 1) {
        issues.push({
          field: 'Multiple Email Domains',
          issue: `Multiple email addresses with different domains were found (${domains.join(', ')}). Inconsistent contact information may warrant further investigation.`,
          severity: 'medium',
        });
      }
    }
  }

  // 3. URL vs email domain mismatch
  if (urls && urls.length > 0 && emailDomain) {
    let urlDomain = null;
    for (const url of urls) {
      try {
        urlDomain = new URL(url).hostname.replace(/^www\./, '');
        break;
      } catch (_) {}
    }
    if (urlDomain && emailDomain !== urlDomain && !urlDomain.includes(emailDomain) && !emailDomain.includes(urlDomain)) {
      const FREE_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      if (!FREE_DOMAINS.includes(emailDomain)) {
        issues.push({
          field: 'URL Domain vs Email Domain',
          issue: `The URL domain (${urlDomain}) does not match the recruiter email domain (${emailDomain}). This inconsistency warrants further verification.`,
          severity: 'medium',
        });
      }
    }
  }

  // 4. Salary/stipend mentions payment in same context
  if (extractedEvidence && extractedEvidence.paymentMentions && extractedEvidence.paymentMentions.length > 0 && salary) {
    issues.push({
      field: 'Compensation vs Payment Request',
      issue: `The offer mentions a salary/stipend (${salary}) alongside payment requests. This combination is unusual and should be independently verified.`,
      severity: 'high',
    });
  }

  // 5. Missing core information
  const missingFields = [];
  if (!companyName || companyName === 'Not identified') missingFields.push('company name');
  if (!jobTitle || jobTitle === 'Not identified') missingFields.push('job title');
  if (recruiterEmail === 'Not identified' || !recruiterEmail) missingFields.push('recruiter contact');

  if (missingFields.length >= 2) {
    issues.push({
      field: 'Incomplete Offer Information',
      issue: `Key offer details could not be identified: ${missingFields.join(', ')}. Incomplete information makes verification difficult.`,
      severity: 'low',
    });
  }

  return { consistencyIssues: issues };
}

module.exports = { analyze };
