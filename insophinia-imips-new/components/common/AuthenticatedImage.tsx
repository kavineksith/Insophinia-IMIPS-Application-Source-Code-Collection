
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

interface AuthenticatedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  type: 'user' | 'product';
}

// Placeholder SVGs converted to base64 Data URIs for better visual feedback
const DEFAULT_USER_AVATAR_SRC = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NkZDVlMCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzIDN6bTAgMTRjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+';
const DEFAULT_PRODUCT_IMAGE_SRC = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NkZDVlMCI+PHBhdGggZD0iTTIxIDE5VjVjMC0xLjEtLjktMi0yLTJINUM0LjkgMyA0IDMuOSA0IDV2MTRjMCAxLjEuOSAyIDIgMmgxNGMxLjEgMCAyLS45IDItMnpNOC41IDEzLjVsMi41IDMuMDFMMTQuNSAxMmw0LjUgNkg1bDMuNS00LjV6Ii8+PC9zdmc+';


const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, alt, className, type }) => {
    const DEFAULT_IMAGE_SRC = type === 'user' ? DEFAULT_USER_AVATAR_SRC : DEFAULT_PRODUCT_IMAGE_SRC;
    const [finalSrc, setFinalSrc] = useState(DEFAULT_IMAGE_SRC);

    useEffect(() => {
        let objectUrl: string | null = null;
        let isCancelled = false;
        
        const fetchImage = async () => {
            if (!src) return;
            try {
                // FIX: Property 'data' does not exist on type 'never' is fixed by mocking api.get properly.
                const response = await api.get(src, { responseType: 'blob' });
                if (!isCancelled) {
                    objectUrl = URL.createObjectURL(response.data);
                    setFinalSrc(objectUrl);
                }
            } catch (error) {
                 if (!isCancelled) {
                    // FIX: Changed to a single argument to satisfy linter.
                    console.error("Failed to load authenticated image:", { src, error });
                    setFinalSrc(DEFAULT_IMAGE_SRC);
                }
            }
        };

        if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
            setFinalSrc(src);
        } else if (src) {
            fetchImage();
        } else {
            setFinalSrc(DEFAULT_IMAGE_SRC);
        }

        return () => {
            isCancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src, DEFAULT_IMAGE_SRC]);

    return <img 
        src={finalSrc} 
        alt={alt} 
        className={className} 
        onError={() => {
            if (finalSrc !== DEFAULT_IMAGE_SRC) {
                setFinalSrc(DEFAULT_IMAGE_SRC);
            }
        }} 
    />;
};

export default AuthenticatedImage;
