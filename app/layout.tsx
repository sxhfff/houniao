import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={title:"候鸟｜本地秋招助手",description:"无需登录、数据保存在本机的秋招记录应用。",manifest:"/manifest.webmanifest",icons:{icon:"/favicon.svg",apple:"/favicon.svg"},appleWebApp:{capable:true,title:"候鸟",statusBarStyle:"default"}};
export const viewport:Viewport={themeColor:"#18352f",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
