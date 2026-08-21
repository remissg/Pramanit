(function () {
    function initPramanitBadge() {
        const container = document.getElementById('pramanit-badge');
        if (!container) return;

        const serverUrl = window.PRAMANIT_URL || 'https://pramanit-six.vercel.app';

        container.innerHTML = `
            <a href="${serverUrl}" target="_blank" rel="noopener noreferrer" style="
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding: 10px 18px;
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                border: 1px solid rgba(139, 92, 246, 0.4);
                border-radius: 16px;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-decoration: none;
                box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: pointer;
            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <div style="
                    width: 36px;
                    height: 36px;
                    background: #7c3aed;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 900;
                    font-size: 18px;
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
                ">✓</div>
                <div style="text-align: left;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 13px; font-weight: 800; tracking: 0.5px; color: #ffffff;">Pramanit Verified Issuer</span>
                        <span style="width: 8px; height: 8px; background: #34d399; border-radius: 50%; display: inline-block;"></span>
                    </div>
                    <span style="font-size: 10px; color: #a78bfa; font-weight: 600;">Official Verifiable Authority</span>
                </div>
            </a>
        `;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPramanitBadge);
    } else {
        initPramanitBadge();
    }
})();
