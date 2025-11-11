// lib/firebase-unified.ts - CLEAN VERSION
import { firestore, db } from './firebase';
import { where } from 'firebase/firestore';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Interface for model data
interface AIModel {
  id: string;
  name: string;
  niche: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  owner: string;
  ownerName: string;
  media: {
    sfwImages: string[];
    nsfwImages: string[];
    sfwVideos: string[];
    nsfwVideos: string[];
  };
  stats: {
    views: number;
    likes: number;
    downloads: number;
    rating: number;
  };
  createdAt: string;
  updatedAt: string;
  firestoreId: string; // Now required for all new models
}

// Helper function to get db with proper null check
const getDB = () => {
  if (!db) {
    throw new Error('Firestore database is not initialized');
  }
  return db;
};

// Unified ID System - Simplified
class UnifiedIDSystem {
  static generateModelID(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `model_${timestamp}_${randomStr}`;
  }
}

export const unifiedFirestore = {
  /**
   * Create model with unified ID system - OPTIMIZED FOR NEW MODELS
   */
  createModel: async (data: any): Promise<AIModel> => {
    const modelId = UnifiedIDSystem.generateModelID();
    
    // Remove id from data to avoid conflicts
    const { id: _, ...dataWithoutId } = data;
    
    const modelData: AIModel = {
      ...dataWithoutId,
      id: modelId, // Unified ID
      firestoreId: modelId, // Same as document ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('🔄 Creating model with unified ID:', modelId);
      
      const database = getDB();
      
      // Use the unified ID as the Firestore document ID
      const docRef = doc(database, 'aiModels', modelId);
      await setDoc(docRef, modelData);
      
      console.log('✅ Model created successfully:', modelId);
      return modelData;
    } catch (error) {
      console.error('❌ Error creating model:', error);
      throw new Error('Failed to create model');
    }
  },

  /**
   * Get model by unified ID - SIMPLIFIED
   */
  getModel: async (modelId: string): Promise<AIModel | null> => {
    try {
      console.log('🔍 Getting model:', modelId);
      
      const database = getDB();
      
      // Direct lookup using unified ID as document ID
      const docRef = doc(database, 'aiModels', modelId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const modelData = docSnap.data() as AIModel;
        console.log('✅ Model found:', modelData.name);
        return modelData;
      }
      
      console.log('❌ Model not found:', modelId);
      return null;
      
    } catch (error) {
      console.error('❌ Error getting model:', error);
      throw new Error('Failed to get model');
    }
  },

  /**
   * Update model by unified ID - SIMPLIFIED
   */
  updateModel: async (modelId: string, data: any): Promise<void> => {
    try {
      console.log('🔄 Updating model:', modelId);
      
      const database = getDB();
      const docRef = doc(database, 'aiModels', modelId);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Model updated successfully:', modelId);
      
    } catch (error) {
      console.error('❌ Error updating model:', error);
      throw new Error(`Failed to update model ${modelId}`);
    }
  },

  /**
   * Delete model by unified ID - SIMPLIFIED
   */
  deleteModel: async (modelId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting model:', modelId);
      
      const database = getDB();
      const docRef = doc(database, 'aiModels', modelId);
      
      await deleteDoc(docRef);
      console.log('✅ Model deleted successfully:', modelId);
      
    } catch (error) {
      console.error('❌ Error deleting model:', error);
      throw new Error(`Failed to delete model ${modelId}`);
    }
  },

  /**
   * Get all models for user
   */
  getUserModels: async (userId: string): Promise<AIModel[]> => {
    try {
      console.log('🔍 Getting models for user:', userId);
      const models = await firestore.query('aiModels', [
        where('owner', '==', userId)
      ]) as AIModel[];
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
  getApprovedModels: async (): Promise<AIModel[]> => {
    try {
      console.log('🔍 Getting approved models for marketplace');
      const models = await firestore.query('aiModels', [
        where('status', '==', 'approved')
      ]) as AIModel[];
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
   * DEBUG: Get all models for debugging
   */
  debugGetAllModels: async (): Promise<AIModel[]> => {
    try {
      console.log('🐛 DEBUG: Getting all models for inspection');
      const models = await firestore.query('aiModels') as AIModel[];
      console.log('🐛 DEBUG: Found models:', models.length);
      
      // Log each model's ID status
      models.forEach(model => {
        console.log('🐛 DEBUG Model:', {
          id: model.id,
          firestoreId: model.firestoreId,
          name: model.name,
          status: model.status,
          idsMatch: model.id === model.firestoreId ? '✅' : '❌'
        });
      });
      
      return models;
    } catch (error) {
      console.error('❌ DEBUG: Error getting all models:', error);
      return [];
    }
  }
};