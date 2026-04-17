const BatchReport = require('../models/BatchReport');
const { decrypt } = require('../utils/encryption');

// Get batch reports for a user
const getBatchReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reports = await BatchReport.find({ user: userId })
            .populate('design_id', 'name')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await BatchReport.countDocuments({ user: userId });

        // Decrypt emails for display
        const decryptedReports = reports.map(report => ({
            ...report.toObject(),
            successful_emails: report.successful_emails.map(item => ({
                ...item,
                email: decrypt(item.email)
            })),
            failed_emails: report.failed_emails.map(item => ({
                ...item,
                email: decrypt(item.email)
            }))
        }));

        res.json({
            reports: decryptedReports,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (error) {
        console.error('Get batch reports error:', error);
        res.status(500).json({ message: 'Failed to fetch batch reports' });
    }
};

// Get single batch report details
const getBatchReportDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const report = await BatchReport.findOne({ _id: id, user: userId })
            .populate('design_id', 'name');

        if (!report) {
            return res.status(404).json({ message: 'Batch report not found' });
        }

        // Decrypt emails for display
        const decryptedReport = {
            ...report.toObject(),
            successful_emails: report.successful_emails.map(item => ({
                ...item,
                email: decrypt(item.email)
            })),
            failed_emails: report.failed_emails.map(item => ({
                ...item,
                email: decrypt(item.email)
            }))
        };

        res.json(decryptedReport);
    } catch (error) {
        console.error('Get batch report details error:', error);
        res.status(500).json({ message: 'Failed to fetch batch report' });
    }
};

// Create/update batch report (called by worker)
const createBatchReport = async (userId, designId, totalRecipients, successfulEmails, failedEmails, status = 'completed') => {
    try {
        const report = await BatchReport.findOneAndUpdate(
            { 
                user: userId, 
                design_id: designId,
                status: 'processing'
            },
            {
                total_recipients: totalRecipients,
                successful_sends: successfulEmails.length,
                failed_sends: failedEmails.length,
                successful_emails: successfulEmails,
                failed_emails: failedEmails,
                status: status,
                completion_time: status === 'completed' ? new Date() : undefined
            },
            {
                new: true, // Create if doesn't exist
                upsert: true
            }
        );

        return report;
    } catch (error) {
        console.error('Create batch report error:', error);
        throw error;
    }
};

// Get batch statistics summary
const getBatchStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await BatchReport.aggregate([
            {
                $match: { user: userId }
            },
            {
                $group: {
                    _id: null,
                    totalBatches: { $sum: 1 },
                    totalRecipients: { $sum: '$total_recipients' },
                    totalSuccessful: { $sum: '$successful_sends' },
                    totalFailed: { $sum: '$failed_sends' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalBatches: 1,
                    totalRecipients: 1,
                    totalSuccessful: 1,
                    totalFailed: 1,
                    successRate: {
                        $cond: {
                            if: { $gt: ['$totalRecipients', 0] },
                            then: { $multiply: [{ $divide: ['$totalSuccessful', '$totalRecipients'] }, 100] },
                            else: 0
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalBatches: 0,
            totalRecipients: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            successRate: 0
        };

        res.json(result);
    } catch (error) {
        console.error('Get batch stats error:', error);
        res.status(500).json({ message: 'Failed to fetch batch statistics' });
    }
};

module.exports = {
    getBatchReports,
    getBatchReportDetails,
    createBatchReport,
    getBatchStats
};
