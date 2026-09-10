const mongoose = require('mongoose');

const riskIndicatorSchema = new mongoose.Schema({
  indicator: String,
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  evidence: String,
  whyItMatters: String,
  scoreContribution: Number,
});

const verificationStepSchema = new mongoose.Schema({
  step: Number,
  title: String,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'warning', 'error'] },
  details: mongoose.Schema.Types.Mixed,
  completedAt: Date,
});

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    inputType: {
      type: String,
      enum: ['text', 'file', 'url', 'demo'],
      required: true,
    },
    inputData: {
      text: String,
      fileName: String,
      filePath: String,
      fileType: String,
      url: String,
      demoType: String,
    },
    offerSummary: {
      companyName: String,
      recruiterName: String,
      recruiterEmail: String,
      recruiterPhone: String,
      jobTitle: String,
      salary: String,
      location: String,
      joiningDate: String,
      source: String,
      urls: [String],
    },
    extractedEvidence: {
      rawText: String,
      paymentMentions: [String],
      urgencyPhrases: [String],
      contactInfo: mongoose.Schema.Types.Mixed,
      importantClauses: [String],
    },
    companyAnalysis: {
      status: String,
      identifiedDomain: String,
      emailDomain: String,
      domainMatch: Boolean,
      notes: [String],
    },
    riskIndicators: [riskIndicatorSchema],
    consistencyIssues: [
      {
        field: String,
        issue: String,
        severity: String,
      },
    ],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'needs_verification', 'high', 'very_high'],
      default: 'needs_verification',
    },
    riskLabel: {
      type: String,
      default: 'Needs Verification',
    },
    scoreBreakdown: [
      {
        indicator: String,
        contribution: Number,
      },
    ],
    recommendations: [
      {
        priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        icon: String,
        action: String,
        detail: String,
      },
    ],
    verificationTrail: [verificationStepSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingTime: Number,
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ userId: 1, createdAt: -1 });
verificationSchema.index({ sessionId: 1 });
verificationSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Verification', verificationSchema);
