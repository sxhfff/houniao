# 候鸟（Houniao）

候鸟是一款本地优先的秋招投递管理工具，用于集中管理投递进度、简历版本、网申资料、公司意向和面试复盘。

- 在线地址：<https://houniao-zeta.vercel.app>
- GitHub：<https://github.com/sxhfff/houniao>
- 当前模式：无需登录，数据仅保存在当前设备浏览器

## 产品特性

### 投递管理

- 记录公司、岗位、城市、招聘阶段、投递日期和下一步行动
- 记录官网投递或招聘软件投递
- 官网投递可保存职位网址
- 每条投递关联当时使用的简历版本
- 直接修改招聘阶段或删除投递记录
- 投递列表固定高度并在区域内部滚动，避免数据较多时无限延长页面

### 公司整理

- 公司意向分类：`超级想去`、`一般想去`、`可去可不去`
- 根据公司名称搜索
- 快速置顶或取消置顶
- 标星收藏
- 按意向分类筛选
- 置顶记录优先显示，收藏记录其次显示

### 简历版本

- 添加和删除简历版本
- 查看简历版本关联的投递数量
- 删除正在使用的简历不会删除投递，只会解除关联

### 网申资料库

支持完整记录：

- 个人信息
- 奖项
- 教育经历
- 实习经历
- 项目经历

资料支持单条复制、分类复制、全部复制和删除，便于粘贴到招聘网站。

### 面经总结

- 记录公司、岗位、面试轮次和日期
- 整理面试问题和回答思路
- 记录表现总结与改进方向
- 支持复制整篇面经和删除记录

### 候鸟鼓励站

- 每次打开随机展示鼓励语
- 支持手动切换下一句

### 备份与导出

- 导出完整 JSON 备份
- 从 JSON 恢复完整数据
- 导出 CSV 投递记录
- JSON 备份包含投递、简历、网申资料和面经
- CSV 包含公司意向和收藏状态

## 数据保存说明

候鸟目前没有账号系统和云端数据库。所有用户数据均保存在浏览器的 IndexedDB 中，不会上传到 GitHub 或 Vercel。

IndexedDB 配置：

| 项目 | 值 |
| --- | --- |
| 数据库 | `houniao-local` |
| 版本 | `1` |
| Object Store | `data` |
| Snapshot Key | `snapshot` |

在同一设备、同一浏览器、同一网址下，刷新页面或关闭浏览器通常不会丢失数据。以下操作可能导致数据无法读取：

- 清除浏览器网站数据
- 使用无痕模式
- 更换浏览器或设备
- 使用不同的域名或本地开发地址

换设备前请先导出 JSON 备份，再在新设备中恢复。线上域名与 `localhost` 使用不同的 IndexedDB，数据不会自动共享。

## 数据结构

```ts
type CompanyPreference = "超级想去" | "一般想去" | "可去可不去";

type Resume = {
  id: string;
  name: string;
  createdAt: string;
};

type Application = {
  id: string;
  company: string;
  role: string;
  city: string;
  stage: string;
  appliedAt: string;
  nextAction: string;
  resumeId: string;
  channel?: "官网" | "招聘软件";
  jobUrl?: string;
  softwareName?: string;
  preference?: CompanyPreference;
  favorite?: boolean;
  pinnedAt?: string;
};

type ProfileCategory =
  | "个人信息"
  | "奖项"
  | "教育经历"
  | "实习经历"
  | "项目经历";

type ProfileEntry = {
  id: string;
  category: ProfileCategory;
  title: string;
  organization: string;
  period: string;
  details: string;
};

type InterviewNote = {
  id: string;
  company: string;
  role: string;
  round: string;
  date: string;
  questions: string;
  reflection: string;
  createdAt: string;
};

type LocalData = {
  version: 1;
  applications: Application[];
  resumes: Resume[];
  profile?: ProfileEntry[];
  interviews?: InterviewNote[];
};
```

新增字段应尽量保持可选，以兼容旧浏览器数据和旧备份。

## 技术栈

- React 19
- TypeScript 5
- Vite 8
- Vinext
- IndexedDB
- PWA / Service Worker
- Vercel 静态部署

目前没有 REST API、账号登录、云端数据库或云端文件存储。

## 关键文件

```text
app/page.tsx             核心页面、数据结构和业务逻辑
app/globals.css          页面样式和响应式布局
app/pwa-register.tsx     Service Worker 注册
public/sw.js             PWA 离线缓存
public/manifest.webmanifest
vite.static.config.ts    Vercel 静态构建配置
vercel.json              Vercel 部署配置
.openai/hosting.json     Sites 项目配置
```

## 本地开发

要求 Node.js `22.13.0` 或更高版本，并安装 pnpm。

```bash
git clone https://github.com/sxhfff/houniao.git
cd houniao
pnpm install
pnpm dev
```

类型检查：

```bash
pnpm exec tsc --noEmit
```

生成与 Vercel 一致的静态构建：

```bash
pnpm build:static
```

静态产物位于：

```text
static-dist/
```

完整 Vinext 构建：

```bash
pnpm build
```

## 部署

Vercel 使用以下配置：

```json
{
  "framework": null,
  "buildCommand": "pnpm build:static",
  "outputDirectory": "static-dist",
  "cleanUrls": true
}
```

登录正确的 Vercel 账号后发布：

```bash
pnpm dlx vercel@latest --prod --yes
```

正式项目的固定别名应保持为：

```text
https://houniao-zeta.vercel.app
```

## 开发注意事项

1. 不要修改 IndexedDB 数据库名、Object Store 或 Snapshot Key，否则已有数据可能无法读取。
2. 不要用示例数据覆盖浏览器中已经存在的用户数据。
3. 新增数据字段时保持旧 JSON 备份兼容。
4. 修改页面后更新 `public/sw.js` 中的缓存版本，例如从 `houniao-v7` 升到 `houniao-v8`。
5. 发布前至少运行 TypeScript 检查和 `pnpm build:static`。
6. 中文源码和文档使用 UTF-8 编码，避免 PowerShell 默认编码造成乱码。
7. GitHub 仅保存源码；调试真实用户数据时需要单独导出和恢复 JSON 备份。

## 给 Codex 的接手提示

```text
请接手“候鸟”秋招管理项目。

仓库：https://github.com/sxhfff/houniao
分支：main
线上：https://houniao-zeta.vercel.app

这是一个 React + TypeScript + Vite/Vinext 的本地优先 PWA。
核心代码在 app/page.tsx，样式在 app/globals.css。
数据保存在 IndexedDB：houniao-local / data / snapshot。
目前没有后端接口和账号系统。

请先阅读 README.md、package.json、app/page.tsx、app/globals.css、
vercel.json、vite.static.config.ts、public/sw.js 和 .openai/hosting.json。
保留现有数据结构和旧备份兼容性，不要覆盖用户的浏览器本地数据。
修改完成后运行 TypeScript 检查和 pnpm build:static。
上线时更新 Service Worker 缓存版本，部署至现有 Vercel 项目，
并把源码提交推送到 main。
```
