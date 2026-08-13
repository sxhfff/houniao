import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "候鸟｜秋招记录与面试复盘",
  description: "记录秋招投递、掌握关键进度、快速填写网申并沉淀面试经验。",
  openGraph: {
    title: "候鸟｜把握每一次秋招机会",
    description: "你的秋招投递、提醒、网申资料和面试复盘工作台。",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "候鸟｜把握每一次秋招机会",
    description: "你的秋招投递、提醒、网申资料和面试复盘工作台。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
