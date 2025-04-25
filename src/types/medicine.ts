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
}