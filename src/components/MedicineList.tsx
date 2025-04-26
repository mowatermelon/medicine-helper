"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@headlessui/react';
import { useMedicineStore } from '@/store/medicineStore';
import MedicineForm from './MedicineForm';
import { Medicine } from '@/types/medicine';

const formatDate = (date: Date) => {
  return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
};

// 新增余药天数计算函数
const calculateRemainingDays = (medicine: Medicine, targetDate: Date) => {
  const dailyUsage = medicine.doses.morning + medicine.doses.noon + medicine.doses.night;
  if (dailyUsage === 0) return Infinity;

  const baseDate = new Date(medicine.updatedAt || medicine.id);
  const daysPassed = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
  const consumed = dailyUsage * Math.max(daysPassed, 0);
  const remaining = medicine.stock * medicine.specification - consumed;

  return remaining > 0 ? Math.floor(remaining / dailyUsage) : 0;
};

const calculateReplenishment = (med: Medicine, replenishBoxes: number, targetDate: Date) => {
  const dailyUsage = med.doses.morning + med.doses.noon + med.doses.night;
  if (dailyUsage === 0) return { maintainDays: 0, newExpiry: targetDate };

  const remainingDays = calculateRemainingDays(med, targetDate);
  const remainingQuantity = remainingDays * dailyUsage;
  const newQuantity = remainingQuantity + (replenishBoxes * med.specification);
  const maintainDays = Math.floor(newQuantity / dailyUsage);

  return {
    maintainDays,
    newExpiry: new Date(targetDate.getTime() + maintainDays * 86400000)
  };
};

const calculateSuggestedReplenishment = (med: Medicine, targetDate: Date, daysOffset: number) => {
  const dailyUsage = med.doses.morning + med.doses.noon + med.doses.night;
  if (dailyUsage === 0) return 0;
  
  const remainingAtTarget = calculateRemainingDays(med, targetDate) * dailyUsage;
  const requiredForOffset = daysOffset * dailyUsage;
  const needed = Math.max(0, requiredForOffset - remainingAtTarget);
  
  return Math.ceil(needed / med.specification);
};

export default function MedicineList() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const { medicines, deleteMedicine } = useMedicineStore();
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [daysOffset, setDaysOffset] = useState<number>(0);
  const [sortField, setSortField] = useState<'remainingDays' | 'replenishDate'>('remainingDays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 排序函数
  const sortMedicines = (medicines: Medicine[]) => {
    return [...medicines].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'remainingDays') {
        const aDays = calculateRemainingDays(a, targetDate);
        const bDays = calculateRemainingDays(b, targetDate);
        comparison = aDays - bDays;
      } else {
        const aDate = new Date((a.updatedAt || a.id) + calculateRemainingDays(a, targetDate) * 86400000);
        const bDate = new Date((b.updatedAt || b.id) + calculateRemainingDays(b, targetDate) * 86400000);
        comparison = aDate.getTime() - bDate.getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // 更新后的计算函数
  const filterByReplenishDate = (medicines: Medicine[], baseDate: Date, offsetDays: number) => {
    const targetDate = new Date(baseDate.getTime() + offsetDays * 86400000);
    return medicines.filter(med => {
      const daysLeft = calculateRemainingDays(med, targetDate);
      const replenishDate = new Date(targetDate.getTime() + daysLeft * 86400000);
      return replenishDate <= targetDate;
    });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center space-y-4 mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">智能药品管理助手</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
          轻松管理您的日常用药，智能追踪库存和用药提醒，让健康管理更简单、更可靠。
        </p>
      </div>
      <div className="flex justify-end">
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsOpen(true)}
        >
          新增药品
        </Button>
        <Dialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
              <Dialog.Title className="text-lg font-bold mb-4">
                {editingMedicine ? '编辑药品信息' : '新增药品信息'}
              </Dialog.Title>
              <MedicineForm
                initialData={editingMedicine}
                onSuccess={() => {
                  setIsOpen(false);
                  setEditingMedicine(null);
                }}
              />
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>

      <div className="w-full overflow-x-auto rounded-none border border-gray-200 bg-white shadow-none">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500">创建日期</th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500">更新时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">药品名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">库存量</th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500">剩余药量</th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500">用药频率</th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500">每日单片用量</th>
              <th 
                className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => {
                  setSortField('remainingDays');
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                }}
              >
                剩余可用天数
                {sortField === 'remainingDays' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="hidden lg:table-cell px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => {
                  setSortField('replenishDate');
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                }}
              >
                预计补药日期
                {sortField === 'replenishDate' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortMedicines(medicines).map((medicine) => (
              <tr key={`medicine-${medicine.id}-${medicine.name}`}>
                <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{new Date(medicine.id).toLocaleDateString()}</td>
                <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{new Date(medicine.updatedAt || medicine.id).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{medicine.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{medicine.stock.toFixed(1)}盒</td>
                <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{(medicine.stock * medicine.specification).toFixed(1)}片</td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {`${medicine.doses.morning}/${medicine.doses.noon}/${medicine.doses.night}`}
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {(medicine.doses.morning + medicine.doses.noon + medicine.doses.night)}片
                </td>
                <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                  {Math.floor((medicine.stock * medicine.specification) / (medicine.doses.morning + medicine.doses.noon + medicine.doses.night))}天
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {new Date(Date.now() + Math.floor((medicine.stock * medicine.specification) / (medicine.doses.morning + medicine.doses.noon + medicine.doses.night)) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMedicine(medicine);
                      setIsOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMedicine(medicine.id)}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 用药统计面板 */}
      <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm backdrop-blur-sm bg-opacity-90">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">每日用药统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['早晨', '中午', '晚上'].map((time, index) => {
            const timeKey = ['morning', 'noon', 'night'][index] as 'morning' | 'noon' | 'night';
            return (
              <div key={time} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="text-sm text-gray-500">{time}</div>
                <div className="space-y-2 mb-2">
                  {medicines.map(med => {
                    const dosage = med.doses[timeKey];
                    return dosage > 0 ? (
                      <div key={med.id} className="flex justify-between text-sm">
                        <span>{med.name}</span>
                        <span>{dosage}片</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">总用量</span>
                    <span className="text-lg font-medium">
                      {medicines.reduce((sum, med) => sum + med.doses[timeKey], 0)}片
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-sm">每日总用量：</span>
            <span className="font-medium">
              {medicines.reduce((sum, med) => sum +
                (med.doses.morning + med.doses.noon + med.doses.night)
                , 0)}片
            </span>
          </div>
        </div>
      </div>
      {/* 新增补药预测面板 */}
      <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm backdrop-blur-sm bg-opacity-90 mt-8">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h3 className="text-lg font-semibold text-gray-900">补药日期预测</h3>
          <div className="flex gap-2">
            <div className="col-span-2 text-gray-600">
              新有效期：{formatDate(new Date(targetDate.getTime() + daysOffset * 86400000))}
            </div>
            <input
              type="date"
              value={targetDate.toISOString().split('T')[0]}
              onChange={(e) => setTargetDate(new Date(e.target.value))}
              className="border rounded-md px-2 py-1 w-36"
            />
            <input
              type="number"
              min="0"
              value={daysOffset}
              onChange={(e) => setDaysOffset(Math.max(0, parseInt(e.target.value) || 0))}
              className="border rounded-md px-2 py-1 w-24"
              placeholder="间隔天数"
            />
          </div>
        </div>
        <div className="space-y-3">
          {filterByReplenishDate(medicines, targetDate, daysOffset).map(med => {
            const dailyUsage = med.doses.morning + med.doses.noon + med.doses.night;
            const replenishBoxes = calculateSuggestedReplenishment(med, targetDate, daysOffset);
            return (
              <div key={med.id} className="flex flex-col p-3 bg-rose-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{med.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">当前余药天数：{calculateRemainingDays(med, targetDate)}天</div>
                  <div className="text-blue-600">建议补货：
                    <input
                      type="number"
                      min="0"
                      value={replenishBoxes}
                      // onChange={(e) => {
                      //   const value = Math.max(0, parseInt(e.target.value) || 0);
                      //   setReplenishQuantities(prev => ({
                      //     ...prev,
                      //     [med.id]: value
                      //   }));
                      // }}
                      className="w-16 border rounded px-1 ml-1"
                    />盒
                  </div>
<div className="text-gray-600">补后总量：{(calculateRemainingDays(med, targetDate) * (med.doses.morning + med.doses.noon + med.doses.night) + replenishBoxes * med.specification)}片</div>
                  <div className="col-span-2 text-gray-600 border-t pt-2">
                    {med.stock > 0 ? (
                      <>当前有效期：{formatDate(new Date(Date.now() + Math.floor((med.stock * med.specification) / dailyUsage) * 86400000))}</>
                    ) : (
                      <span className="text-red-500">当前无剩余药量</span>
                    )}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    新有效期：{formatDate(calculateReplenishment(med, replenishBoxes, targetDate).newExpiry)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}