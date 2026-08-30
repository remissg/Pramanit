import { useEffect } from 'react';

export const useSEO = ({ title, description }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | Pramanit Enterprise`;
        }
        if (description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', description);
            }
        }
    }, [title, description]);
};

export default useSEO;
