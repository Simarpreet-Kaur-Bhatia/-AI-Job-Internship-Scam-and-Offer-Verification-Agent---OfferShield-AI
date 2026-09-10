const Verification = require('../models/Verification');
const { runVerification } = require('../services/verificationOrchestrator');
const { sessionStore } = require('../services/sessionStore');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function storeVerification(result, userId, sessionId) {
  const id = uuidv4();
  sessionStore.set(id, { ...result, _id: id, userId, sessionId, createdAt: new Date() });
  return id;
}

async function saveToDb(result, userId, sessionId) {
  try {
    const doc = new Verification({
      userId: userId || null,
      sessionId: sessionId || null,
      inputType: result.inputType,
      inputData: result.inputData || {},
      offerSummary: result.offerSummary,
      extractedEvidence: result.extractedEvidence,
      companyAnalysis: result.companyAnalysis,
      riskIndicators: result.riskIndicators,
      consistencyIssues: result.consistencyIssues,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      riskLabel: result.riskLabel,
      scoreBreakdown: result.scoreBreakdown,
      recommendations: result.recommendations,
      verificationTrail: result.verificationTrail,
      processingTime: result.processingTime,
      status: 'completed',
    });
    await doc.save();
    return doc._id.toString();
  } catch (_) {
    return null;
  }
}

// POST /api/verify/text
const verifyText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Please provide offer text (minimum 20 characters).' });
    }
    const result = await runVerification({ text: text.trim() });
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;
    const dbId = await saveToDb({ ...result, inputData: { text: text.slice(0, 500) } }, userId, sessionId);
    const memId = storeVerification(result, userId, sessionId);
    const id = dbId || memId;

    res.json({ success: true, verificationId: id, result });
  } catch (error) {
    console.error('verifyText error:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

// POST /api/verify/upload
const verifyUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    // For prototype: read file as text if it's a text-based type
    let text = `[File uploaded: ${fileName}]\n`;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      text = content;
    } catch (_) {
      text = `[Binary file: ${fileName}. File type: ${fileType}]\nFile name suggests this is a job/internship offer document.`;
    }

    const result = await runVerification({ text, fileName, filePath, fileType });
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;
    const dbId = await saveToDb({ ...result, inputData: { fileName, fileType } }, userId, sessionId);
    const memId = storeVerification(result, userId, sessionId);
    const id = dbId || memId;

    res.json({ success: true, verificationId: id, result });
  } catch (error) {
    console.error('verifyUpload error:', error);
    res.status(500).json({ success: false, message: 'File verification failed. Please try again.' });
  }
};

// POST /api/verify/url
const verifyUrl = async (req, res) => {
  try {
    const { url, text } = req.body;
    if (!url && (!text || text.trim().length < 5)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid URL or offer context.' });
    }
    const combinedText = [url ? `Job/Internship URL submitted: ${url}` : '', text || ''].filter(Boolean).join('\n\n');
    const result = await runVerification({ text: combinedText, url: (url || '').trim() });
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;
    const dbId = await saveToDb({ ...result, inputData: { url } }, userId, sessionId);
    const memId = storeVerification(result, userId, sessionId);
    const id = dbId || memId;

    res.json({ success: true, verificationId: id, result });
  } catch (error) {
    console.error('verifyUrl error:', error);
    res.status(500).json({ success: false, message: 'URL verification failed. Please try again.' });
  }
};

// POST /api/verify/demo
const verifyDemo = async (req, res) => {
  try {
    const { demoType } = req.body;
    const validTypes = ['high_risk', 'needs_verification', 'low_risk'];
    if (!validTypes.includes(demoType)) {
      return res.status(400).json({ success: false, message: 'Invalid demo type. Choose: high_risk, needs_verification, or low_risk.' });
    }
    const result = await runVerification({ demoType });
    const sessionId = req.headers['x-session-id'] || null;
    const dbId = await saveToDb({ ...result, inputData: { demoType } }, null, sessionId);
    const memId = storeVerification(result, null, sessionId);
    const id = dbId || memId;

    res.json({ success: true, verificationId: id, result });
  } catch (error) {
    console.error('verifyDemo error:', error);
    res.status(500).json({ success: false, message: 'Demo verification failed.' });
  }
};

// GET /api/verifications
const getVerifications = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;
    let verifications = [];

    // Try DB first
    try {
      const query = userId ? { userId } : { sessionId };
      verifications = await Verification.find(query)
        .select('offerSummary riskScore riskLevel riskLabel createdAt inputType status')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (_) {}

    // Fallback to memory store
    if (verifications.length === 0) {
      verifications = [];
      for (const [id, v] of sessionStore.entries()) {
        if ((userId && v.userId === userId) || (sessionId && v.sessionId === sessionId)) {
          verifications.push({
            _id: id,
            offerSummary: v.offerSummary,
            riskScore: v.riskScore,
            riskLevel: v.riskLevel,
            riskLabel: v.riskLabel,
            createdAt: v.createdAt,
            inputType: v.inputType,
            status: 'completed',
          });
        }
      }
      verifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, verifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not retrieve verifications.' });
  }
};

// GET /api/verifications/:id
const getVerification = async (req, res) => {
  try {
    const { id } = req.params;
    let verification = null;

    // Try DB
    try {
      verification = await Verification.findById(id);
    } catch (_) {}

    // Try memory
    if (!verification) {
      verification = sessionStore.get(id);
    }

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found.' });
    }

    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not retrieve verification.' });
  }
};

// DELETE /api/verifications/:id
const deleteVerification = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Verification.findByIdAndDelete(id);
    } catch (_) {}
    sessionStore.delete(id);
    res.json({ success: true, message: 'Verification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not delete verification.' });
  }
};

module.exports = { verifyText, verifyUpload, verifyUrl, verifyDemo, getVerifications, getVerification, deleteVerification };
