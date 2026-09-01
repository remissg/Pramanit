const ScheduledBatch = require('../models/ScheduledBatch');
const User = require('../models/User');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const IssuanceHistory = require('../models/IssuanceHistory');

let isSchedulerRunning = false;

const processDueBatches = async () => {
    if (isSchedulerRunning) return;
    isSchedulerRunning = true;

    try {
        const now = new Date();
        const dueBatches = await ScheduledBatch.find({
            status: 'scheduled',
            scheduled_for: { $lte: now }
        }).limit(5);

        for (const batch of dueBatches) {
            console.log(`[BatchScheduler] Executing due scheduled batch: ${batch._id} for user ${batch.user}`);
            
            // Mark as processing
            batch.status = 'processing';
            await batch.save();

            try {
                const user = await User.findById(batch.user);
                if (!user) {
                    batch.status = 'failed';
                    batch.error_log = 'User account not found';
                    await batch.save();
                    continue;
                }

                // Determine throttle delay based on pace
                let throttleDelayMs = 2500; // default safe pace
                if (batch.dispatch_pace === 'fast') throttleDelayMs = 1000;
                if (batch.dispatch_pace === 'drip') throttleDelayMs = 5000;

                const workerPath = path.join(__dirname, '../workers/certificate.worker.optimized.js');
                const worker = new Worker(workerPath, {
                    workerData: {
                        recipients: batch.recipients_data,
                        designConfig: {
                            ...batch.design_config,
                            subject: batch.email_config?.subject || 'Your Certificate',
                            emailBody: batch.email_config?.body || '',
                            designId: batch.design_id,
                            throttleDelayMs
                        },
                        branding: user.toObject(),
                        mongoUri: process.env.MONGODB_URI
                    }
                });

                worker.on('message', async (message) => {
                    if (message.type === 'progress') {
                        await ScheduledBatch.findByIdAndUpdate(batch._id, {
                            processed_count: message.current
                        });
                    } else if (message.type === 'done') {
                        console.log(`[BatchScheduler] Completed scheduled batch ${batch._id}`);
                        const successEmails = message.results.success;

                        await ScheduledBatch.findByIdAndUpdate(batch._id, {
                            status: 'completed',
                            processed_count: successEmails.length,
                            completed_at: new Date()
                        });

                        // Log Issuance History
                        if (successEmails.length > 0) {
                            try {
                                await IssuanceHistory.create({
                                    user: batch.user,
                                    design_id: batch.design_id,
                                    design_name: batch.design_name,
                                    total_certificates: successEmails.length,
                                    recipient_emails: successEmails
                                });
                            } catch (hErr) {
                                console.error('[BatchScheduler] Failed to log IssuanceHistory:', hErr.message);
                            }
                        }
                    }
                });

                worker.on('error', async (err) => {
                    console.error(`[BatchScheduler] Worker error for batch ${batch._id}:`, err);
                    await ScheduledBatch.findByIdAndUpdate(batch._id, {
                        status: 'failed',
                        error_log: err.message
                    });
                });

            } catch (batchErr) {
                console.error(`[BatchScheduler] Error processing batch ${batch._id}:`, batchErr);
                batch.status = 'failed';
                batch.error_log = batchErr.message;
                await batch.save();
            }
        }
    } catch (err) {
        console.error('[BatchScheduler] Loop error:', err);
    } finally {
        isSchedulerRunning = false;
    }
};

const initBatchScheduler = () => {
    console.log('⏰ [BatchScheduler] Initializing Anti-Spam Batch Scheduler (60s Interval)');
    // Run immediately once on startup
    processDueBatches();
    // Run interval every 60 seconds
    setInterval(processDueBatches, 60 * 1000);
};

module.exports = {
    initBatchScheduler,
    processDueBatches
};
