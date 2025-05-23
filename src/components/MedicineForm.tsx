import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useMedicineStore } from '@/store/medicineStore';
import { Medicine } from '@/types/medicine';

const schema = z.object({
  name: z.string().min(1, '药品名称不能为空'),
  specification: z.number().min(1, '单盒规格必须大于0'),
  stock: z.number().min(0.1, '库存量必须大于0.1盒'),

  doses: z.object({
    morning: z.number().min(0, '早晨剂量不能小于0').multipleOf(0.1, '剂量必须为0.1的倍数'),
    noon: z.number().min(0, '中午剂量不能小于0').multipleOf(0.1, '剂量必须为0.1的倍数'),
    night: z.number().min(0, '晚上剂量不能小于0').multipleOf(0.1, '剂量必须为0.1的倍数')
  }),
  administration: z.enum(['口服', '针剂', '塞剂'])
});

interface MedicineFormProps {
  onSuccess?: () => void;
  initialData?: Medicine | null;
}

export default function MedicineForm({ onSuccess, initialData }: MedicineFormProps) {
  const { addMedicine, updateMedicine } = useMedicineStore();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      doses: {
        morning: 0,
        noon: 0,
        night: 0
      }
    }
  });


  const onSubmit = (data: z.infer<typeof schema>) => {
    const formData = data;
    if (initialData) {
      updateMedicine(initialData.id, { ...formData, id: initialData.id, updatedAt: Date.now() });
    } else {
      addMedicine({ ...formData, id: Date.now(), updatedAt: Date.now() });
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">药品名称</label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message?.toString()}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">单盒规格（片）</label>
          <input
            type="number"
            {...register('specification', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.specification && <p className="text-red-500 text-sm">{errors.specification.message?.toString()}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">当前库存（盒）</label>
          <input
            type="number"
            step="0.1"
            {...register('stock', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message?.toString()}</p>}
        </div>
      </div>



      <div>
        <label className="block text-sm font-medium mb-1">用药配置</label>
        <div className="grid grid-cols-3 gap-4">
          {['早晨', '中午', '晚上'].map((label, index) => {
            const timeKey = ['morning', 'noon', 'night'][index];
            const fieldName = `doses.${timeKey}` as 'doses.morning' | 'doses.noon' | 'doses.night';
            return (
              <div key={index}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="number"
                  {...register(fieldName, { valueAsNumber: true })}
                  className="w-full px-2 py-1 border rounded"
                  min="0"
                  step="0.1"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">用药方式</label>
        <select
          {...register('administration')}
          className="w-full px-3 py-2 border rounded-md"
        >
          {['口服', '针剂', '塞剂'].map((option, idx) => (
            <option key={`${option}-${idx}`} value={option}>{option}</option>
          ))}
        </select>
      </div>


      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        保存药品
      </Button>
    </form>
  );
}