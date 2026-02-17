const { Queue, Worker } = require('bullmq');

// NOTE: BullMQ requires a running Redis instance.
// Ensure you have Redis installed and running on localhost:6379 (default)
// or configure via environment variables.

const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    };

// 1. Create the Email Queue
const emailQueue = new Queue('email-queue', { connection });

// 2. Add Job to Queue (Producer)
const addEmailJob = async (data) => {
    // data = { to, subject, body, ... }
    return await emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    });
};

// 3. Process Jobs (Consumer)
// Ideally, run this in a separate worker process
const emailWorker = new Worker('email-queue', async (job) => {
    console.log(`Processing email job ${job.id} to ${job.data.to}`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real app: call await transporter.sendMail(...) here
    console.log(`Email sent to ${job.data.to}`);

}, { connection });

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = {
    emailQueue,
    addEmailJob
};
