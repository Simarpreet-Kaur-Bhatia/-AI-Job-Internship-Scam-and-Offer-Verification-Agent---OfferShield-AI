/**
 * AGENT 1 — Document Analysis Agent
 * Extracts structured information from offer text, files, or URLs.
 */

const PATTERNS = {
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?[\d\s\-().]{7,15})/g,
  url: /(https?:\/\/[^\s"'<>()]+)/gi,
  salary: /(₹|Rs\.?|INR|USD|\$|€)[\s]?[\d,]+(?:\/(?:month|annum|year|pa|pm))?/gi,
  payment: /(?:registration|security|training|processing|verification|deposit|fee|advance|upfront)[^\n.]*(?:₹|Rs\.?|INR|USD|\$)?[\d,]*/gi,
  urgency: /(?:within\s+\d+\s+hours?|immediate(?:ly)?|urgent(?:ly)?|asap|respond\s+now|limited\s+time|deadline|expire[sd]?|last\s+chance|act\s+now|don'?t\s+delay|rush)/gi,
  joining: /(?:joining|start|commence|report)\s+(?:date|on|by)?[:\s]+([A-Za-z0-9,\s]+)/gi,
};

const COMPANY_KEYWORDS = [
  'company', 'organization', 'organisation', 'firm', 'corporation', 'enterprise',
  'solutions', 'technologies', 'services', 'systems', 'consulting', 'pvt', 'ltd',
  'inc', 'llc', 'group', 'global', 'international',
];

const JOB_TITLE_KEYWORDS = [
  'intern', 'internship', 'developer', 'engineer', 'analyst', 'manager', 'executive',
  'associate', 'assistant', 'officer', 'coordinator', 'specialist', 'consultant',
  'trainee', 'fresher', 'junior', 'senior', 'lead', 'head',
];

function extractEmails(text) {
  return [...new Set(text.match(PATTERNS.email) || [])];
}

function extractPhones(text) {
  const raw = text.match(PATTERNS.phone) || [];
  return [...new Set(raw.filter((p) => p.replace(/\D/g, '').length >= 7))];
}

function extractUrls(text) {
  return [...new Set(text.match(PATTERNS.url) || [])];
}

function extractSalary(text) {
  const matches = text.match(PATTERNS.salary) || [];
  return matches[0] || null;
}

function extractPaymentMentions(text) {
  return [...new Set(text.match(PATTERNS.payment) || [])];
}

function extractUrgencyPhrases(text) {
  return [...new Set(text.match(PATTERNS.urgency) || [])].map((p) => p.trim());
}

function extractCompanyName(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (COMPANY_KEYWORDS.some((kw) => lower.includes(kw)) && line.length < 80) {
      return line.replace(/^(company|from|organization|firm)[:\s]*/i, '').trim();
    }
  }
  // Fallback: look for capitalized multi-word phrases
  const cap = text.match(/[A-Z][a-z]+ (?:[A-Z][a-z]+ ){0,3}(?:Solutions|Technologies|Services|Systems|Consulting|Group|International|Pvt\.?\s*Ltd\.?|Inc\.?)/);
  return cap ? cap[0].trim() : null;
}

function extractJobTitle(text) {
  const lower = text.toLowerCase();
  for (const kw of JOB_TITLE_KEYWORDS) {
    const regex = new RegExp(`(?:position|role|designation|post|vacancy)[^\\n]*${kw}[^\\n]*`, 'i');
    const match = text.match(regex);
    if (match) return match[0].replace(/^(?:position|role|designation|post|vacancy)[:\s]*/i, '').trim().slice(0, 80);
  }
  for (const kw of JOB_TITLE_KEYWORDS) {
    if (lower.includes(kw)) {
      const idx = lower.indexOf(kw);
      return text.slice(Math.max(0, idx - 10), idx + 40).trim().slice(0, 80);
    }
  }
  return null;
}

function extractRecruiterName(text) {
  const patterns = [
    /(?:regards|sincerely|from|by|contact)[,:]?\s*\n?\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})/i,
    /(?:recruiter|hr|talent)[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractLocation(text) {
  const m = text.match(/(?:location|based in|office|city|place)[:\s]+([A-Za-z ,]+)/i);
  return m ? m[1].trim().slice(0, 60) : null;
}

function extractImportantClauses(text) {
  const clauses = [];
  const clausePatterns = [
    /(?:you must|you are required|mandatory|compulsory|do not|ensure that)[^.!?\n]{10,120}/gi,
    /(?:confidential|non-disclosure|nda|non-compete)[^.!?\n]{0,100}/gi,
    /(?:work from home|remote|hybrid|on-site|in-office)[^.!?\n]{0,60}/gi,
  ];
  for (const p of clausePatterns) {
    const matches = text.match(p) || [];
    clauses.push(...matches.map((c) => c.trim()));
  }
  return [...new Set(clauses)].slice(0, 8);
}

async function analyze(inputData) {
  const { text = '', fileName = '', url = '', demoType = '' } = inputData;
  const rawText = text || '';

  const emails = extractEmails(rawText);
  const phones = extractPhones(rawText);
  const urls = [...extractUrls(rawText), ...(url ? [url] : [])];
  const salary = extractSalary(rawText);
  const paymentMentions = extractPaymentMentions(rawText);
  const urgencyPhrases = extractUrgencyPhrases(rawText);
  const companyName = extractCompanyName(rawText);
  const jobTitle = extractJobTitle(rawText);
  const recruiterName = extractRecruiterName(rawText);
  const location = extractLocation(rawText);
  const importantClauses = extractImportantClauses(rawText);

  const recruiterEmail = emails.length > 0 ? emails[0] : null;

  return {
    offerSummary: {
      companyName: companyName || 'Not identified',
      recruiterName: recruiterName || 'Not identified',
      recruiterEmail: recruiterEmail || 'Not identified',
      recruiterPhone: phones.length > 0 ? phones[0] : 'Not identified',
      jobTitle: jobTitle || 'Not identified',
      salary: salary || 'Not specified',
      location: location || 'Not specified',
      joiningDate: null,
      source: demoType ? `Demo (${demoType})` : (fileName || url || 'Text input'),
      urls: urls.slice(0, 5),
    },
    extractedEvidence: {
      rawText: rawText.slice(0, 5000),
      paymentMentions,
      urgencyPhrases,
      contactInfo: { emails, phones, urls },
      importantClauses,
    },
    meta: {
      textLength: rawText.length,
      emailCount: emails.length,
      hasPaymentMention: paymentMentions.length > 0,
      hasUrgency: urgencyPhrases.length > 0,
      hasUrls: urls.length > 0,
    },
  };
}

module.exports = { analyze };
