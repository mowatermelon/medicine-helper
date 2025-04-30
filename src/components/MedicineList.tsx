"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@headlessui/react';
import { useMedicineStore } from '@/store/medicineStore';
import MedicineForm from './MedicineForm';
import { Medicine } from '@/types/medicine';

/**
 * 计算药品有效期信息（考虑从添加/更新日期开始的每日用药）
 * @param medicine 药品对象
 * @returns 包含剩余天数和有效期的对象
 *   - remainingDays: 剩余可用天数（基于已过去天数和每日用量计算）
 *   - expiryDate: 预计用完日期（基准日期 + 已过去天数 + 剩余天数）
 */
const calculateMedicineExpiry = (medicine: Medicine) => {
  // 计算每日总用量（早+中+晚）
  const dailyUsage = medicine.doses.morning + medicine.doses.noon + medicine.doses.night;
  
  // 获取基准日期（优先使用更新时间，没有则使用创建时间）
  const baseDate = new Date(medicine.updatedAt || medicine.id);
  
  // 计算从基准日期到当前已过去的天数
  const daysPassed = Math.floor((Date.now() - baseDate.getTime()) / 86400000);
  
  // 计算剩余药量（总药量 - 已消耗药量）并转换为剩余天数
  const remainingDays = Math.floor(
    (medicine.stock * medicine.specification - dailyUsage * daysPassed) / dailyUsage
  );
  
  // 计算有效期日期（基准日期 + 已过去天数 + 剩余天数）
  const expiryDate = new Date(
    baseDate.getTime() + (daysPassed + remainingDays) * 24 * 60 * 60 * 1000
  );
  
  return { 
    remainingDays: Math.max(0, remainingDays), // 确保剩余天数不小于0
    expiryDate 
  };
};

const formatDate = (date: Date) => {
  return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
};

// 新增余药天数计算函数
/**
 * 计算药品剩余可用天数和剩余药量
 * @param medicine 药品对象
 * @param targetDate 目标日期
 * @returns 包含剩余天数和剩余药量的对象(如果每日用量为0则返回Infinity)
 */
const calculateRemainingDays = (medicine: Medicine, targetDate: Date) => {
  // 计算每日总用量(早+中+晚)
  const dailyUsage = medicine.doses.morning + medicine.doses.noon + medicine.doses.night;
  // 如果每日用量为0，返回无限大(表示不会用完)
  if (dailyUsage === 0) return { days: Infinity, quantity: Infinity };

  // 获取基准日期(优先使用更新时间，没有则使用创建时间)
  const baseDate = new Date(medicine.updatedAt || medicine.id);
  // 计算从基准日期到目标日期的天数差
  const daysPassed = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
  // 计算已消耗的药量(确保天数差不为负)
  const consumed = dailyUsage * Math.max(daysPassed, 0);
  // 计算剩余药量(总药量 - 已消耗)
  const remaining = medicine.stock * medicine.specification - consumed;

  // 返回剩余天数和剩余药量(如果剩余药量为正则计算天数，否则返回0)
  return {
    days: remaining > 0 ? Math.floor(remaining / dailyUsage) : 0,
    quantity: remaining > 0 ? Math.floor(remaining) : 0
  };
};

/**
 * 计算建议补药信息
 * @param med 药品对象
 * @param targetDate 目标日期
 * @param daysOffset 需要维持的天数
 * @returns 包含补药盒数、补药后总量和新有效期的对象
 */
const calculateSuggestedReplenishment = (med: Medicine, targetDate: Date, daysOffset: number) => {
  // 计算每日总用量(早+中+晚)
  const dailyUsage = med.doses.morning + med.doses.noon + med.doses.night;
  // 如果每日用量为0，返回0(无需补药)
  if (dailyUsage === 0) return { boxes: 0, total: 0, newExpiry: targetDate };

  // 计算目标日期时的剩余药量(剩余天数*每日用量)
  const { quantity: remainingAtTarget } = calculateRemainingDays(med, targetDate);
  // 计算维持daysOffset天所需的药量
  const requiredForOffset = daysOffset * dailyUsage;
  // 计算需要补充的药量(确保不小于0)
  const needed = Math.max(0, requiredForOffset - remainingAtTarget);
  // 计算补药盒数(药量/每盒规格，向上取整)
  const boxes = Math.ceil(needed / med.specification);
  // 计算补药后总量
  const total = remainingAtTarget + (boxes * med.specification);
  // 计算新有效期
  const newExpiry = new Date(targetDate.getTime() + Math.floor(total / dailyUsage) * 86400000);

  return { boxes, total, newExpiry };
};

export default function MedicineList() {
  // 控制新增/编辑药品对话框的显示状态
  const [isOpen, setIsOpen] = useState(false);
  // 当前正在编辑的药品对象
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  // 从store中获取药品列表和删除方法
  const { medicines, deleteMedicine } = useMedicineStore();
  // 目标日期状态，用于计算补药预测
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  // 需要维持的天数偏移量
  const [daysOffset, setDaysOffset] = useState<number>(0);
  // 排序字段(剩余天数或补药日期)
  const [sortField, setSortField] = useState<'remainingDays' | 'replenishDate'>('remainingDays');
  // 排序方向(升序或降序)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // 记录每种药品的补药数量
  const [replenishQuantities, setReplenishQuantities] = useState<Record<string, number>>({});

  /**
   * 药品排序函数
   * @param medicines 药品列表
   * @returns 排序后的药品列表
   */
  const sortMedicines = (medicines: Medicine[]) => {
    return [...medicines].sort((a, b) => {
      let comparison = 0;

      // 根据选择的排序字段进行比较
      if (sortField === 'remainingDays') {
        // 按剩余天数排序
        const { remainingDays: aDays } = calculateMedicineExpiry(a);
        const { remainingDays: bDays } = calculateMedicineExpiry(b);
        comparison = aDays - bDays;
      } else {
        // 按补药日期排序
        const { expiryDate: aDate } = calculateMedicineExpiry(a);
        const { expiryDate: bDate } = calculateMedicineExpiry(b);
        comparison = aDate.getTime() - bDate.getTime();
      }

      // 根据排序方向返回比较结果
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  /**
   * 过滤需要补药的药品
   * @param medicines 药品列表
   * @param baseDate 基准日期
   * @param offsetDays 偏移天数
   * @returns 需要补药的药品列表
   */
  const filterByReplenishDate = (medicines: Medicine[], baseDate: Date, offsetDays: number) => {
    // 计算目标日期(基准日期+偏移天数)
    const targetDate = new Date(baseDate.getTime() + offsetDays * 86400000);
    // 过滤出在目标日期前需要补药的药品
    return medicines.filter(med => {
      const { days: daysLeft } = calculateRemainingDays(med, targetDate);
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
                  {calculateMedicineExpiry(medicine).remainingDays}天
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {calculateMedicineExpiry(medicine).expiryDate.toLocaleDateString()}
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
          <div className="flex gap-2 items-center">
            <div className="text-gray-600">
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
            const { boxes: replenishBoxes, total, newExpiry } = calculateSuggestedReplenishment(med, targetDate, daysOffset);
            const remainingData = calculateRemainingDays(med, targetDate);
            return (
              <div key={med.id} className="flex flex-col p-3 bg-rose-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{med.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">每盒规格：{med.specification}片</div>
                  <div className="text-gray-600">当前余药天数：{remainingData.days}天</div>
                  <div className="text-gray-600">当前余药片数：{remainingData.quantity}片</div>
                  <div className="text-blue-600">建议补货：
                    <input
                      type="number"
                      min="0"
                      value={replenishQuantities[med.id] || replenishBoxes}
                      onChange={(e) => {
                        const value = Math.max(0, parseInt(e.target.value) || 0);
                        setReplenishQuantities(prev => ({
                          ...prev,
                          [med.id]: value
                        }));
                      }}
                      className="w-16 border rounded px-1 ml-1"
                    />盒
                  </div>
                  <div className="text-gray-600">补后总量：{total}片</div>
                  <div className="col-span-2 text-gray-600 border-t pt-2">
                    {med.stock > 0 ? (
                      <>当前有效期：{formatDate(new Date(Date.now() + Math.floor((med.stock * med.specification) / dailyUsage) * 86400000))}</>
                    ) : (
                      <span className="text-red-500">当前无剩余药量</span>
                    )}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    新有效期：{formatDate(newExpiry)}
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