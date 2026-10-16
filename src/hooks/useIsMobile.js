import { useState, useEffect } from 'react';

function useIsMobile(query = '(max-width: 768px)') {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = (event) => setIsMobile(event.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);

    return isMobile;
}

export default useIsMobile;
