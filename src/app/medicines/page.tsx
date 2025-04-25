import MedicineList from '@/components/MedicineList';

export default function MedicinesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">药品管理</h1>
      <MedicineList />
    </div>
  );
}