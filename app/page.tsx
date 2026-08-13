"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PwaRegister } from "./pwa-register";

type Resume = { id: string; name: string; createdAt: string };
type Application = { id: string; company: string; role: string; city: string; stage: string; appliedAt: string; nextAction: string; resumeId: string; channel?: "官网" | "招聘软件"; jobUrl?: string; softwareName?: string };
type LocalData = { version: 1; applications: Application[]; resumes: Resume[] };

const seed: LocalData = {
  version: 1,
  resumes: [
    { id: "r-product", name: "产品经理版 v3", createdAt: "2026-08-01" },
    { id: "r-analysis", name: "商业分析版 v2", createdAt: "2026-08-02" },
    { id: "r-growth", name: "增长运营版 v4", createdAt: "2026-08-03" },
    { id: "r-general", name: "通用版 v5", createdAt: "2026-08-04" },
  ],
  applications: [
    { id: "a1", company: "字节跳动", role: "产品经理", city: "北京", stage: "一面", appliedAt: "2026-08-08", nextAction: "今天 19:00", resumeId: "r-product", channel: "官网", jobUrl: "https://jobs.bytedance.com/" },
    { id: "a2", company: "腾讯", role: "商业分析", city: "深圳", stage: "笔试", appliedAt: "2026-08-10", nextAction: "明天 20:00 截止", resumeId: "r-analysis", channel: "招聘软件", softwareName: "牛客" },
    { id: "a3", company: "小红书", role: "用户增长", city: "上海", stage: "已投递", appliedAt: "2026-08-12", nextAction: "已等待 3 天", resumeId: "r-growth", channel: "官网" },
  ],
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("houniao-local", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("data");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function loadData(): Promise<LocalData> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("data").objectStore("data").get("snapshot");
    req.onsuccess = () => resolve((req.result as LocalData | undefined) ?? seed);
    req.onerror = () => reject(req.error);
  });
}
async function saveData(data: LocalData) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("data", "readwrite");
    tx.objectStore("data").put(data, "snapshot");
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
}
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

const stages = ["全部", "网申", "已投递", "笔试", "一面", "二面", "Offer", "已结束"];
const tones = ["purple", "blue", "red", "yellow", "green"];

export default function Home() {
  const [data, setData] = useState<LocalData>(seed);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showResumes, setShowResumes] = useState(false);
  const [channel, setChannel] = useState<"官网" | "招聘软件">("官网");
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData().then(d => { setData(d); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) saveData(data).catch(() => notify("保存失败，请导出备份")); }, [data, ready]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2300); };
  const visible = useMemo(() => filter === "全部" ? data.applications : data.applications.filter(a => a.stage === filter), [data, filter]);
  const resumeName = (id: string) => data.resumes.find(r => r.id === id)?.name ?? "未关联简历";

  const addApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const rawUrl = String(form.get("jobUrl") ?? "").trim();
    const app: Application = { id: crypto.randomUUID(), company: String(form.get("company")), role: String(form.get("role")), city: String(form.get("city")), stage: String(form.get("stage")), appliedAt: String(form.get("appliedAt")), nextAction: String(form.get("nextAction")), resumeId: String(form.get("resumeId")), channel, jobUrl: channel === "官网" && rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`) : undefined, softwareName: channel === "招聘软件" ? String(form.get("softwareName") ?? "").trim() : undefined };
    setData(d => ({ ...d, applications: [app, ...d.applications] })); setShowAdd(false); notify("已保存到本机");
  };
  const addResume = () => {
    const name = window.prompt("输入简历名称和版本，例如：产品经理版 v4");
    if (name?.trim()) { setData(d => ({ ...d, resumes: [...d.resumes, { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString().slice(0, 10) }] })); notify("简历版本已保存"); }
  };
  const deleteResume = (resume: Resume) => {
    const used = data.applications.filter(a => a.resumeId === resume.id).length;
    const message = used ? `“${resume.name}”仍被 ${used} 条投递使用。删除后这些投递会显示“未关联简历”，确定继续？` : `确定删除简历版本“${resume.name}”？`;
    if (!window.confirm(message)) return;
    setData(d => ({ ...d, resumes: d.resumes.filter(r => r.id !== resume.id), applications: d.applications.map(a => a.resumeId === resume.id ? { ...a, resumeId: "" } : a) }));
    notify("简历版本已删除");
  };
  const exportBackup = () => download(`候鸟备份-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(data, null, 2), "application/json");
  const exportCsv = () => {
    const rows = [["公司","岗位","城市","阶段","投递日期","下一步","简历版本","投递方式","官网网址/招聘软件"], ...data.applications.map(a => [a.company,a.role,a.city,a.stage,a.appliedAt,a.nextAction,resumeName(a.resumeId),a.channel??"未记录",a.channel==="官网"?(a.jobUrl??""):(a.softwareName??"")])];
    download("候鸟投递记录.csv", "\ufeff" + rows.map(row => row.map(v => `"${v.replaceAll('"','""')}"`).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as LocalData; if (parsed.version !== 1 || !Array.isArray(parsed.applications) || !Array.isArray(parsed.resumes)) throw new Error(); setData(parsed); notify("备份已恢复"); }
    catch { notify("备份文件无效"); } finally { event.target.value = ""; }
  };

  return <main>
    <PwaRegister />
    <header className="topbar"><button className="brand"><span className="brandmark">候</span><span>候鸟</span></button><nav><button className="active">总览</button><button onClick={() => document.getElementById("投递")?.scrollIntoView()}>投递</button><button onClick={() => setShowTools(true)}>数据与备份</button></nav><div className="local-badge"><i /> 本机数据</div><button className="avatar" onClick={() => setShowTools(true)}>YW</button></header>

    <section className="hero"><div className="eyebrow">本地优先 · 无需登录</div><h1>把每一次投递，<em>稳稳留在手中。</em></h1><p>数据只保存在这台设备，可离线使用；记得定期导出备份。</p><div className="hero-date"><b>{data.applications.length}</b><span>条投递<br />本机保存</span></div></section>

    <section className="priority"><div className="section-title"><span>下一步行动</span><small>{data.applications.filter(a => a.stage !== "已结束").length} 个机会进行中</small></div><div className="task-grid">{data.applications.slice(0,2).map((a,i) => <article className={`task ${i===0?"urgent":""}`} key={a.id}><div className="task-time">{a.stage}</div><div><span className={`tag ${i?"blue":""}`}>{a.company}</span><h3>{a.role}</h3><p>{a.nextAction}</p></div><button onClick={() => notify(`已打开 ${a.company} 的记录`)}>查看记录 <span>→</span></button></article>)}</div></section>

    <section className="content-grid" id="投递"><div className="pipeline"><div className="block-head"><div><small>APPLICATIONS</small><h2>我的投递</h2></div><button className="primary" onClick={() => setShowAdd(true)}>＋ 添加投递</button></div><div className="stage-tabs">{stages.map(s => <button className={filter===s?"selected":""} onClick={() => setFilter(s)} key={s}>{s}{s==="全部"&&<b>{data.applications.length}</b>}</button>)}</div><div className="app-list">{visible.map((a,i) => <article className="app-row" key={a.id}><span className={`company-logo ${tones[i%tones.length]}`}>{a.company[0]}</span><div className="company"><h3>{a.company}</h3><p>{a.role} · {a.city}</p><span className="resume-pill">▧ {resumeName(a.resumeId)}</span><span className="channel-pill">{a.channel??"未记录方式"}{a.channel==="招聘软件"&&a.softwareName?` · ${a.softwareName}`:""}</span>{a.channel==="官网"&&a.jobUrl&&<a className="job-link" href={a.jobUrl} target="_blank" rel="noreferrer">打开职位官网 ↗</a>}</div><span className="applied">{a.appliedAt}</span><select className="stage-select" value={a.stage} aria-label={`${a.company}招聘阶段`} onChange={e => setData(d => ({...d, applications:d.applications.map(x => x.id===a.id?{...x,stage:e.target.value}:x)}))}>{stages.slice(1).map(s=><option key={s}>{s}</option>)}</select><div className="next"><b>{a.nextAction}</b><small>下一步</small></div><button className="more" aria-label={`删除${a.company}`} onClick={() => { if(confirm(`删除 ${a.company} 的投递记录？`)) setData(d=>({...d,applications:d.applications.filter(x=>x.id!==a.id)})); }}>×</button></article>)}</div>{visible.length===0&&<div className="empty">这个阶段还没有投递记录</div>}</div>

      <aside><article className="side-card"><div className="card-icon mint">▤</div><div><small>数据状态</small><h3>{ready?"已保存到本机":"正在读取…"}</h3></div><span className="progress">离线</span><div className="progressbar"><i style={{width:"100%"}} /></div><p>刷新页面和应用升级不会清空数据</p><button onClick={exportBackup}>立即备份 <span>↓</span></button></article><article className="side-card"><div className="card-icon sky">▧</div><div><small>简历库</small><h3>{data.resumes.length} 个简历版本</h3></div><span className="count">{data.applications.length}<small>次关联</small></span><p>投递记录会保留当时使用的简历版本</p><div className="chips">{data.resumes.slice(-2).map(r=><span key={r.id}>{r.name}</span>)}</div><button onClick={()=>setShowResumes(true)}>管理简历版本 <span>→</span></button></article><article className="quote"><span>“</span><p>数据属于你，<br/>选择也始终属于你。</p><small>— 候鸟本地模式</small></article></aside></section>

    <footer><span>候鸟 · 本地优先秋招助手</span><div><button onClick={exportCsv}>导出 CSV</button><button onClick={exportBackup}>导出备份</button><button onClick={() => importRef.current?.click()}>恢复备份</button></div></footer>

    {showAdd&&<div className="modal"><form onSubmit={addApplication}><button type="button" className="close" onClick={()=>setShowAdd(false)}>×</button><small>NEW APPLICATION</small><h2>添加一条投递</h2><div className="form-grid"><label>公司名称<input name="company" required placeholder="例如：网易" /></label><label>申请岗位<input name="role" required placeholder="例如：产品经理" /></label><label>工作城市<input name="city" required placeholder="例如：杭州" /></label><label>招聘阶段<select name="stage" defaultValue="网申">{stages.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>投递日期<input type="date" name="appliedAt" required defaultValue={new Date().toISOString().slice(0,10)} /></label><label>使用的简历<select name="resumeId" required>{data.resumes.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label></div><fieldset className="channel-field"><legend>投递方式</legend><label><input type="radio" name="channel" checked={channel==="官网"} onChange={()=>setChannel("官网")} /> 官网投递</label><label><input type="radio" name="channel" checked={channel==="招聘软件"} onChange={()=>setChannel("招聘软件")} /> 招聘软件</label></fieldset>{channel==="官网"?<label>职位官网网址<input type="text" inputMode="url" name="jobUrl" placeholder="例如：https://jobs.example.com/123" /></label>:<label>招聘软件名称<input name="softwareName" required placeholder="例如：牛客、Boss 直聘、实习僧" /></label>}<label>下一步行动<input name="nextAction" placeholder="例如：8 月 20 日笔试" /></label><button className="submit">保存到本机</button></form></div>}
    {showTools&&<div className="modal"><div className="tool-panel"><button className="close" onClick={()=>setShowTools(false)}>×</button><small>LOCAL DATA</small><h2>数据与备份</h2><p>所有内容保存在当前浏览器的本地数据库中，不会上传到服务器。</p><div className="tool-list"><button onClick={exportBackup}><b>导出完整备份</b><span>换设备或重装前使用</span></button><button onClick={()=>importRef.current?.click()}><b>恢复备份</b><span>会替换当前本机数据</span></button><button onClick={exportCsv}><b>导出 CSV</b><span>可用 Excel 打开投递记录</span></button></div></div></div>}
    {showResumes&&<div className="modal"><div className="tool-panel resume-manager"><button className="close" onClick={()=>setShowResumes(false)}>×</button><small>RESUME LIBRARY</small><h2>简历版本管理</h2><p>删除正在使用的版本不会删除投递记录，只会解除关联。</p><button className="primary add-resume" onClick={addResume}>＋ 添加简历版本</button><div className="resume-list">{data.resumes.map(r=>{const used=data.applications.filter(a=>a.resumeId===r.id).length;return <div className="resume-item" key={r.id}><div><b>{r.name}</b><span>{r.createdAt} · {used} 条投递使用</span></div><button aria-label={`删除${r.name}`} onClick={()=>deleteResume(r)}>删除</button></div>})}{data.resumes.length===0&&<div className="empty">还没有简历版本</div>}</div></div></div>}
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
    {toast&&<div className="toast">✓ {toast}</div>}
  </main>;
}
