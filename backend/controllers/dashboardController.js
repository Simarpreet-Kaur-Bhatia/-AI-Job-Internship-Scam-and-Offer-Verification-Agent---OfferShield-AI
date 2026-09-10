const Verification = require('../models/Verification');

// In-memory store reference from verificationController
// We import a shared module to avoid circular deps
const { getSessionStore } = require('../services/sessionStore');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;

    let all = [];
    // Try DB
    try {
      const query = userId ? { userId } : sessionId ? { sessionId } : null;
      if (query) {
        all = await Verification.find(query).select('riskScore riskLevel riskLabel createdAt offerSummary inputType');
      }
    } catch (_) {}

    // Try in-memory store
    if (all.length === 0) {
      const store = getSessionStore();
      for (const [id, v] of store.entries()) {
        if ((userId && String(v.userId) === String(userId)) || (sessionId && v.sessionId === sessionId)) {
          all.push({ ...v, _id: id });
        }
      }
    }

    const stats = {
      total: all.length,
      low: all.filter((v) => v.riskLevel === 'low').length,
      needs_verification: all.filter((v) => v.riskLevel === 'needs_verification').length,
      high: all.filter((v) => v.riskLevel === 'high').length,
      very_high: all.filter((v) => v.riskLevel === 'very_high').length,
    };

    const recent = [...all]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((v) => ({
        id: v._id,
        company: v.offerSummary ? v.offerSummary.companyName : 'Unknown',
        role: v.offerSummary ? v.offerSummary.jobTitle : 'Unknown',
        riskScore: v.riskScore,
        riskLevel: v.riskLevel,
        riskLabel: v.riskLabel,
        inputType: v.inputType,
        date: v.createdAt,
      }));

    res.json({ success: true, stats, recent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load dashboard stats.' });
  }
};

module.exports = { getDashboardStats };
