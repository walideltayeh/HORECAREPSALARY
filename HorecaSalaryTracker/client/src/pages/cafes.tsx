import { useState } from 'react';
import { CafeForm } from '@/components/cafes/CafeForm';
import { CafeList } from '@/components/cafes/CafeList';
import { Button } from '@/components/ui/button';
import { Cafe } from '@shared/schema';
import { Plus } from 'lucide-react';

export default function Cafes() {
  const [showForm, setShowForm] = useState(false);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
  
  const handleAddNew = () => {
    setEditingCafe(null);
    setShowForm(true);
  };
  
  const handleEdit = (cafe: Cafe) => {
    setEditingCafe(cafe);
    setShowForm(true);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCafe(null);
  };

  return (
    <section id="cafes" className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Cafe Management</h2>
        {!showForm && (
          <Button 
            onClick={handleAddNew} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Cafe
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <CafeForm 
            onSuccess={handleFormSuccess} 
            initialValues={editingCafe || undefined}
            isEditing={!!editingCafe}
            cafeId={editingCafe?.id}
          />
        </div>
      )}

      <CafeList onEdit={handleEdit} />
    </section>
  );
}
