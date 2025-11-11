// app/debug-models/page.tsx - CLEAN VERSION
'use client';

import { useState, useEffect } from 'react';
import { unifiedFirestore } from '@/lib/firebase-unified';

export default function DebugModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const allModels = await unifiedFirestore.debugGetAllModels();
      setModels(allModels);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading models...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Model Debug Page</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold">Database Status:</h2>
        <p><strong>Total Models:</strong> {models.length}</p>
        <p><strong>Models with ID Issues:</strong> {models.filter(m => m.id !== m.firestoreId).length}</p>
        <p><strong>All Models Valid:</strong> {models.every(m => m.id === m.firestoreId) ? '✅' : '❌'}</p>
      </div>

      <div className="grid gap-4">
        {models.map((model) => (
          <div 
            key={`${model.id}-${model.firestoreId}`}
            className="border p-4 rounded" 
            style={{
              borderColor: model.id === model.firestoreId ? 'green' : 'red',
              borderWidth: '2px'
            }}
          >
            <h3 className="font-bold text-lg">{model.name}</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p><strong>ID:</strong> {model.id}</p>
                <p><strong>Firestore ID:</strong> {model.firestoreId}</p>
                <p><strong>Status:</strong> {model.status}</p>
              </div>
              <div>
                <p><strong>Owner:</strong> {model.owner}</p>
                <p><strong>IDs Match:</strong> 
                  <span style={{ color: model.id === model.firestoreId ? 'green' : 'red' }}>
                    {model.id === model.firestoreId ? ' ✅' : ' ❌'}
                  </span>
                </p>
                <p><strong>Created:</strong> {new Date(model.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {model.id !== model.firestoreId && (
              <p className="text-red-500 font-bold mt-2 p-2 bg-red-100 rounded">
                ⚠️ ID MISMATCH - NEEDS ATTENTION
              </p>
            )}
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div className="text-center p-8 bg-yellow-100 rounded">
          <p className="text-lg">No models found in database.</p>
          <p className="text-sm mt-2">Upload some models to see them here.</p>
        </div>
      )}
    </div>
  );
}