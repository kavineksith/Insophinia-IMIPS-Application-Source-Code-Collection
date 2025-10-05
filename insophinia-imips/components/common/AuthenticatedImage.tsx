import React from 'react';

interface AuthenticatedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
}

const DEFAULT_IMAGE_SRC = '/images/default-image.png';

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, alt, className }) => {
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // If the provided src fails to load, this event fires.
        // We then set the source of the element that errored to the default image.
        e.currentTarget.src = DEFAULT_IMAGE_SRC;
    };

    // Use the provided src, but fallback to default if it's null, undefined, or an empty string.
    return <img src={src || DEFAULT_IMAGE_SRC} alt={alt} className={className} onError={handleError} />;
};

export default AuthenticatedImage;
