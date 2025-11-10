// lib/firebase-unified.ts
import { firestore, storageService } from './firebase';
import { where } from 'firebase/firestore';
import { UnifiedIDSystem } from './id-system';

export const unifiedFirestore = {
  /**
   * Create model with unified ID system
   */
  createModel: async (data: any): Promise<any> => {
    const modelId = UnifiedIDSystem.generateModelID();
    
    const modelData = {
      ...data,
      id: modelId, // Unified ID
      firestoreId: modelId, // Same as unified ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('🔄 Creating model with unified ID:', modelId);
      
      // Use the unified ID as the Firestore document ID
      const docRef = await firestore.create('aiModels', modelData);
      
      console.log('✅ Model created successfully with unified ID:', modelId);
      return { id: modelId, ...modelData };
    } catch (error) {
      console.error('❌ Error creating model:', error);
      throw new Error('Failed to create model');
    }
  },

  /**
   * Get model by unified ID
   */
  getModel: async (modelId: string): Promise<any> => {
    try {
      console.log('🔍 Getting model by unified ID:', modelId);
      
      // Try direct lookup first (since we use unified ID as Firestore ID)
      let model = await firestore.get('aiModels', modelId);
      
      if (!model) {
        console.log('🔄 Model not found with direct ID, searching by id field...');
        // Fallback: search by id field
        const models = await firestore.query('aiModels', [
          where('id', '==', modelId)
        ]);
        model = models.length > 0 ? models[0] : null;
      }
      
      if (model) {
        console.log('✅ Model found:', model.name);
        return model;
      } else {
        console.log('❌ Model not found:', modelId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting model:', error);
      throw new Error('Failed to get model');
    }
  },

  /**
   * Update model by unified ID
   */
  updateModel: async (modelId: string, data: any): Promise<void> => {
    try {
      console.log('🔄 Updating model with unified ID:', modelId);
      
      // Try direct update first
      await firestore.update('aiModels', modelId, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Model updated successfully:', modelId);
    } catch (error) {
      console.error('❌ Direct update failed, trying fallback...', error);
      
      // Fallback: find by id field and update using Firestore ID
      const models = await firestore.query('aiModels', [
        where('id', '==', modelId)
      ]);
      
      if (models.length === 0) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      const firestoreId = models[0].id; // This is the Firestore document ID
      await firestore.update('aiModels', firestoreId, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Model updated via fallback:', modelId);
    }
  },

  /**
   * Delete model by unified ID
   */
  deleteModel: async (modelId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting model with unified ID:', modelId);
      
      // Try direct delete first
      await firestore.delete('aiModels', modelId);
      console.log('✅ Model deleted successfully:', modelId);
    } catch (error) {
      console.error('❌ Direct delete failed, trying fallback...', error);
      
      // Fallback: find by id field and delete using Firestore ID
      const models = await firestore.query('aiModels', [
        where('id', '==', modelId)
      ]);
      
      if (models.length === 0) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      const firestoreId = models[0].id; // This is the Firestore document ID
      await firestore.delete('aiModels', firestoreId);
      
      console.log('✅ Model deleted via fallback:', modelId);
    }
  },

  /**
   * Get all models for user
   */
  getUserModels: async (userId: string): Promise<any[]> => {
    try {
      console.log('🔍 Getting models for user:', userId);
      const models = await firestore.query('aiModels', [
        where('owner', '==', userId)
      ]);
      console.log('✅ User models loaded:', models.length);
      return models;
    } catch (error) {
      console.error('❌ Error getting user models:', error);
      return [];
    }
  },

  /**
   * Get all approved models for marketplace
   */
  getApprovedModels: async (): Promise<any[]> => {
    try {
      console.log('🔍 Getting approved models for marketplace');
      const models = await firestore.query('aiModels', [
        where('status', '==', 'approved')
      ]);
      console.log('✅ Approved models loaded:', models.length);
      return models;
    } catch (error) {
      console.error('❌ Error getting approved models:', error);
      return [];
    }
  },

  /**
   * Track model view
   */
  trackModelView: async (modelId: string): Promise<void> => {
    try {
      const model = await unifiedFirestore.getModel(modelId);
      if (model) {
        await unifiedFirestore.updateModel(modelId, {
          stats: {
            ...model.stats,
            views: (model.stats.views || 0) + 1
          }
        });
      }
    } catch (error) {
      console.error('❌ Error tracking view:', error);
    }
  },

  /**
   * Update model likes
   */
  updateModelLikes: async (modelId: string, increment: boolean): Promise<void> => {
    try {
      const model = await unifiedFirestore.getModel(modelId);
      if (model) {
        const currentLikes = model.stats.likes || 0;
        await unifiedFirestore.updateModel(modelId, {
          stats: {
            ...model.stats,
            likes: increment ? currentLikes + 1 : Math.max(0, currentLikes - 1)
          }
        });
      }
    } catch (error) {
      console.error('❌ Error updating likes:', error);
    }
  }
};