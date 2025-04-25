"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@headlessui/react';
import { useMedicineStore } from '@/store/medicineStore';
import MedicineForm from './MedicineForm';
import { Medicine } from '@/types/medicine';

export default function MedicineList() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const { medicines, deleteMedicine } = useMedicineStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">智能药品管理助手</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">创建日期</th>
              <th className="px-6 py-3 text-left text-sm font-medium">药品名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium">库存量</th>
              <th className="px-6 py-3 text-left text-sm font-medium">剩余药量</th>
              <th className="px-6 py-3 text-left text-sm font-medium">用药频率</th>
              <th className="px-6 py-3 text-left text-sm font-medium">每日单片用量</th>
              <th className="px-6 py-3 text-left text-sm font-medium">剩余可用天数</th>
              <th className="px-6 py-3 text-left text-sm font-medium">预计补药日期</th>
              <th className="px-6 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {medicines.map((medicine) => (
              <tr key={medicine.id}>
                <td className="px-6 py-4 text-sm">{new Date(medicine.id).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{medicine.name}</td>
                <td className="px-6 py-4 text-sm">{medicine.stock.toFixed(1)}盒</td>
                <td className="px-6 py-4 text-sm">{(medicine.stock * medicine.specification).toFixed(1)}片</td>
                <td className="px-6 py-4 text-sm">
                  {`${medicine.doses.morning}/${medicine.doses.noon}/${medicine.doses.night}`}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(medicine.doses.morning + medicine.doses.noon + medicine.doses.night)}片
                </td>
                <td className="px-6 py-4 text-sm">
                  {Math.floor((medicine.stock * medicine.specification) / (medicine.doses.morning + medicine.doses.noon + medicine.doses.night))}天
                </td>
                <td className="px-6 py-4 text-sm">
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
      <div className="rounded-lg border p-4 bg-gray-50">
        <h3 className="text-sm font-medium mb-4">每日用药统计</h3>
        <div className="flex gap-4">
          {['早晨', '中午', '晚上'].map((time, index) => {
            const timeKey = ['morning', 'noon', 'night'][index];
            return (
              <div key={time} className="flex-1 bg-white rounded-lg p-3">
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
    </div>
  );
}