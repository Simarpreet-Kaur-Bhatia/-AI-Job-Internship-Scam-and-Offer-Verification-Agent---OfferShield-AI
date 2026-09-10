/**
 * Verification Orchestrator
 * Coordinates all agents in sequence to produce a complete verification report.
 */

const documentAnalysisAgent = require('../agents/documentAnalysisAgent');
const companyVerificationAgent = require('../agents/companyVerificationAgent');
const scamPatternAgent = require('../agents/scamPatternAgent');
const offerConsistencyAgent = require('../agents/offerConsistencyAgent');
const riskAssessmentAgent = require('../agents/riskAssessmentAgent');
const recommendationAgent = require('../agents/recommendationAgent');

const DEMO_OFFERS = {
  high_risk: {
    text: `Congratulations! You have been selected for the position of Software Developer Intern at NextGen Career Solutions.

Company: NextGen Career Solutions
Role: Software Developer Intern
Stipend: ₹25,000/month
Location: Remote (Work from Home)
Joining Date: Immediate

Dear Candidate,

We are pleased to inform you that after reviewing your profile, you have been selected for our prestigious Software Developer Internship program at NextGen Career Solutions.

To confirm your position, you MUST pay a ₹1,999 registration and verification fee within 24 hours of receiving this message. After payment confirmation, your official offer letter and onboarding kit will be issued to you.

Please transfer the amount immediately to the following details and share the payment screenshot for processing.

For any queries, contact us at:
Recruiter: Rahul Sharma
Email: career.nextgen@gmail.com
Phone: +91 9876543210
Website: www.nextgencareersolutions.example

This offer is valid for 24 hours only. Act now to secure your position!

Regards,
HR Team
NextGen Career Solutions`,
    demoType: 'high_risk',
    fileName: 'NextGen_Internship_Offer.txt',
  },
  needs_verification: {
    text: `InnovateTech Solutions — Remote Internship Offer

Dear Applicant,

We are offering you a Business Development Internship at InnovateTech Solutions.

Company: InnovateTech Solutions
Role: Business Development Intern
Stipend: ₹15,000/month (performance-based)
Location: Remote / New Delhi (flexible)
Duration: 3 months

You were shortlisted from our online application portal. No formal interview was conducted as your profile met our initial screening criteria.

Please complete your onboarding formalities within 5 business days.

Contact: hr@innovatetech-bd.in
Company Website: www.innovatetech.example

Note: Our company is a rapidly growing startup. Exact office address details will be shared after joining formalities.

Best regards,
Talent Acquisition
InnovateTech Solutions`,
    demoType: 'needs_verification',
    fileName: 'InnovateTech_Internship_Offer.txt',
  },
  low_risk: {
    text: `TechBridge India — Official Internship Offer Letter

Date: January 2025

Dear Candidate,

We are pleased to extend this formal offer for the position of Frontend Development Intern at TechBridge India Pvt. Ltd.

Company: TechBridge India Private Limited
Registration: CIN U72900KA2015PTC082341
Role: Frontend Development Intern
Duration: 6 months
Stipend: ₹12,000 per month
Location: Bangalore, Karnataka (Hybrid — 3 days office)
Start Date: February 1, 2025

Responsibilities:
- Assist the frontend engineering team with UI development
- Participate in code reviews and team standups
- Work on real projects under senior engineer mentorship

No fees or deposits are required at any stage of this internship.

For questions, contact our HR department:
Email: internships@techbridgeindia.com
Phone: +91 80 4567 8901
Official Website: www.techbridgeindia.com
LinkedIn: linkedin.com/company/techbridgeindia

Please respond to this offer within 7 business days.

Sincerely,
Priya Nair
Head of Talent Acquisition
TechBridge India Pvt. Ltd.`,
    demoType: 'low_risk',
    fileName: 'TechBridge_Internship_Offer.txt',
  },
};

function buildVerificationTrail(results) {
  const trail = [
    {
      step: 1,
      title: 'Offer Submitted',
      status: 'completed',
      details: { message: 'Offer content received and queued for analysis.' },
      completedAt: new Date(),
    },
    {
      step: 2,
      title: 'Information Extracted',
      status: 'completed',
      details: {
        companyName: results.offerSummary.companyName,
        jobTitle: results.offerSummary.jobTitle,
        recruiterEmail: results.offerSummary.recruiterEmail,
        salary: results.offerSummary.salary,
        paymentMentions: results.extractedEvidence.paymentMentions,
        urgencyPhrases: results.extractedEvidence.urgencyPhrases,
      },
      completedAt: new Date(),
    },
    {
      step: 3,
      title: 'Company Identified',
      status: results.companyAnalysis.status === 'warning' ? 'warning' : 'completed',
      details: {
        companyName: results.companyAnalysis.companyName,
        identifiedDomain: results.companyAnalysis.identifiedDomain,
        notes: results.companyAnalysis.notes,
      },
      completedAt: new Date(),
    },
    {
      step: 4,
      title: 'Contact Details Analyzed',
      status: results.companyAnalysis.isFreeEmail ? 'warning' : 'completed',
      details: {
        recruiterEmail: results.offerSummary.recruiterEmail,
        emailDomain: results.companyAnalysis.emailDomain,
        isFreeEmail: results.companyAnalysis.isFreeEmail,
        domainMatch: results.companyAnalysis.domainMatch,
        result: results.companyAnalysis.isFreeEmail
          ? 'Recruiter uses free email provider — needs further verification'
          : 'Contact details analyzed',
      },
      completedAt: new Date(),
    },
    {
      step: 5,
      title: 'Suspicious Patterns Checked',
      status: results.riskIndicators.length > 0 ? 'warning' : 'completed',
      details: {
        indicatorsFound: results.riskIndicators.length,
        indicators: results.riskIndicators.map((i) => ({ indicator: i.indicator, severity: i.severity })),
      },
      completedAt: new Date(),
    },
    {
      step: 6,
      title: 'Information Consistency Checked',
      status: results.consistencyIssues.length > 0 ? 'warning' : 'completed',
      details: {
        issuesFound: results.consistencyIssues.length,
        issues: results.consistencyIssues.map((i) => ({ field: i.field, severity: i.severity })),
      },
      completedAt: new Date(),
    },
    {
      step: 7,
      title: 'Risk Indicators Identified',
      status: results.riskScore >= 60 ? 'warning' : 'completed',
      details: {
        totalIndicators: results.riskIndicators.length + results.consistencyIssues.length,
        scoreBreakdown: results.scoreBreakdown,
      },
      completedAt: new Date(),
    },
    {
      step: 8,
      title: 'Risk Assessment Generated',
      status: 'completed',
      details: {
        riskScore: results.riskScore,
        riskLevel: results.riskLevel,
        riskLabel: results.riskLabel,
      },
      completedAt: new Date(),
    },
    {
      step: 9,
      title: 'Recommended Actions Generated',
      status: 'completed',
      details: {
        recommendationCount: results.recommendations.length,
        topRecommendations: results.recommendations.slice(0, 3).map((r) => r.action),
      },
      completedAt: new Date(),
    },
  ];
  return trail;
}

async function runVerification(inputData) {
  const startTime = Date.now();

  // Handle demo mode
  let processedInput = inputData;
  if (inputData.demoType && DEMO_OFFERS[inputData.demoType]) {
    const demoOffer = DEMO_OFFERS[inputData.demoType];
    processedInput = {
      text: demoOffer.text,
      fileName: demoOffer.fileName,
      demoType: demoOffer.demoType,
    };
  }

  // Step 1: Document Analysis
  const docAnalysis = await documentAnalysisAgent.analyze(processedInput);

  // Step 2: Company Verification
  const companyResult = await companyVerificationAgent.analyze(
    docAnalysis.offerSummary,
    docAnalysis.extractedEvidence
  );

  // Step 3: Scam Pattern Detection
  const scamResult = await scamPatternAgent.analyze(
    processedInput.text || '',
    companyResult.companyAnalysis,
    docAnalysis.extractedEvidence
  );

  // Step 4: Offer Consistency
  const consistencyResult = await offerConsistencyAgent.analyze(
    docAnalysis.offerSummary,
    companyResult.companyAnalysis,
    docAnalysis.extractedEvidence
  );

  // Step 5: Risk Assessment
  const riskResult = await riskAssessmentAgent.analyze(
    scamResult.riskIndicators,
    consistencyResult.consistencyIssues,
    companyResult.companyAnalysis,
    docAnalysis.extractedEvidence
  );

  // Step 6: Recommendations
  const recResult = await recommendationAgent.analyze(
    riskResult.riskScore,
    riskResult.riskLevel,
    scamResult.riskIndicators,
    companyResult.companyAnalysis,
    consistencyResult.consistencyIssues
  );

  // Assemble full results
  const results = {
    inputType: inputData.demoType ? 'demo' : (inputData.fileName ? 'file' : inputData.url ? 'url' : 'text'),
    offerSummary: docAnalysis.offerSummary,
    extractedEvidence: docAnalysis.extractedEvidence,
    companyAnalysis: companyResult.companyAnalysis,
    riskIndicators: scamResult.riskIndicators,
    consistencyIssues: consistencyResult.consistencyIssues,
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    riskLabel: riskResult.riskLabel,
    riskColor: riskResult.riskColor,
    scoreBreakdown: riskResult.scoreBreakdown,
    recommendations: recResult.recommendations,
    processingTime: Date.now() - startTime,
  };

  // Build verification trail
  results.verificationTrail = buildVerificationTrail(results);

  return results;
}

module.exports = { runVerification, DEMO_OFFERS };
