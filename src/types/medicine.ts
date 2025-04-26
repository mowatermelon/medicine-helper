/**
 * 药品基本信息接口
 * @property {number} id - 药品唯一标识符（自动生成的时间戳）
 * @property {string} name - 药品名称
 * @property {number} specification - 单盒规格（单位：片/盒）
 * @property {number} stock - 当前库存量（单位：盒）
 * @property {Object} doses - 每日用药剂量配置
 * @property {number} doses.morning - 早晨用药量（单位：片/次）
 * @property {number} doses.noon - 中午用药量（单位：片/次）
 * @property {number} doses.night - 晚上用药量（单位：片/次）
 * @property {'口服' | '针剂' | '塞剂'} administration - 给药方式：
 *   - '口服': 口服用药
 *   - '针剂': 注射用药
 *   - '塞剂': 栓剂用药
 */
export interface Medicine {
  id: number;
  name: string;
  specification: number;
  stock: number;
  doses: {
    morning: number;
    noon: number;
    night: number;
  };
  administration: '口服' | '针剂' | '塞剂';
  updatedAt: number;
}