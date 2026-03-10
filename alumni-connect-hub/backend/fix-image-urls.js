/**
 * One-time script to fix hardcoded localhost:5000 image URLs in the database.
 * Run once: node fix-image-urls.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI);

const SystemConfig = mongoose.model('SystemConfig', new mongoose.Schema({}, { strict: false }), 'systemconfigs');

const fix = (url) => {
    if (typeof url === 'string' && url.includes('localhost:5000/uploads')) {
        return url.replace(/https?:\/\/localhost:\d+\/uploads/, '/uploads');
    }
    return url;
};

const main = async () => {
    const configs = await SystemConfig.find({});
    console.log(`Found ${configs.length} config document(s)`);

    for (const config of configs) {
        let changed = false;
        const raw = config.toObject();

        // Fix QR code URL
        if (raw.donationSettings?.qrCodeUrl) {
            const fixed = fix(raw.donationSettings.qrCodeUrl);
            if (fixed !== raw.donationSettings.qrCodeUrl) {
                await SystemConfig.updateOne({ _id: raw._id }, {
                    $set: { 'donationSettings.qrCodeUrl': fixed }
                });
                console.log(`  ✅ Fixed qrCodeUrl: ${raw.donationSettings.qrCodeUrl} → ${fixed}`);
                changed = true;
            }
        }

        // Fix gallery images
        if (Array.isArray(raw.homepageSettings?.galleryImages)) {
            const fixedGallery = raw.homepageSettings.galleryImages.map(fix);
            const hasChanges = fixedGallery.some((u, i) => u !== raw.homepageSettings.galleryImages[i]);
            if (hasChanges) {
                await SystemConfig.updateOne({ _id: raw._id }, {
                    $set: { 'homepageSettings.galleryImages': fixedGallery }
                });
                console.log(`  ✅ Fixed ${fixedGallery.filter((u, i) => u !== raw.homepageSettings.galleryImages[i]).length} gallery image(s)`);
                changed = true;
            }
        }

        // Fix success story avatars
        if (Array.isArray(raw.homepageSettings?.successStories)) {
            const fixedStories = raw.homepageSettings.successStories.map(s => ({
                ...s,
                avatar: fix(s.avatar)
            }));
            const hasChanges = fixedStories.some((s, i) => s.avatar !== raw.homepageSettings.successStories[i]?.avatar);
            if (hasChanges) {
                await SystemConfig.updateOne({ _id: raw._id }, {
                    $set: { 'homepageSettings.successStories': fixedStories }
                });
                console.log(`  ✅ Fixed ${fixedStories.filter((s, i) => s.avatar !== raw.homepageSettings.successStories[i]?.avatar).length} story avatar(s)`);
                changed = true;
            }
        }

        if (!changed) {
            console.log('  ℹ️  No broken URLs found — nothing to fix');
        }
    }

    console.log('\n✅ Done! All image URLs have been patched to relative paths.');
    process.exit(0);
};

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
