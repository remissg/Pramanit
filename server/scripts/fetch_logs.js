const axios = require('axios');

const API_KEY = 'rnd_eX8zgSvUsraI0wCnZNaSEjS5SK7R';
const BASE_URL = 'https://api.render.com/v1';

async function checkDeployStatus() {
    try {
        console.log('--- Checking Render Deployment Status ---');

        // 1. Get Services
        const { data: services } = await axios.get(`${BASE_URL}/services`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        const service = services.find(s =>
            s.service.name.toLowerCase().includes('pramanit') ||
            s.service.name.toLowerCase().includes('certiflow')
        );

        if (!service) {
            console.error('❌ Service "pramanit" or "certiflow" not found.');
            console.log('Available services:', services.map(s => s.service.name).join(', '));
            return;
        }

        console.log(`✅ Found Service: ${service.service.name} (${service.service.id})`);

        // 2. Get Latest Deploy
        const { data: deploys } = await axios.get(`${BASE_URL}/services/${service.service.id}/deploys?limit=1`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (deploys.length === 0) {
            console.log('⚠️ No deployments found for this service.');
            return;
        }

        const latest = deploys[0].deploy;
        console.log('\n--- LATEST DEPLOY ---');
        console.log(`ID:       ${latest.id}`);
        console.log(`Status:   ${latest.status.toUpperCase()}`); // live, build_failed, pre_deploy_failed, canceled
        console.log(`Message:  ${latest.commit ? latest.commit.message : 'N/A'}`);
        console.log(`Finished: ${latest.finishedAt}`);

        if (latest.status === 'live') {
            console.log('\n✅ The latest deployment is LIVE.');
            console.log('    If you still see errors, check runtime logs in the dashboard.');
        } else if (latest.status === 'build_failed' || latest.status === 'pre_deploy_failed') {
            console.log('\n❌ LATEST DEPLOYMENT FAILED.');
            console.log('    The code running on the server is likely OLD and does NOT include recent fixes.');
            console.log('    Check the "Events" or "Logs" tab in Render Dashboard for build errors.');
        } else {
            console.log(`\n⚠️ Deployment status is "${latest.status}". It might be in progress.`);
        }

    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) console.error('Details:', error.response.data);
    }
}

checkDeployStatus();
