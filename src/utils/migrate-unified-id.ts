// utils/migrate-unified-ids.ts
import { firestore } from '@/lib/firebase';
import { UnifiedIDSystem } from '@/lib/id-system';

export async function migrateToUnifiedIDSystem() {
  try {
    console.log('🔄 Starting migration to unified ID system...');
    
    const allModels = await firestore.query('aiModels');
    console.log(`📋 Found ${allModels.length} models to migrate`);
    
    let migratedCount = 0;
    
    for (const model of allModels) {
      // If model doesn't have a proper ID, create one
      if (!model.id || !model.id.startsWith('model_')) {
        const unifiedId = UnifiedIDSystem.generateModelID();
        
        console.log(`🔧 Migrating model: ${model.name} (${model.id}) -> ${unifiedId}`);
        
        await firestore.update('aiModels', model.id, {
          id: unifiedId,
          firestoreId: unifiedId
        });
        
        migratedCount++;
      }
    }
    
    console.log(`✅ Migration completed! ${migratedCount} models migrated to unified ID system`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToUnifiedIDSystem();
}