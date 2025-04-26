# 智能用药助手

基于Next.js的药品库存管理系统，提供智能用药计算和飞书通知服务。

## 核心功能
### 🏥 药品管理
- 增删改查药品信息（支持口服/针剂/塞剂类型）
- 数据持久化存储（localStorage AES加密）
- 字段管理：库存量、单盒规格、用药时段剂量配置

### 🧮 智能计算
- 实时计算剩余用药天数
- 生成补货预警（≤3天自动触发）
- 多维度用药统计报表

### 📢 通知服务
- 飞书机器人集成（多环境配置支持）
- 加密存储Webhook配置
- 预警消息模板支持交互式操作

## 技术栈
- **框架**: Next.js 14（App Router）
- **样式**: Tailwind CSS + CSS变量主题
- **状态管理**: 基于Zustand的响应式存储
- **加密**: Web Crypto API (AES-256-GCM)
- **构建工具**: Vite 5

## 环境配置
1. 复制环境模板：
```bash
cp .env.example .env.local
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
