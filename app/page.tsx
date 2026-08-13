"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PwaRegister } from "./pwa-register";

type Resume = { id: string; name: string; createdAt: string };
type CompanyPreference = "超级想去" | "一般想去" | "可去可不去";
type Application = { id: string; company: string; role: string; city: string; stage: string; appliedAt: string; nextAction: string; resumeId: string; channel?: "官网" | "招聘软件"; jobUrl?: string; softwareName?: string; preference?: CompanyPreference; favorite?: boolean; pinnedAt?: string };
type ProfileCategory = "个人信息" | "奖项" | "教育经历" | "实习经历" | "项目经历";
type ProfileEntry = { id: string; category: ProfileCategory; title: string; organization: string; period: string; details: string };
type InterviewNote = { id: string; company: string; role: string; round: string; date: string; questions: string; reflection: string; createdAt: string };
type LocalData = { version: 1; applications: Application[]; resumes: Resume[]; profile?: ProfileEntry[]; interviews?: InterviewNote[] };

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
const profileCategories: ProfileCategory[] = ["个人信息", "奖项", "教育经历", "实习经历", "项目经历"];
const preferences: CompanyPreference[] = ["超级想去", "一般想去", "可去可不去"];
const encouragements = [
  "你不需要一次就完美，每次复盘都在让下一次更接近答案。",
  "秋招是一段长跑，稳定地向前，就已经很了不起。",
  "一次面试不定义你的价值，它只是帮你找到更合适的位置。",
  "认真准备过的内容不会白费，它会在未来某个时刻替你说话。",
  "允许自己紧张，也相信自己有能力把故事讲清楚。",
  "你正在做一件很难的事，请记得肯定每一个小进展。",
  "Offer 会迟到，但你的成长每天都在准时发生。",
  "把注意力放在能控制的事上：准备、表达、复盘，然后继续出发。",
];

export default function Home() {
  const [data, setData] = useState<LocalData>(seed);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [preferenceFilter, setPreferenceFilter] = useState<"全部意向" | CompanyPreference>("全部意向");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showResumes, setShowResumes] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInterviews, setShowInterviews] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileCategory>("个人信息");
  const [encouragementIndex, setEncouragementIndex] = useState(() => Math.floor(Math.random() * encouragements.length));
  const [channel, setChannel] = useState<"官网" | "招聘软件">("官网");
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData().then(d => { setData(d); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) saveData(data).catch(() => notify("保存失败，请导出备份")); }, [data, ready]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2300); };
  const visible = useMemo(() => data.applications
    .filter(a => filter === "全部" || a.stage === filter)
    .filter(a => preferenceFilter === "全部意向" || (a.preference ?? "可去可不去") === preferenceFilter)
    .filter(a => a.company.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => (b.pinnedAt ?? "").localeCompare(a.pinnedAt ?? "") || Number(Boolean(b.favorite)) - Number(Boolean(a.favorite))), [data.applications, filter, preferenceFilter, search]);
  const resumeName = (id: string) => data.resumes.find(r => r.id === id)?.name ?? "未关联简历";
  const profile = data.profile ?? [];
  const interviews = data.interviews ?? [];

  const addApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const rawUrl = String(form.get("jobUrl") ?? "").trim();
    const app: Application = { id: crypto.randomUUID(), company: String(form.get("company")), role: String(form.get("role")), city: String(form.get("city")), stage: String(form.get("stage")), appliedAt: String(form.get("appliedAt")), nextAction: String(form.get("nextAction")), resumeId: String(form.get("resumeId")), preference: String(form.get("preference")) as CompanyPreference, channel, jobUrl: channel === "官网" && rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`) : undefined, softwareName: channel === "招聘软件" ? String(form.get("softwareName") ?? "").trim() : undefined };
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
  const entryText = (entry: ProfileEntry) => [entry.title, entry.organization, entry.period, entry.details].filter(Boolean).join("\n");
  const copyText = async (text: string, message = "已复制，可直接粘贴") => {
    try { await navigator.clipboard.writeText(text); notify(message); }
    catch { const area=document.createElement("textarea");area.value=text;document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();notify(message); }
  };
  const addProfileEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const entry: ProfileEntry = { id: crypto.randomUUID(), category: profileTab, title: String(form.get("title")).trim(), organization: String(form.get("organization") ?? "").trim(), period: String(form.get("period") ?? "").trim(), details: String(form.get("details")).trim() };
    setData(d => ({ ...d, profile: [...(d.profile ?? []), entry] })); event.currentTarget.reset(); notify("资料已保存到本机");
  };
  const categoryText = (category?: ProfileCategory) => {
    const entries = category ? profile.filter(e => e.category === category) : profile;
    return entries.map(e => `【${e.category}】\n${entryText(e)}`).join("\n\n");
  };
  const addInterview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const note: InterviewNote = { id: crypto.randomUUID(), company: String(form.get("company")).trim(), role: String(form.get("role")).trim(), round: String(form.get("round")).trim(), date: String(form.get("date")), questions: String(form.get("questions")).trim(), reflection: String(form.get("reflection")).trim(), createdAt: new Date().toISOString() };
    setData(d => ({ ...d, interviews: [note, ...(d.interviews ?? [])] })); event.currentTarget.reset(); notify("面经已保存到本机");
  };
  const interviewText = (note: InterviewNote) => `${note.company} · ${note.role}\n${note.round} · ${note.date}\n\n【面试问题】\n${note.questions}\n\n【复盘心得】\n${note.reflection}`;
  const nextEncouragement = () => setEncouragementIndex(i => (i + 1 + Math.floor(Math.random() * (encouragements.length - 1))) % encouragements.length);
  const exportBackup = () => download(`候鸟备份-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(data, null, 2), "application/json");
  const exportCsv = () => {
    const rows = [["公司","岗位","城市","意向分类","收藏","阶段","投递日期","下一步","简历版本","投递方式","官网网址/招聘软件"], ...data.applications.map(a => [a.company,a.role,a.city,a.preference??"可去可不去",a.favorite?"是":"否",a.stage,a.appliedAt,a.nextAction,resumeName(a.resumeId),a.channel??"未记录",a.channel==="官网"?(a.jobUrl??""):(a.softwareName??"")])];
    download("候鸟投递记录.csv", "\ufeff" + rows.map(row => row.map(v => `"${v.replaceAll('"','""')}"`).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as LocalData; if (parsed.version !== 1 || !Array.isArray(parsed.applications) || !Array.isArray(parsed.resumes)) throw new Error(); setData(parsed); notify("备份已恢复"); }
    catch { notify("备份文件无效"); } finally { event.target.value = ""; }
  };

  return <main>
    <PwaRegister />
    <header className="topbar"><button className="brand"><span className="brandmark">候</span><span>候鸟</span></button><nav><button className="active">总览</button><button onClick={() => document.getElementById("投递")?.scrollIntoView()}>投递</button><button onClick={() => setShowInterviews(true)}>面经总结</button><button onClick={() => setShowTools(true)}>数据与备份</button></nav><div className="local-badge"><i /> 本机数据</div><button className="avatar" onClick={() => setShowTools(true)}>YW</button></header>

    <section className="hero"><div className="eyebrow">本地优先 · 无需登录</div><h1>把每一次投递，<em>稳稳留在手中。</em></h1><p>数据只保存在这台设备，可离线使用；记得定期导出备份。</p><div className="hero-date"><b>{data.applications.length}</b><span>条投递<br />本机保存</span></div></section>

    <section className="priority"><div className="section-title"><span>下一步行动</span><small>{data.applications.filter(a => a.stage !== "已结束").length} 个机会进行中</small></div><div className="task-grid">{data.applications.slice(0,2).map((a,i) => <article className={`task ${i===0?"urgent":""}`} key={a.id}><div className="task-time">{a.stage}</div><div><span className={`tag ${i?"blue":""}`}>{a.company}</span><h3>{a.role}</h3><p>{a.nextAction}</p></div><button onClick={() => notify(`已打开 ${a.company} 的记录`)}>查看记录 <span>→</span></button></article>)}</div></section>

    <section className="content-grid" id="投递"><div className="pipeline"><div className="block-head"><div><small>APPLICATIONS</small><h2>我的投递</h2></div><button className="primary" onClick={() => setShowAdd(true)}>＋ 添加投递</button></div><div className="application-tools"><label className="company-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索公司名称，快速置顶" aria-label="搜索公司名称"/>{search&&<button onClick={()=>setSearch("")} aria-label="清空搜索">×</button>}</label><div className="preference-filters">{(["全部意向",...preferences] as const).map(p=><button className={preferenceFilter===p?"selected":""} onClick={()=>setPreferenceFilter(p)} key={p}>{p}</button>)}</div></div><div className="stage-tabs">{stages.map(s => <button className={filter===s?"selected":""} onClick={() => setFilter(s)} key={s}>{s}{s==="全部"&&<b>{data.applications.length}</b>}</button>)}</div><div className="app-list">{visible.map((a,i) => <article className={`app-row ${a.pinnedAt?"is-pinned":""}`} key={a.id}><span className={`company-logo ${tones[i%tones.length]}`}>{a.company[0]}</span><div className="company"><h3>{a.company}{a.pinnedAt&&<span className="pinned-label">置顶</span>}</h3><p>{a.role} · {a.city}</p><span className="resume-pill">▧ {resumeName(a.resumeId)}</span><span className="channel-pill">{a.channel??"未记录方式"}{a.channel==="招聘软件"&&a.softwareName?` · ${a.softwareName}`:""}</span>{a.channel==="官网"&&a.jobUrl&&<a className="job-link" href={a.jobUrl} target="_blank" rel="noreferrer">打开职位官网 ↗</a>}</div><select className={`preference-select preference-${preferences.indexOf(a.preference??"可去可不去")}`} value={a.preference??"可去可不去"} aria-label={`${a.company}意向分类`} onChange={e=>setData(d=>({...d,applications:d.applications.map(x=>x.id===a.id?{...x,preference:e.target.value as CompanyPreference}:x)}))}>{preferences.map(p=><option key={p}>{p}</option>)}</select><select className="stage-select" value={a.stage} aria-label={`${a.company}招聘阶段`} onChange={e => setData(d => ({...d, applications:d.applications.map(x => x.id===a.id?{...x,stage:e.target.value}:x)}))}>{stages.slice(1).map(s=><option key={s}>{s}</option>)}</select><div className="next"><b>{a.nextAction}</b><small>下一步</small></div><div className="row-actions"><button className={a.favorite?"star active":"star"} aria-label={a.favorite?`取消收藏${a.company}`:`收藏${a.company}`} title="标星收藏" onClick={()=>setData(d=>({...d,applications:d.applications.map(x=>x.id===a.id?{...x,favorite:!x.favorite}:x)}))}>★</button><button className={a.pinnedAt?"pin active":"pin"} aria-label={a.pinnedAt?`取消置顶${a.company}`:`置顶${a.company}`} title={a.pinnedAt?"取消置顶":"快速置顶"} onClick={()=>{setData(d=>({...d,applications:d.applications.map(x=>x.id===a.id?{...x,pinnedAt:x.pinnedAt?undefined:new Date().toISOString()}:x)}));notify(a.pinnedAt?"已取消置顶":"已置顶该公司");}}>↑</button><button className="more" aria-label={`删除${a.company}`} title="删除" onClick={() => { if(confirm(`删除 ${a.company} 的投递记录？`)) setData(d=>({...d,applications:d.applications.filter(x=>x.id!==a.id)})); }}>×</button></div></article>)}</div>{visible.length===0&&<div className="empty">没有找到符合条件的投递记录</div>}</div>

      <aside><article className="side-card"><div className="card-icon mint">▤</div><div><small>网申资料库</small><h3>{profile.length} 项个人资料</h3></div><span className="progress">复制</span><div className="progressbar"><i style={{width:`${Math.min(100,profile.length*8)}%`}} /></div><p>完整记录奖项、教育、实习和项目经历</p><button onClick={()=>setShowProfile(true)}>填写与复制 <span>→</span></button></article><article className="side-card interview-card"><div className="card-icon peach">✎</div><div><small>面经总结</small><h3>{interviews.length} 次面试复盘</h3></div><span className="count">{interviews.length}<small>篇面经</small></span><p>整理问题、表达与心得，让每次面试都有积累</p><button onClick={()=>setShowInterviews(true)}>记录与回顾 <span>→</span></button></article><article className="side-card"><div className="card-icon sky">▧</div><div><small>简历库</small><h3>{data.resumes.length} 个简历版本</h3></div><span className="count">{data.applications.length}<small>次关联</small></span><p>投递记录会保留当时使用的简历版本</p><div className="chips">{data.resumes.slice(-2).map(r=><span key={r.id}>{r.name}</span>)}</div><button onClick={()=>setShowResumes(true)}>管理简历版本 <span>→</span></button></article><article className="quote encouragement"><span>“</span><p>{encouragements[encouragementIndex]}</p><button onClick={nextEncouragement}>换一句鼓励 ↻</button><small>— 候鸟鼓励站</small></article></aside></section>

    <footer><span>候鸟 · 本地优先秋招助手</span><div><button onClick={exportCsv}>导出 CSV</button><button onClick={exportBackup}>导出备份</button><button onClick={() => importRef.current?.click()}>恢复备份</button></div></footer>

    {showAdd&&<div className="modal"><form onSubmit={addApplication}><button type="button" className="close" onClick={()=>setShowAdd(false)}>×</button><small>NEW APPLICATION</small><h2>添加一条投递</h2><div className="form-grid"><label>公司名称<input name="company" required placeholder="例如：网易" /></label><label>申请岗位<input name="role" required placeholder="例如：产品经理" /></label><label>工作城市<input name="city" required placeholder="例如：杭州" /></label><label>公司意向<select name="preference" defaultValue="一般想去">{preferences.map(p=><option key={p}>{p}</option>)}</select></label><label>招聘阶段<select name="stage" defaultValue="网申">{stages.slice(1).map(s=><option key={s}>{s}</option>)}</select></label><label>投递日期<input type="date" name="appliedAt" required defaultValue={new Date().toISOString().slice(0,10)} /></label><label>使用的简历<select name="resumeId" required>{data.resumes.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label></div><fieldset className="channel-field"><legend>投递方式</legend><label><input type="radio" name="channel" checked={channel==="官网"} onChange={()=>setChannel("官网")} /> 官网投递</label><label><input type="radio" name="channel" checked={channel==="招聘软件"} onChange={()=>setChannel("招聘软件")} /> 招聘软件</label></fieldset>{channel==="官网"?<label>职位官网网址<input type="text" inputMode="url" name="jobUrl" placeholder="例如：https://jobs.example.com/123" /></label>:<label>招聘软件名称<input name="softwareName" required placeholder="例如：牛客、Boss 直聘、实习僧" /></label>}<label>下一步行动<input name="nextAction" placeholder="例如：8 月 20 日笔试" /></label><button className="submit">保存到本机</button></form></div>}
    {showTools&&<div className="modal"><div className="tool-panel"><button className="close" onClick={()=>setShowTools(false)}>×</button><small>LOCAL DATA</small><h2>数据与备份</h2><p>所有内容保存在当前浏览器的本地数据库中，不会上传到服务器。</p><div className="tool-list"><button onClick={exportBackup}><b>导出完整备份</b><span>换设备或重装前使用</span></button><button onClick={()=>importRef.current?.click()}><b>恢复备份</b><span>会替换当前本机数据</span></button><button onClick={exportCsv}><b>导出 CSV</b><span>可用 Excel 打开投递记录</span></button></div></div></div>}
    {showResumes&&<div className="modal"><div className="tool-panel resume-manager"><button className="close" onClick={()=>setShowResumes(false)}>×</button><small>RESUME LIBRARY</small><h2>简历版本管理</h2><p>删除正在使用的版本不会删除投递记录，只会解除关联。</p><button className="primary add-resume" onClick={addResume}>＋ 添加简历版本</button><div className="resume-list">{data.resumes.map(r=>{const used=data.applications.filter(a=>a.resumeId===r.id).length;return <div className="resume-item" key={r.id}><div><b>{r.name}</b><span>{r.createdAt} · {used} 条投递使用</span></div><button aria-label={`删除${r.name}`} onClick={()=>deleteResume(r)}>删除</button></div>})}{data.resumes.length===0&&<div className="empty">还没有简历版本</div>}</div></div></div>}
    {showInterviews&&<div className="modal profile-modal"><div className="profile-panel interview-panel"><button className="close" onClick={()=>setShowInterviews(false)}>×</button><div className="profile-head"><div><small>INTERVIEW REVIEW</small><h2>面经总结</h2><p>趁记忆清晰时记录问题与心得，为下一次面试积累答案。</p></div></div><div className="profile-layout interview-layout"><form className="profile-form" onSubmit={addInterview}><h3>新增面试复盘</h3><div className="interview-form-grid"><label>公司<input name="company" required placeholder="例如：腾讯"/></label><label>岗位<input name="role" required placeholder="例如：产品经理"/></label><label>面试轮次<input name="round" required placeholder="例如：一面 / HR 面"/></label><label>面试日期<input type="date" name="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label></div><label>面试问题<textarea name="questions" required rows={6} placeholder="每行记录一个问题，也可以补充自己的回答思路"/></label><label>复盘心得<textarea name="reflection" required rows={6} placeholder="哪些地方答得好？哪里需要改进？下次准备什么？"/></label><button className="submit">保存面经</button></form><div className="profile-records interview-records"><div className="records-head"><h3>我的面经</h3><span>{interviews.length} 篇</span></div>{interviews.map(note=><article className="interview-entry" key={note.id}><header><div><h4>{note.company} · {note.role}</h4><span>{note.round} · {note.date}</span></div><div className="entry-actions"><button onClick={()=>copyText(interviewText(note),"面经已复制")}>复制</button><button className="danger" onClick={()=>{if(confirm(`删除 ${note.company} 的这篇面经？`))setData(d=>({...d,interviews:(d.interviews??[]).filter(x=>x.id!==note.id)}))}}>删除</button></div></header><section><b>面试问题</b><p>{note.questions}</p></section><section><b>复盘心得</b><p>{note.reflection}</p></section></article>)}{!interviews.length&&<div className="empty">还没有面经，完成面试后从左侧开始记录</div>}</div></div></div></div>}
    {showProfile&&<div className="modal profile-modal"><div className="profile-panel"><button className="close" onClick={()=>setShowProfile(false)}>×</button><div className="profile-head"><div><small>APPLICATION PROFILE</small><h2>网申资料库</h2><p>所有信息仅保存在本机，点击即可复制到招聘网站。</p></div><button className="primary" disabled={!profile.length} onClick={()=>copyText(categoryText(),"全部资料已复制")}>复制全部</button></div><div className="profile-tabs">{profileCategories.map(c=><button className={profileTab===c?"selected":""} onClick={()=>setProfileTab(c)} key={c}>{c}<b>{profile.filter(e=>e.category===c).length}</b></button>)}</div><div className="profile-layout"><form className="profile-form" onSubmit={addProfileEntry}><h3>新增{profileTab}</h3><label>{profileTab==="个人信息"?"信息名称":"经历/项目名称"}<input name="title" required placeholder={profileTab==="个人信息"?"例如：手机号、邮箱、政治面貌":"请输入名称"}/></label>{profileTab!=="个人信息"&&<><label>学校 / 公司 / 颁发机构<input name="organization" placeholder="请输入机构名称"/></label><label>时间范围<input name="period" placeholder="例如：2024.07—2024.10"/></label></>}<label>{profileTab==="个人信息"?"信息内容":"详细描述"}<textarea name="details" required rows={5} placeholder={profileTab==="个人信息"?"输入可直接填报的内容":"描述职责、行动、成果，建议使用数字量化"}/></label><button className="submit">保存到本机</button></form><div className="profile-records"><div className="records-head"><h3>已记录内容</h3><button disabled={!profile.some(e=>e.category===profileTab)} onClick={()=>copyText(categoryText(profileTab),`${profileTab}已复制`)}>复制本类全部</button></div>{profile.filter(e=>e.category===profileTab).map(e=><article className="profile-entry" key={e.id}><div><h4>{e.title}</h4>{e.organization&&<b>{e.organization}</b>}{e.period&&<time>{e.period}</time>}<p>{e.details}</p></div><div className="entry-actions"><button onClick={()=>copyText(entryText(e))}>复制</button><button className="danger" onClick={()=>{if(confirm(`删除“${e.title}”？`))setData(d=>({...d,profile:(d.profile??[]).filter(x=>x.id!==e.id)}))}}>删除</button></div></article>)}{!profile.some(e=>e.category===profileTab)&&<div className="empty">还没有{profileTab}，从左侧开始添加</div>}</div></div></div></div>}
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
    {toast&&<div className="toast">✓ {toast}</div>}
  </main>;
}
