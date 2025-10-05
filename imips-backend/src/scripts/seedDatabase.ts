import { initDB } from "../utils/db";

/**
 * Standalone database seeder script
 * Run with: npx ts-node src/scripts/seedDatabase.ts
 */
const runSeeder = async () => {
    try {
        console.log('🌱 Starting standalone database seeder...');

        // Initialize the database with seeding enabled
        console.log('📊 Initializing database...');
        const database = await initDB({ seedData: true });

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📋 Default Login Credentials:');
        console.log('   Admin  - Email: admin@imips.com, Password: admin123');
        console.log('   Manager - Email: manager@imips.com, Password: manager123');
        console.log('   Staff   - Email: staff@imips.com, Password: staff123');
        console.log('   Support - Email: support@imips.com, Password: support123');
        console.log('\n⚠️  Please change passwords after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        process.exit(1);
    }
};

// Run if this file is executed directly
if (require.main === module) {
    runSeeder();
}

export { runSeeder };