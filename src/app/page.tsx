import MedicineList from '@/components/MedicineList';

export default function Home() {
  return (
    <div className="mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">药品库存看板</h1>
      <MedicineList />
    </div>
  );
}