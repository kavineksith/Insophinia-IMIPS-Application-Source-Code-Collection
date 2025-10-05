import fs from 'fs';
import path from 'path';

/**
 * Creates simple SVG placeholder images
 */
const createDefaultImages = () => {
    const imagesDir = path.join(__dirname, '..', 'public', 'images');

    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Default user avatar
    const userAvatar = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#4f46e5"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="80" fill="white">👤</text>
    </svg>`;

    // Default product image
    const productImage = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#10b981"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="80" fill="white">📦</text>
    </svg>`;

    // Default inventory image
    const inventoryImage = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f59e0b"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="80" fill="white">📊</text>
    </svg>`;

    // Default general image
    const defaultImage = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#6b7280"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="80" fill="white">🖼️</text>
    </svg>`;

    try {
        fs.writeFileSync(path.join(imagesDir, 'default-avatar.svg'), userAvatar);
        fs.writeFileSync(path.join(imagesDir, 'default-product.svg'), productImage);
        fs.writeFileSync(path.join(imagesDir, 'default-inventory.svg'), inventoryImage);
        fs.writeFileSync(path.join(imagesDir, 'default-image.svg'), defaultImage);

        console.log('✅ Default placeholder images created successfully!');
    } catch (error) {
        console.error('❌ Failed to create default images:', error);
    }
};

// Run if this file is executed directly
if (require.main === module) {
    createDefaultImages();
}

export { createDefaultImages };