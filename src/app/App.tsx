import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  LayoutDashboard, Users, CalendarOff, FileText, Settings,
  Bell, ChevronDown, Search, Plus, Upload, Download, Trash2,
  Edit3, Eye, CheckCircle, XCircle, CalendarDays, LogOut,
  Menu, X, RefreshCw, AlertCircle, ChevronRight, FileSpreadsheet,
  Printer, UserCheck, BookOpen, IndianRupee, TrendingUp,
  ArrowUpRight, ArrowDownRight, Check, Info, Shield,
  MoreHorizontal, GraduationCap, Building2, AlertTriangle,
  Lock, User, ChevronLeft,
} from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import nitmLogo from "@/imports/image.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/auth";
import { studentsApi } from "../services/students";
import { leavesApi } from "../services/leaves";
import { settingsApi } from "../services/settings";
import { dashboardApi } from "../services/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthRole  = "admin" | "student";
type Page = "dashboard" | "students" | "leave" | "records" | "settings" | "portal";

interface Student {
  rollNo: string; name: string; gender: "M" | "F"; dept: string;
  hostel: string; room: string; year: string; semester: string;
  messFee: number; amountPaid: number; refundEarned: number;
  status: "Active" | "Inactive" | "On Leave"; email: string; phone: string;
  dob: string;
}
interface LeaveRecord {
  id: string; rollNo: string; studentName: string; hostel: string;
  leaveStart: string; leaveEnd: string; reason: string;
  breakfastMissed: number; lunchMissed: number; dinnerMissed: number;
  refundAmount: number; status: "Pending" | "Verified" | "Rejected"; semester: string;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  blue: "#0F4C81", blueDark: "#0a3a62", blueLight: "#E8F0FA", blueMid: "#3B7DC4",
  teal: "#00A8A8", tealLight: "#E0F7F7",
  orange: "#FF8C42", orangeLight: "#FFF0E6",
  bg: "#F8FAFC", card: "#ffffff", text: "#0D1B2A", textSub: "#374151", muted: "#6B7A90",
  border: "rgba(15,76,129,0.1)", borderStrong: "rgba(15,76,129,0.18)",
  green: "#10B981", greenLight: "#D1FAE5",
  red: "#DC2626", redLight: "#FEE2E2",
  yellow: "#F59E0B", yellowLight: "#FEF3C7",
  shadow: "0 1px 12px rgba(15,76,129,0.08)", shadowMd: "0 4px 24px rgba(15,76,129,0.14)",
};

const DEPTS   = ["CS", "ME", "EE", "CE", "EC"];

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");
const daysBetween = (a: string, b: string) =>
  Math.max(0, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

function generateStudentCSV(students: Student[]) {
  const hdr = "rollNo,name,gender,dept,hostel,room,year,semester,messFee,amountPaid,email,phone,dob";
  const rows = students.map(s =>
    [s.rollNo, s.name, s.gender, s.dept, s.hostel, s.room, s.year, s.semester, s.messFee, s.amountPaid, s.email, s.phone, s.dob || "2003-06-15"].join(",")
  );
  return [hdr, ...rows].join("\n");
}

const CSV_TEMPLATE = `rollNo,name,gender,dept,hostel,room,year,semester,messFee,amountPaid,email,phone,dob
B24ME010,Sample Student,M,ME,Boys Hostel (Single Seater),A-101,2024-28,Spring 2026,25000,25000,b24me010@nitm.ac.in,9876543000,2003-06-15`;

function downloadText(content: string, filename: string) {
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    Active:     { bg: C.greenLight,  fg: C.green  },
    Inactive:   { bg: "#F1F5F9",     fg: C.muted  },
    "On Leave": { bg: C.orangeLight, fg: C.orange },
    Verified:   { bg: C.greenLight,  fg: C.green  },
    Pending:    { bg: C.yellowLight, fg: C.yellow },
    Rejected:   { bg: C.redLight,    fg: C.red    },
  };
  const s = map[status] ?? { bg: C.blueLight, fg: C.blue };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.fg }} />
      {status}
    </span>
  );
}

function KpiCard({ icon, label, value, sub, trend, color }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; trend?: { val: string; up: boolean }; color: string;
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 truncate" style={{ color: C.muted }}>{label}</p>
          <p className="text-xl sm:text-2xl font-bold leading-none" style={{ color: C.text }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: C.muted }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "18", color }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-semibold pt-2"
          style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="flex items-center gap-0.5" style={{ color: trend.up ? C.green : C.red }}>
            {trend.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend.val}
          </span>
          <span style={{ color: C.muted }}>vs last sem</span>
        </div>
      )}
    </div>
  );
}

function Card({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5"
      style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate" style={{ color: C.text }}>{title}</h3>
        {sub && <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function ChartWrap({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <Card><CardHeader title={title} sub={sub} /><div className="p-3 sm:p-4">{children}</div></Card>;
}

type BtnV = "primary" | "secondary" | "teal" | "ghost" | "danger" | "orange";
function Btn({ children, variant = "primary", size = "md", icon, onClick, disabled, ...rest }: {
  children?: React.ReactNode; variant?: BtnV; size?: "sm" | "md" | "lg";
  icon?: React.ReactNode; onClick?: () => void; disabled?: boolean; [k: string]: unknown;
}) {
  const styles: Record<BtnV, React.CSSProperties> = {
    primary:   { background: C.blue,        color: "#fff",   border: `1px solid ${C.blue}` },
    secondary: { background: C.blueLight,   color: C.blue,   border: `1px solid ${C.blueLight}` },
    teal:      { background: C.tealLight,   color: C.teal,   border: `1px solid ${C.tealLight}` },
    orange:    { background: C.orangeLight, color: C.orange, border: `1px solid ${C.orangeLight}` },
    ghost:     { background: "transparent", color: C.muted,  border: `1px solid ${C.border}` },
    danger:    { background: C.redLight,    color: C.red,    border: `1px solid ${C.redLight}` },
  };
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-5 py-2.5 text-sm" : "px-3.5 py-2 text-sm";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-40 whitespace-nowrap ${pad}`}
      style={styles[variant]} {...(rest as object)}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [foc, setFoc] = useState(false);
  return (
    <input {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${props.className ?? ""}`}
      style={{
        background: props.readOnly ? "#F8FAFC" : "#F1F5F9",
        border: `1.5px solid ${foc ? C.blue : "transparent"}`,
        color: C.text, opacity: props.readOnly ? 0.65 : 1, ...props.style,
      }}
      onFocus={e => { setFoc(true); props.onFocus?.(e); }}
      onBlur={e => { setFoc(false); props.onBlur?.(e); }}
    />
  );
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none cursor-pointer ${props.className ?? ""}`}
      style={{ background: "#F1F5F9", border: "1.5px solid transparent", color: C.text, ...props.style }}>
      {children}
    </select>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, width = "max-w-2xl", children }: {
  open: boolean; onClose: () => void; title: string; width?: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(13,27,42,0.6)", backdropFilter: "blur(6px)" }}>
      <div className={`w-full ${width} rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]`}
        style={{ background: C.card, boxShadow: "0 24px 80px rgba(15,76,129,0.25)" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-base font-bold" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100"
            style={{ color: C.muted }}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg, type = "success" }: { msg: string; type?: "success" | "error" | "info" }) {
  const bg = type === "error" ? C.red : type === "info" ? C.blue : C.green;
  const Icon = type === "error" ? AlertTriangle : type === "info" ? Info : Check;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white"
      style={{ background: bg, animation: "slideIn .25s ease", maxWidth: "calc(100vw - 2rem)" }}>
      <Icon size={15} />{msg}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "Search…"}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#F1F5F9", border: "1.5px solid transparent", color: C.text }} />
    </div>
  );
}

function Pagination({ page, total, perPage, onChange }: {
  page: number; total: number; perPage: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-100" style={{ color: C.muted }}>‹</button>
      {Array.from({ length: Math.min(pages, 5) }, (_, i) => (
        <button key={i} onClick={() => onChange(i)}
          className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
          style={{ background: page === i ? C.blue : "transparent", color: page === i ? "#fff" : C.muted }}>
          {i + 1}
        </button>
      ))}
      {pages > 5 && <span className="text-xs px-1" style={{ color: C.muted }}>…{pages}</span>}
      <button onClick={() => onChange(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-100" style={{ color: C.muted }}>›</button>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (role: AuthRole, id: string) => void }) {
  const [mode, setMode]       = useState<"choose" | "admin" | "student">("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rollNo, setRollNo]   = useState("");
  const [dob, setDob]         = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const loginUser = mode === "admin" ? username : rollNo.toUpperCase().trim();
      const loginPass = mode === "admin" ? password : dob;

      const res = await authApi.login({ username: loginUser, password: loginPass });
      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        onLogin(res.user.role, res.user.username);
      } else {
        setErr(res.message || "Invalid credentials");
      }
    } catch (error: any) {
      setErr(error.message || "Invalid credentials. Try admin / admin123 or B22ME001 / 2003-06-15");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(150deg, ${C.blue} 0%, #1565A8 45%, #0e7490 100%)` }}>
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(-35%,-35%)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "#fff", transform: "translate(30%,30%)" }} />
      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-2 shadow-2xl">
            <ImageWithFallback src={nitmLogo} alt="NIT Meghalaya" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">NITM MessTrack</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>National Institute of Technology Meghalaya</p>
          </div>
        </div>

        {mode === "choose" ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>Select your role to continue</p>
            {[
              { role: "admin" as const, label: "Admin Login", sub: "Hostel wardens, accounts staff & super admins", Icon: Shield, color: C.orange },
              { role: "student" as const, label: "Student Login", sub: "View your fee records, leave history & refunds", Icon: GraduationCap, color: C.teal },
            ].map(r => (
              <button key={r.role} onClick={() => setMode(r.role)}
                className="w-full rounded-2xl p-5 text-left flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.color }}>
                  <r.Icon size={22} color="#fff" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-white">{r.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{r.sub}</div>
                </div>
                <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            ))}
            <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              Demo: admin / admin123 &nbsp;·&nbsp; B22ME001 / 2003-06-15
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <button onClick={() => { setMode("choose"); setErr(""); }}
              className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:opacity-60 transition-opacity" style={{ color: C.muted }}>
              <ChevronLeft size={16} />Back
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: mode === "admin" ? C.orange : C.teal }}>
                {mode === "admin" ? <Shield size={18} color="#fff" /> : <GraduationCap size={18} color="#fff" />}
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: C.text }}>{mode === "admin" ? "Admin Login" : "Student Login"}</h2>
                <p className="text-xs" style={{ color: C.muted }}>{mode === "admin" ? "Enter your credentials" : "Roll number & date of birth"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {mode === "admin" ? (
                <>
                  <Field label="Username" required>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                      <FInput value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" className="pl-9"
                        onKeyDown={e => e.key === "Enter" && submit()} />
                    </div>
                  </Field>
                  <Field label="Password" required>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                      <FInput value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="pl-9"
                        onKeyDown={e => e.key === "Enter" && submit()} />
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Roll Number" required>
                    <FInput value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g. B22ME001"
                      onKeyDown={e => e.key === "Enter" && submit()} />
                  </Field>
                  <Field label="Date of Birth" required>
                    <FInput value={dob} onChange={e => setDob(e.target.value)} type="date"
                      onKeyDown={e => e.key === "Enter" && submit()} />
                  </Field>
                </>
              )}
              {err && (
                <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: C.redLight }}>
                  <AlertTriangle size={14} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: C.red }}>{err}</p>
                </div>
              )}
              <button onClick={submit} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: mode === "admin" ? C.blue : C.teal }}>
                {loading ? <><RefreshCw size={14} className="animate-spin" />Signing in…</> : `Sign in as ${mode === "admin" ? "Admin" : "Student"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const ADMIN_NAV_ITEMS = [
  { id: "dashboard" as Page, label: "Dashboard",          Icon: LayoutDashboard },
  { id: "students"  as Page, label: "Student Management", Icon: Users },
  { id: "leave"     as Page, label: "Leave Management",   Icon: CalendarOff },
  { id: "records"   as Page, label: "Records & Reports",  Icon: FileText },
  { id: "settings"  as Page, label: "Settings",           Icon: Settings },
];

const STUDENT_NAV_ITEMS = [
  { id: "portal"    as Page, label: "Student Portal",     Icon: GraduationCap },
];

function Sidebar({ page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout, isMobile, auth, students }: {
  page: Page; setPage: (p: Page) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
  onLogout: () => void; isMobile: boolean;
  auth: { role: AuthRole; id: string } | null;
  students: Student[];
}) {
  const showLabels = isMobile ? true : !collapsed;
  const w = isMobile ? 252 : collapsed ? 68 : 252;
  const navItems = auth?.role === "admin" ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS;

  return (
    <>
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className="flex flex-col h-screen flex-shrink-0 transition-all duration-300 z-40"
        style={{
          width: w, background: C.blue,
          position: isMobile ? "fixed" : "sticky",
          top: 0, left: 0,
          transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
          boxShadow: isMobile && mobileOpen ? "4px 0 30px rgba(0,0,0,0.25)" : "none",
        }}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3.5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0">
            <ImageWithFallback src={nitmLogo} alt="NITM" className="w-full h-full object-contain" />
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm leading-tight truncate">NITM MessTrack</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>NIT Meghalaya</div>
            </div>
          )}
          {isMobile
            ? <button onClick={() => setMobileOpen(false)} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}><X size={15} /></button>
            : <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}><Menu size={15} /></button>
          }
        </div>
        {/* Semester chip */}
        {showLabels && (
          <div className="mx-3 mt-3 mb-1">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
              <BookOpen size={12} />Spring 2026<ChevronDown size={11} className="ml-auto" />
            </div>
          </div>
        )}
        {/* Nav */}
        <nav className="flex-1 px-2 flex flex-col gap-0.5 py-2 overflow-y-auto">
          {navItems.map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => { setPage(id); if (isMobile) setMobileOpen(false); }}
                title={!showLabels ? label : undefined}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full transition-all"
                style={{ background: active ? "rgba(255,255,255,0.16)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
                <Icon size={18} className="flex-shrink-0" />
                {showLabels && <><span className="text-sm font-medium flex-1 truncate">{label}</span>{active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}</>}
              </button>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="px-2 pb-4 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {showLabels && (
            <div className="px-3 pt-3 pb-1">
              <div className="text-xs font-bold text-white truncate">
                {auth?.role === "admin" ? "Admin User" : (students.find(s => s.rollNo === auth?.id)?.name || "Student")}
              </div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                {auth?.role === "admin" ? "Super Admin" : (auth?.id || "Student Portal")}
              </div>
            </div>
          )}
          <button onClick={onLogout} title={!showLabels ? "Logout" : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}>
            <LogOut size={17} className="flex-shrink-0" />
            {showLabels && <span className="text-sm">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const PAGE_META: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard",          sub: "Semester overview & analytics" },
  students:  { title: "Student Management", sub: "Enrolment & fee records" },
  leave:     { title: "Leave Management",   sub: "Record leave & auto-calculate refunds" },
  records:   { title: "Records & Reports",  sub: "Historical data & exports" },
  settings:  { title: "Settings",           sub: "System configuration" },
  portal:    { title: "Student Portal",     sub: "Arjun Sharma · B22ME001 (Read-only)" },
};

function Topbar({ page, onMenuClick, onLogout, auth, students }: {
  page: Page; onMenuClick: () => void; onLogout: () => void;
  auth: { role: AuthRole; id: string } | null;
  students: Student[];
}) {
  const { title, sub } = PAGE_META[page];
  const dynamicSub = page === "portal" && auth
    ? `${students.find(s => s.rollNo === auth.id)?.name || "Student"} · ${auth.id} (Read-only)`
    : sub;
  const initials = auth?.role === "student"
    ? (students.find(s => s.rollNo === auth.id)?.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ST")
    : "AD";

  return (
    <header className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sticky top-0 z-10 flex-shrink-0"
      style={{ background: "rgba(248,250,252,0.96)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onMenuClick} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 flex-shrink-0" style={{ color: C.muted }}>
        <Menu size={20} />
      </button>
      <div className="w-7 h-7 rounded-full overflow-hidden bg-white border hidden sm:flex items-center justify-center p-0.5 flex-shrink-0" style={{ borderColor: C.border }}>
        <ImageWithFallback src={nitmLogo} alt="NITM" className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-sm sm:text-base leading-tight truncate" style={{ color: C.text }}>{title}</h1>
        <p className="text-xs truncate hidden sm:block" style={{ color: C.muted }}>{dynamicSub}</p>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: C.blueLight, color: C.blue }}>
        <BookOpen size={12} />Spring 2026
      </div>
      <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 flex-shrink-0" style={{ color: C.muted }}>
        <Bell size={18} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: C.orange }} />
      </button>
      <button onClick={onLogout}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: C.blue }}>{initials}</div>
        <ChevronDown size={12} className="hidden sm:block" style={{ color: C.muted }} />
      </button>
    </header>
  );
}

// ─── PAGE: DASHBOARD ──────────────────────────────────────────────────────────
function DashboardPage() {
  const [search, setSearch] = useState("");
  const [pg, setPg] = useState(0);
  const PER = 6;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats().then(res => res.stats),
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: () => dashboardApi.getCharts().then(res => res.charts),
  });

  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['dashboardLeaves', search],
    queryFn: () => leavesApi.getAll(search).then(res => res.leaves),
  });

  const filteredLeaves = leaves;
  const pagedLeaves = filteredLeaves.slice(pg * PER, (pg + 1) * PER);

  if (statsLoading || chartsLoading || leavesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const activeStu = stats?.active ?? 0;
  const onLeave   = stats?.onLeave ?? 0;
  const collection = stats?.collection ?? 0;
  const refunds   = stats?.refunds ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const netRevenue = stats?.netRevenue ?? 0;

  const semCollData = charts?.semCollData ?? [];
  const hostelStudData = charts?.hostelStudData ?? [];
  const hostelRefData = charts?.hostelRefData ?? [];
  const monthlyData = charts?.monthlyData ?? [];
  const springAutumn = charts?.springAutumn ?? [];

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={<Users size={18} />}       label="Total Students"  value={String(totalStudents)} sub="Spring 2026"    color={C.blue}   trend={{ val:"+8%",  up:true }} />
        <KpiCard icon={<UserCheck size={18} />}   label="Active"          value={String(activeStu)}       sub="Enrolled"       color={C.green}  trend={{ val:"+5%",  up:true }} />
        <KpiCard icon={<CalendarOff size={18} />} label="On Leave"        value={String(onLeave)}         sub="Away"           color={C.orange} />
        <KpiCard icon={<IndianRupee size={18} />} label="Collection"      value={fmtINR(collection)}      sub="Semester total" color={C.blue}   trend={{ val:"+5%",  up:true }} />
        <KpiCard icon={<RefreshCw size={18} />}   label="Refunds"         value={fmtINR(refunds)}         sub="Processed"      color={C.red}    trend={{ val:"+12%", up:false }} />
        <KpiCard icon={<TrendingUp size={18} />}  label="Net Revenue"     value={fmtINR(netRevenue)} sub="After refunds" color={C.teal} trend={{ val:"+5%", up:true }} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ChartWrap title="Semester-wise Collection & Refunds" sub="₹ in Lakhs">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={semCollData} barGap={4} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="sem" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}L`} />
                <Tooltip formatter={(v:number)=>`₹${v}L`} contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="collection" fill={C.blue}   radius={[5,5,0,0]} name="Collection" maxBarSize={36} />
                <Bar dataKey="refund"     fill={C.orange}  radius={[5,5,0,0]} name="Refund"     maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </div>
        <div className="lg:col-span-2">
          <ChartWrap title="Students by Hostel">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={hostelStudData} layout="vertical" margin={{ top:4, right:4, left:60, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} width={64} />
                <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
                <Bar dataKey="students" fill={C.teal} radius={[0,5,5,0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartWrap title="Monthly Leave Trends" sub="2026">
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={monthlyData} margin={{ top:4, right:4, left:-12, bottom:0 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
              <Area type="monotone" dataKey="leaves" stroke={C.teal} strokeWidth={2.5} fill="url(#tealGrad)" name="Applications" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrap>
        <ChartWrap title="Revenue vs Refund" sub="Spring 2026">
          <ResponsiveContainer width="100%" height={185}>
            <PieChart>
              <Pie data={[{ name:"Net Revenue", value:collection-refunds }, { name:"Refunds", value:refunds }]}
                cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" paddingAngle={4}>
                <Cell fill={C.blue} /><Cell fill={C.orange} />
              </Pie>
              <Tooltip formatter={(v:number) => fmtINR(v)} contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrap>
        <ChartWrap title="Spring vs Autumn" sub="₹ Lakhs">
          <ResponsiveContainer width="100%" height={185}>
            <LineChart data={springAutumn} margin={{ top:4, right:4, left:-12, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}L`} />
              <Tooltip formatter={(v:number)=>`₹${v}L`} contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              <Line type="monotone" dataKey="spring" stroke={C.blue} strokeWidth={2.5} dot={{ r:3, fill:C.blue  }} name="Spring" connectNulls />
              <Line type="monotone" dataKey="autumn" stroke={C.teal} strokeWidth={2.5} dot={{ r:3, fill:C.teal  }} name="Autumn" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrap>
      </div>

      {/* Activity table */}
      <Card>
        <CardHeader title="Recent Leave Activity" sub={`${filteredLeaves.length} records`}
          actions={<SearchBar value={search} onChange={v => { setSearch(v); setPg(0); }} placeholder="Search…" className="w-44 sm:w-52" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                {["Roll No","Student","Hostel","Leave","Return","Refund"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedLeaves.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color:C.muted }}>No records</td></tr>
                : pagedLeaves.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: i < pagedLeaves.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color:C.blue }}>{r.rollNo}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color:C.text }}>{r.studentName}</td>
                    <td className="px-4 py-3 text-sm" style={{ color:C.muted }}>{r.hostel}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color:C.textSub }}>{r.leaveStart}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color:C.textSub }}>{r.leaveEnd}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color:C.teal }}>{fmtINR(r.refundAmount)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderTop:`1px solid ${C.border}` }}>
          <span className="text-xs" style={{ color:C.muted }}>
            {Math.min(pg*PER+1, filteredLeaves.length)}–{Math.min((pg+1)*PER, filteredLeaves.length)} of {filteredLeaves.length}
          </span>
          <Pagination page={pg} total={filteredLeaves.length} perPage={PER} onChange={setPg} />
        </div>
      </Card>
    </div>
  );
}

// ─── BULK CSV MODALS ──────────────────────────────────────────────────────────
function BulkAddModal({ open, onClose, onImport }: {
  open: boolean; onClose: () => void; onImport: (rows: Student[]) => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors,  setErrors]  = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = (text: string) => {
    setCsvText(text);
    const rows = parseCSV(text);
    const errs: string[] = [];
    rows.forEach((r, i) => {
      if (!r.rollNo) errs.push(`Row ${i+2}: missing rollNo`);
      else if (!r.name) errs.push(`Row ${i+2}: missing name`);
    });
    setPreview(rows);
    setErrors(errs);
  };

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = e => parse(String(e.target?.result ?? ""));
    reader.readAsText(f);
  };

  const handleImport = () => {
    const students: any[] = preview
      .filter(r => r.rollNo && r.name)
      .map(r => ({
        rollNo: r.rollNo.toUpperCase(), name: r.name,
        gender: (r.gender === "F" ? "F" : "M") as "M" | "F",
        dept: r.dept || "CS", hostel: r.hostel || "Girls Hostel", room: r.room || "A-101",
        year: r.year || "2024-28", semester: r.semester || "Spring 2026",
        messFee: Number(r.messFee) || 25000,
        amountPaid: r.amountPaid ? (Number(r.amountPaid) ?? 0) : (Number(r.messFee) || 25000),
        email: r.email || `${r.rollNo.trim().toLowerCase()}@nitm.ac.in`,
        phone: r.phone || "",
        dob: r.dob || "2003-06-15",
        status: "Active"
      }));
    onImport(students as Student[]);
    setCsvText(""); setPreview([]); setErrors([]);
    onClose();
  };

  const reset = () => { setCsvText(""); setPreview([]); setErrors([]); onClose(); };
  const valid = preview.filter(r => r.rollNo && r.name).length;

  return (
    <Modal open={open} onClose={reset} title="Bulk Import Students (CSV)" width="max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" size="sm" icon={<Download size={13}/>} onClick={() => downloadText(CSV_TEMPLATE, "template.csv")}>Download Template</Btn>
          <Btn variant="teal" size="sm" icon={<Upload size={13}/>} onClick={() => fileRef.current?.click()}>Upload CSV</Btn>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color:C.muted }}>Paste CSV Data</label>
          <textarea value={csvText} onChange={e => parse(e.target.value)} rows={5}
            placeholder={CSV_TEMPLATE}
            className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none resize-none"
            style={{ background:"#F1F5F9", border:"1.5px solid transparent", color:C.text }} />
        </div>
        {errors.length > 0 && (
          <div className="rounded-xl p-3" style={{ background:C.redLight }}>
            <p className="text-xs font-bold mb-1" style={{ color:C.red }}>Errors ({errors.length})</p>
            {errors.map((e, i) => <p key={i} className="text-xs" style={{ color:C.red }}>• {e}</p>)}
          </div>
        )}
        {preview.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color:C.muted }}>{preview.length} rows · {valid} valid</p>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor:C.border }}>
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                    {["rollNo","name","gender","dept","hostel","room","messFee","amountPaid"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color:C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((r, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background:!r.rollNo||!r.name ? C.redLight : "" }}>
                      {["rollNo","name","gender","dept","hostel","room","messFee","amountPaid"].map(k => (
                        <td key={k} className="px-3 py-2" style={{ color:C.text }}>{r[k] || <span style={{ color:C.red }}>—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 8 && <p className="text-xs mt-1" style={{ color:C.muted }}>+{preview.length-8} more rows</p>}
          </div>
        )}
        <div className="flex gap-2 pt-2" style={{ borderTop:`1px solid ${C.border}` }}>
          <Btn variant="primary" icon={<Check size={14}/>} disabled={valid === 0} onClick={handleImport}>Import {valid} Students</Btn>
          <Btn variant="ghost" onClick={reset}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );
}

function BulkDeleteModal({ open, onClose, students, onDelete }: {
  open: boolean; onClose: () => void; students: Student[]; onDelete: (rolls: string[]) => void;
}) {
  const [text, setText]       = useState("");
  const [preview, setPreview] = useState<{ roll: string; found: boolean; name?: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = (raw: string) => {
    setText(raw);
    const rolls = raw.split(/[\n,]/).map(r => r.trim().toUpperCase()).filter(Boolean);
    setPreview(rolls.map(roll => {
      const s = students.find(s => s.rollNo === roll);
      return { roll, found: !!s, name: s?.name };
    }));
  };

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = String(e.target?.result ?? "");
      const rows = parseCSV(content);
      if (rows.length > 0 && rows[0].rollNo) parse(rows.map(r => r.rollNo).join("\n"));
      else parse(content);
    };
    reader.readAsText(f);
  };

  const toDelete = preview.filter(p => p.found);
  const reset = () => { setText(""); setPreview([]); onClose(); };

  return (
    <Modal open={open} onClose={reset} title="Bulk Delete Students (CSV)" width="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl p-3.5" style={{ background:C.redLight }}>
          <div className="flex gap-2 items-start">
            <AlertTriangle size={14} style={{ color:C.red, flexShrink:0, marginTop:1 }} />
            <p className="text-xs" style={{ color:C.red }}>Permanently removes selected students. This cannot be undone.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" size="sm" icon={<Upload size={13}/>} onClick={() => fileRef.current?.click()}>Upload CSV</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={13}/>}
            onClick={() => downloadText(students.map(s => s.rollNo).join("\n"), "roll_numbers.csv")}>
            Export Roll Numbers
          </Btn>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color:C.muted }}>
            Roll Numbers (one per line or comma-separated)
          </label>
          <textarea value={text} onChange={e => parse(e.target.value)} rows={5}
            placeholder={"B22ME001\nB22CS042\nB23EC015"}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none resize-none"
            style={{ background:"#F1F5F9", border:"1.5px solid transparent", color:C.text }} />
        </div>
        {preview.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor:C.border }}>
            {preview.map((p, i) => (
              <div key={p.roll} className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: i < preview.length-1 ? `1px solid ${C.border}` : "none", background: p.found ? "#fff" : C.redLight+"70" }}>
                {p.found ? <CheckCircle size={14} style={{ color:C.green, flexShrink:0 }} /> : <XCircle size={14} style={{ color:C.red, flexShrink:0 }} />}
                <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: p.found ? C.blue : C.muted }}>{p.roll}</span>
                <span className="text-sm flex-1" style={{ color: p.found ? C.text : C.muted }}>{p.found ? p.name : "Not found"}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2" style={{ borderTop:`1px solid ${C.border}` }}>
          <Btn variant="danger" icon={<Trash2 size={14}/>} disabled={toDelete.length === 0}
            onClick={() => { onDelete(toDelete.map(p => p.roll)); reset(); }}>
            Delete {toDelete.length} Student{toDelete.length !== 1 ? "s" : ""}
          </Btn>
          <Btn variant="ghost" onClick={reset}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── PAGE: STUDENTS ───────────────────────────────────────────────────────────
function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [hostelF, setHostelF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [addOpen,  setAddOpen]  = useState(false);
  const [bulkAdd,  setBulkAdd]  = useState(false);
  const [bulkDel,  setBulkDel]  = useState(false);
  const [viewStu,  setViewStu]  = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pg, setPg] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const PER = 8;

  const { data: hostels = [] } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => settingsApi.getHostels().then(res => res.hostels),
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', hostelF, statusF, search],
    queryFn: () => studentsApi.getAll({ search, hostel: hostelF, status: statusF }).then(res => res.students),
  });

  const blank = { rollNo:"", name:"", gender:"M" as "M"|"F", dept:"CS", hostel: hostels[0] || "Girls Hostel", room:"", year:"2024-28", semester:"Spring 2026", messFee:25000, amountPaid:25000, status:"Active" as "Active"|"Inactive"|"On Leave", email:"", phone:"", dob:"2003-06-15" };
  const [form, setForm] = useState(blank);
  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 3000); };
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (!editingStudent) {
        if (k === "rollNo") {
          next.rollNo = val.toUpperCase();
          next.email = val.trim() ? `${val.trim().toLowerCase()}@nitm.ac.in` : "";
        }
        if (k === "messFee") {
          next.amountPaid = Number(val) || 0;
        }
      }
      return next;
    });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newStu: any) => studentsApi.create(newStu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleCloseAddModal();
      toast("Student added!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to add student");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ rollNo, data }: { rollNo: string; data: any }) => studentsApi.update(rollNo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleCloseAddModal();
      toast("Student updated!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update student");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (roll: string) => studentsApi.delete(roll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast("Student removed.");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to remove student");
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (list: any[]) => studentsApi.bulkImport(list),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast(res.message || "Import successful!");
    },
    onError: (err: any) => {
      toast(err.message || "Bulk import failed");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (rolls: string[]) => studentsApi.bulkDelete(rolls),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast(res.message || "Deletion successful!");
    },
    onError: (err: any) => {
      toast(err.message || "Bulk deletion failed");
    }
  });

  const handleCloseAddModal = () => {
    setAddOpen(false);
    setEditingStudent(null);
    setForm(blank);
  };

  const handleEditClick = (s: Student) => {
    setEditingStudent(s);
    setForm({
      rollNo: s.rollNo,
      name: s.name,
      gender: s.gender,
      dept: s.dept,
      hostel: s.hostel,
      room: s.room,
      year: s.year,
      semester: s.semester,
      messFee: s.messFee,
      amountPaid: s.amountPaid,
      status: s.status,
      email: s.email || "",
      phone: s.phone || "",
      dob: s.dob || "2003-06-15",
    });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!form.rollNo.trim() || !form.name.trim()) { toast("Roll number and name required"); return; }
    const payload = {
      ...form,
      messFee: Number(form.messFee),
      amountPaid: Number(form.amountPaid)
    };
    if (editingStudent) {
      updateMutation.mutate({ rollNo: editingStudent.rollNo, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleBulkImport = (newRows: Student[]) => {
    bulkImportMutation.mutate(newRows);
  };

  const handleDelete = (rollNo: string) => {
    if (!confirm(`Remove ${rollNo}?`)) return;
    deleteMutation.mutate(rollNo);
  };

  const handleBulkDelete = (rolls: string[]) => {
    bulkDeleteMutation.mutate(rolls);
  };

  const filtered = students;
  const rows = filtered.slice(pg * PER, (pg + 1) * PER);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {toastMsg && <Toast msg={toastMsg} />}
      <BulkAddModal    open={bulkAdd} onClose={() => setBulkAdd(false)} onImport={handleBulkImport} />
      <BulkDeleteModal open={bulkDel} onClose={() => setBulkDel(false)} students={students} onDelete={handleBulkDelete} />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPg(0); }} placeholder="Search roll no, name, dept…" className="flex-1 min-w-36" />
        <FSelect value={hostelF} onChange={e => { setHostelF(e.target.value); setPg(0); }} style={{ width:148 }}>
          <option value="All">All Hostels</option>{hostels.map(h => <option key={h}>{h}</option>)}
        </FSelect>
        <FSelect value={statusF} onChange={e => { setStatusF(e.target.value); setPg(0); }} style={{ width:130 }}>
          <option value="All">All Status</option>
          <option>Active</option><option>Inactive</option><option>On Leave</option>
        </FSelect>
        <Btn variant="primary"   icon={<Plus size={14}/>}     onClick={() => { setEditingStudent(null); setForm(blank); setAddOpen(true); }}>Add</Btn>
        <Btn variant="teal"      icon={<Upload size={14}/>}   onClick={() => setBulkAdd(true)}>Import CSV</Btn>
        <Btn variant="secondary" icon={<Download size={14}/>} onClick={() => downloadText(generateStudentCSV(students), "students.csv")}>Export CSV</Btn>
        <Btn variant="danger"    icon={<Trash2 size={14}/>}   onClick={() => setBulkDel(true)}>Delete CSV</Btn>
      </div>

      {/* Stats chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { l:"Total",    v:students.length,                                          c:C.blue,   bg:C.blueLight },
          { l:"Active",   v:students.filter(s=>s.status==="Active").length,           c:C.green,  bg:C.greenLight },
          { l:"On Leave", v:students.filter(s=>s.status==="On Leave").length,         c:C.orange, bg:C.orangeLight },
          { l:"Inactive", v:students.filter(s=>s.status==="Inactive").length,         c:C.muted,  bg:"#F1F5F9" },
        ].map(p => (
          <div key={p.l} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{ background:p.bg, color:p.c }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:p.c }} />{p.l}: {p.v}
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                  {["Roll No","Name","Dept","Hostel","Room","Amount Paid","Refund","Status","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={9} className="text-center py-14">
                      <div className="flex flex-col items-center gap-2" style={{ color:C.muted, opacity:.4 }}>
                        <Users size={32}/><span className="text-sm">No students found</span>
                      </div>
                    </td></tr>
                  : rows.map((s, i) => (
                    <tr key={s.rollNo} className="hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: i < rows.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color:C.blue }}>{s.rollNo}</td>
                      <td className="px-4 py-3"><div className="text-sm font-semibold" style={{ color:C.text }}>{s.name}</div><div className="text-xs" style={{ color:C.muted }}>{s.email}</div></td>
                      <td className="px-4 py-3 text-sm" style={{ color:C.muted }}>{s.dept}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:C.textSub }}>{s.hostel}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color:C.muted }}>{s.room}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color:C.text }}>{fmtINR(s.amountPaid)}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color:C.teal }}>{fmtINR(s.refundEarned)}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewStu(s)} title="View" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50" style={{ color:C.blue }}><Eye size={14}/></button>
                          <button onClick={() => handleEditClick(s)} title="Edit"   className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-teal-50"  style={{ color:C.teal }}><Edit3 size={14}/></button>
                          <button onClick={() => handleDelete(s.rollNo)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50" style={{ color:C.red }}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5" style={{ borderTop:`1px solid ${C.border}` }}>
          <span className="text-xs" style={{ color:C.muted }}>{filtered.length} students · {Math.min(pg*PER+1,filtered.length)}–{Math.min((pg+1)*PER,filtered.length)}</span>
          <Pagination page={pg} total={filtered.length} perPage={PER} onChange={setPg} />
        </div>
      </Card>

      {/* View modal */}
      <Modal open={!!viewStu} onClose={() => setViewStu(null)} title={`Student — ${viewStu?.rollNo}`}>
        {viewStu && (
          <div className="grid grid-cols-2 gap-3">
            {([["Roll No",viewStu.rollNo],["Name",viewStu.name],["Dept",viewStu.dept],["Gender",viewStu.gender==="M"?"Male":"Female"],
              ["Hostel",viewStu.hostel],["Room",viewStu.room],["Year",viewStu.year],["Semester",viewStu.semester],
              ["Email",viewStu.email],["Phone",viewStu.phone],["Mess Fee",fmtINR(viewStu.messFee)],["Paid",fmtINR(viewStu.amountPaid)],
              ["Refund",fmtINR(viewStu.refundEarned)],["Net",fmtINR(viewStu.amountPaid-viewStu.refundEarned)],
            ] as [string,string][]).map(([k,v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background:"#F8FAFC" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color:C.muted }}>{k}</div>
                <div className="text-sm font-bold" style={{ color:C.text }}>{v}</div>
              </div>
            ))}
            <div className="col-span-2 pt-1" style={{ borderTop:`1px solid ${C.border}` }}>
              <StatusBadge status={viewStu.status} />
            </div>
          </div>
        )}
      </Modal>

      {/* Add modal */}
      <Modal open={addOpen} onClose={handleCloseAddModal} title={editingStudent ? "Edit Student" : "Add New Student"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Roll Number" required><FInput value={form.rollNo} onChange={f("rollNo")} placeholder="e.g. B24CS022" disabled={!!editingStudent} /></Field>
          <Field label="Name"        required><FInput value={form.name}   onChange={f("name")}   placeholder="Full name" /></Field>
          <Field label="Department"><FSelect value={form.dept}    onChange={f("dept")}>{DEPTS.map(d => <option key={d}>{d}</option>)}</FSelect></Field>
          <Field label="Gender">    <FSelect value={form.gender}  onChange={f("gender")}><option value="M">Male</option><option value="F">Female</option></FSelect></Field>
          <Field label="Hostel">    <FSelect value={form.hostel}  onChange={f("hostel")}>{hostels.map(h => <option key={h}>{h}</option>)}</FSelect></Field>
          <Field label="Room">      <FInput value={form.room}     onChange={f("room")}     placeholder="A-101" /></Field>
          <Field label="Year">      <FSelect value={form.year}    onChange={f("year")}>   {["2021-25","2022-26","2023-27","2024-28"].map(y => <option key={y}>{y}</option>)}</FSelect></Field>
          <Field label="Semester">  <FSelect value={form.semester} onChange={f("semester")}><option>Spring 2026</option><option>Autumn 2026</option></FSelect></Field>
          <Field label="Email">     <FInput value={form.email}    onChange={f("email")}    placeholder="student@nitm.ac.in" type="email" /></Field>
          <Field label="Phone">     <FInput value={form.phone}    onChange={f("phone")}    placeholder="10-digit" /></Field>
          <Field label="Date of Birth" required><FInput value={form.dob} onChange={f("dob")} type="date" /></Field>
          <Field label="Mess Fee">  <FInput value={form.messFee}  onChange={f("messFee")}  type="number" /></Field>
          <Field label="Paid (₹)">  <FInput value={form.amountPaid} onChange={f("amountPaid")} type="number" /></Field>
          <Field label="Status">    <FSelect value={form.status}  onChange={f("status")}>  <option>Active</option><option>Inactive</option><option>On Leave</option></FSelect></Field>
        </div>
        <div className="flex gap-2 mt-5 pt-4" style={{ borderTop:`1px solid ${C.border}` }}>
          <Btn variant="primary" icon={<Check size={14}/>}      onClick={handleSave}>Save Student</Btn>
          <Btn variant="ghost"   icon={<RefreshCw size={13}/>}  onClick={() => setForm(blank)}>Reset</Btn>
          <Btn variant="ghost"   icon={<X size={13}/>}          onClick={handleCloseAddModal}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── PAGE: LEAVE ──────────────────────────────────────────────────────────────
function LeavePage() {
  const queryClient = useQueryClient();
  const [rollQ,      setRollQ]      = useState("");
  const [found,      setFound]      = useState<Student | null>(null);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd,   setLeaveEnd]   = useState("");
  const [reason,     setReason]     = useState("");
  const [sem,        setSem]        = useState("Spring 2026");
  const [search,     setSearch]     = useState("");
  const [toastMsg,   setToastMsg]   = useState("");
  const [editingLeave, setEditingLeave] = useState<any | null>(null);
  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 3000); };

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings().then(res => res.settings),
  });

  const bfRate = settings?.bf || 30;
  const luRate = settings?.lu || 65;
  const diRate = settings?.di || 65;

  const calc = useMemo(() => {
    if (!leaveStart || !leaveEnd) return null;
    const d = daysBetween(leaveStart, leaveEnd);
    if (d <= 0) return null;
    const bf = d, lu = d, di = Math.max(0, d - 1);
    return { d, bf, lu, di, total: bf*bfRate + lu*luRate + di*diRate };
  }, [leaveStart, leaveEnd, bfRate, luRate, diRate]);

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', search],
    queryFn: () => leavesApi.getAll(search).then(res => res.leaves),
  });

  const createLeaveMutation = useMutation({
    mutationFn: (newLeave: any) => leavesApi.create(newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      toast("Leave submitted!");
      setRollQ(""); setFound(null); setLeaveStart(""); setLeaveEnd(""); setReason("");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to submit leave");
    }
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leavesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      toast("Leave updated!");
      handleCancelEdit();
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update leave");
    }
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (id: string) => leavesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      toast("Deleted.");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to delete leave");
    }
  });

  const handleSearch = async () => {
    if (!rollQ.trim()) return;
    try {
      const res = await studentsApi.getByRollNo(rollQ.toUpperCase().trim());
      if (res.success && res.student) {
        setFound(res.student);
      } else {
        setFound(null);
        toast("Student not found");
      }
    } catch {
      setFound(null);
      toast("Student not found");
    }
  };

  const handleEditClick = (r: any) => {
    setEditingLeave(r);
    setRollQ(r.rollNo);
    setFound({
      rollNo: r.rollNo,
      name: r.studentName,
      hostel: r.hostel,
      gender: "M", dept: "", room: "", year: "", semester: r.semester, messFee: 0, amountPaid: 0, refundEarned: 0, status: "Active", email: "", phone: ""
    });
    setLeaveStart(r.leaveStart);
    setLeaveEnd(r.leaveEnd);
    setReason(r.reason);
    setSem(r.semester);
  };

  const handleCancelEdit = () => {
    setEditingLeave(null);
    setRollQ("");
    setFound(null);
    setLeaveStart("");
    setLeaveEnd("");
    setReason("");
    setSem("Spring 2026");
  };

  const handleSubmit = () => {
    if (!found || !leaveStart || !leaveEnd || !calc) { toast("Fill all required fields"); return; }
    if (editingLeave) {
      updateLeaveMutation.mutate({
        id: editingLeave.id,
        data: {
          leaveStart,
          leaveEnd,
          reason,
          semester: sem
        }
      });
    } else {
      createLeaveMutation.mutate({
        rollNo: found.rollNo,
        leaveStart,
        leaveEnd,
        reason,
        semester: sem
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete?")) return;
    deleteLeaveMutation.mutate(id);
  };

  const filtered = leaves;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {toastMsg && <Toast msg={toastMsg} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <Card>
          <CardHeader title={editingLeave ? "Edit Leave Application" : "New Leave Application"} />
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <Field label="Roll Number Search" required>
              <div className="flex gap-2">
                <FInput value={rollQ} onChange={e => setRollQ(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleSearch()}
                  placeholder="Enter roll number…" className="flex-1" disabled={!!editingLeave} />
                <Btn variant="primary" onClick={handleSearch} disabled={!!editingLeave}><Search size={14}/></Btn>
              </div>
            </Field>
            {found && (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background:C.greenLight, border:`1px solid ${C.green}30` }}>
                <CheckCircle size={15} style={{ color:C.green, flexShrink:0 }} />
                <div>
                  <div className="text-sm font-bold" style={{ color:C.text }}>{found.name}</div>
                  <div className="text-xs" style={{ color:C.muted }}>{found.hostel} · Room {found.room}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Student Name"><FInput value={found?.name ?? ""} readOnly placeholder="Auto-filled" /></Field>
              <Field label="Hostel">     <FInput value={found?.hostel ?? ""} readOnly placeholder="Auto-filled" /></Field>
            </div>
            <Field label="Semester">
              <FSelect value={sem} onChange={e => setSem(e.target.value)}>
                <option>Spring 2026</option><option>Autumn 2026</option>
              </FSelect>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Leave Start" required><FInput type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} /></Field>
              <Field label="Leave End"   required><FInput type="date" value={leaveEnd}   onChange={e => setLeaveEnd(e.target.value)} /></Field>
            </div>
            <Field label="Reason">
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Vacation (default if empty)" rows={2}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ background:"#F1F5F9", border:"1.5px solid transparent", color:C.text }} />
            </Field>
            {editingLeave ? (
              <div className="flex gap-2">
                <Btn variant="primary" size="lg" icon={<Check size={14}/>} onClick={handleSubmit} className="flex-1">Save Changes</Btn>
                <Btn variant="ghost" size="lg" icon={<X size={14}/>} onClick={handleCancelEdit}>Cancel</Btn>
              </div>
            ) : (
              <Btn variant="primary" size="lg" icon={<Plus size={14}/>} onClick={handleSubmit}>Submit Application</Btn>
            )}
          </div>
        </Card>

        {/* Calculator */}
        <Card>
          <CardHeader title="Auto Refund Calculator" />
          <div className="p-4 sm:p-5">
            {calc ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl p-4" style={{ background:`linear-gradient(135deg,${C.blue},${C.blueMid})` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">Duration</div>
                      <div className="text-4xl font-bold text-white mt-1">{calc.d}</div>
                      <div className="text-sm text-white/60">days</div>
                    </div>
                    <div className="text-right text-xs text-white/50">{leaveStart}<div className="my-1">→</div>{leaveEnd}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { e:"☀️", l:"Breakfast", n:calc.bf, r:bfRate, c:C.orange, bg:C.orangeLight },
                    { e:"🌤️", l:"Lunch",     n:calc.lu, r:luRate, c:C.teal,   bg:C.tealLight   },
                    { e:"🌙", l:"Dinner",    n:calc.di, r:diRate, c:C.blue,   bg:C.blueLight   },
                  ].map(m => (
                    <div key={m.l} className="rounded-xl p-3 text-center" style={{ background:m.bg }}>
                      <div className="text-lg">{m.e}</div>
                      <div className="text-xl font-bold" style={{ color:m.c }}>{m.n}</div>
                      <div className="text-xs font-semibold" style={{ color:m.c }}>{m.l}</div>
                      <div className="text-xs" style={{ color:m.c, opacity:.6 }}>×₹{m.r}</div>
                      <div className="text-xs font-bold" style={{ color:m.c }}>{fmtINR(m.n*m.r)}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3" style={{ background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                  <code className="text-xs block" style={{ color:C.textSub }}>
                    ({calc.bf}×₹{bfRate}) + ({calc.lu}×₹{luRate}) + ({calc.di}×₹{diRate})
                  </code>
                </div>
                <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background:C.teal }}>
                  <div className="text-sm font-bold text-white">Total Refund</div>
                  <div className="text-2xl font-bold text-white">{fmtINR(calc.total)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color:C.muted }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:C.blueLight }}>
                  <CalendarDays size={26} style={{ color:C.blue }} />
                </div>
                <p className="text-sm text-center" style={{ color:C.muted }}>Enter leave dates to<br/>calculate refund automatically</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Leave records */}
      <Card>
        <CardHeader title="Leave Records" sub={`${filtered.length} applications`}
          actions={<SearchBar value={search} onChange={setSearch} placeholder="Search…" className="w-44 sm:w-52" />}
        />
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                  {["Roll No","Student","Hostel","Leave Start","Return","Days","BF","LU","DI","Refund","Actions"].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={11} className="text-center py-10 text-sm" style={{ color:C.muted }}>No leave records</td></tr>
                  : filtered.map((r, i) => {
                    const d = daysBetween(r.leaveStart, r.leaveEnd);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors"
                        style={{ borderBottom: i < filtered.length-1 ? `1px solid ${C.border}` : "none" }}>
                        <td className="px-3 py-3 text-sm font-mono font-bold" style={{ color:C.blue }}>{r.rollNo}</td>
                        <td className="px-3 py-3 text-sm font-medium" style={{ color:C.text }}>{r.studentName}</td>
                        <td className="px-3 py-3 text-xs" style={{ color:C.muted }}>{r.hostel}</td>
                        <td className="px-3 py-3 text-xs font-mono" style={{ color:C.textSub }}>{r.leaveStart}</td>
                        <td className="px-3 py-3 text-xs font-mono" style={{ color:C.textSub }}>{r.leaveEnd}</td>
                        <td className="px-3 py-3 text-sm font-bold text-center" style={{ color:C.text }}>{d}</td>
                        <td className="px-3 py-3 text-xs text-center" style={{ color:C.orange }}>{r.breakfastMissed}</td>
                        <td className="px-3 py-3 text-xs text-center" style={{ color:C.teal }}>{r.lunchMissed}</td>
                        <td className="px-3 py-3 text-xs text-center" style={{ color:C.blue }}>{r.dinnerMissed}</td>
                        <td className="px-3 py-3 text-sm font-bold" style={{ color:C.teal }}>{fmtINR(r.refundAmount)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => handleEditClick(r)} title="Edit"   className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-teal-50" style={{ color:C.teal }}><Edit3 size={13}/></button>
                            <button onClick={() => handleDelete(r.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50" style={{ color:C.red }}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          )}
        </div>
        <div className="flex flex-wrap gap-4 px-4 py-3.5" style={{ borderTop:`1px solid ${C.border}`, background:"#FAFBFC" }}>
          {[
            { l:"Total Refunds", v:fmtINR(filtered.reduce((a,l)=>a+l.refundAmount,0)), c:C.teal },
          ].map(s => (
            <div key={s.l} className="text-xs">
              <span style={{ color:C.muted }}>{s.l}: </span>
              <span className="font-bold" style={{ color:s.c }}>{s.v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── PAGE: RECORDS ────────────────────────────────────────────────────────────
function RecordsPage() {
  const [hostelF, setHostelF] = useState("All");
  const [semF,    setSemF]    = useState("All");
  const [search,  setSearch]  = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2500); };

  const { data: hostels = [] } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => settingsApi.getHostels().then(res => res.hostels),
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['records', hostelF, semF, search],
    queryFn: () => studentsApi.getAll({ hostel: hostelF, status: 'All', search }).then(res => res.students),
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: () => dashboardApi.getCharts().then(res => res.charts),
  });

  const filtered = students.filter(s => semF === "All" || s.semester === semF);

  const totalColl = filtered.reduce((a, s) => a + s.amountPaid, 0);
  const totalRef  = filtered.reduce((a, s) => a + s.refundEarned, 0);

  const hostelRefData = charts?.hostelRefData ?? [];
  const semCollData = charts?.semCollData ?? [];

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {toastMsg && <Toast msg={toastMsg} type="info" />}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <FSelect value={semF}    onChange={e => setSemF(e.target.value)}    style={{ width:160 }}>
            <option value="All">All Semesters</option>
            <option>Spring 2026</option><option>Autumn 2025</option>
          </FSelect>
          <FSelect value={hostelF} onChange={e => setHostelF(e.target.value)} style={{ width:160 }}>
            <option value="All">All Hostels</option>
            {hostels.map(h => <option key={h}>{h}</option>)}
          </FSelect>
          <SearchBar value={search} onChange={setSearch} className="flex-1 min-w-36" />
          <div className="flex flex-wrap gap-2 ml-auto">
            <Btn variant="secondary" size="sm" icon={<Download size={12}/>} onClick={() => { downloadText(generateStudentCSV(filtered), "records.csv"); toast("CSV exported!"); }}>CSV</Btn>
            <Btn variant="teal"      size="sm" icon={<FileSpreadsheet size={12}/>} onClick={() => toast("Exporting Excel…")}>Excel</Btn>
            <Btn variant="primary"   size="sm" icon={<Printer size={12}/>}         onClick={() => toast("Generating PDF…")}>PDF</Btn>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<IndianRupee size={18}/>} label="Total Collection" value={fmtINR(totalColl)} sub={`${filtered.length} students`} color={C.blue}   />
        <KpiCard icon={<RefreshCw  size={18}/>}  label="Total Refunds"    value={fmtINR(totalRef)}  sub="Processed"                     color={C.orange} />
        <KpiCard icon={<TrendingUp size={18}/>}  label="Net Revenue"      value={fmtINR(totalColl-totalRef)} sub="After refunds"         color={C.green}  />
        <KpiCard icon={<Users      size={18}/>}  label="Students Served"  value={String(filtered.length)} sub="In selection"             color={C.teal}   />
      </div>

      <Card>
        <CardHeader title={`Fee Records (${filtered.length})`} />
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
          ) : (
            <table className="w-full min-w-[620px]">
              <thead>
                <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                  {["Roll No","Student","Hostel","Semester","Mess Fee","Amount Paid","Refund","Net Consumed"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color:C.muted }}>No records</td></tr>
                  : filtered.map((s, i) => (
                    <tr key={s.rollNo} className="hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: i < filtered.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color:C.blue }}>{s.rollNo}</td>
                      <td className="px-4 py-3"><div className="text-sm font-semibold" style={{ color:C.text }}>{s.name}</div><div className="text-xs" style={{ color:C.muted }}>{s.dept}</div></td>
                      <td className="px-4 py-3 text-sm" style={{ color:C.muted }}>{s.hostel}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:C.muted }}>{s.semester}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:C.text }}>{fmtINR(s.messFee)}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color:C.text }}>{fmtINR(s.amountPaid)}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color:C.orange }}>{fmtINR(s.refundEarned)}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color:C.blue }}>{fmtINR(s.amountPaid-s.refundEarned)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartWrap title="Hostel-wise Refund Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hostelRefData} margin={{ top:4, right:4, left:-8, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v:number) => fmtINR(v)} contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
              <Bar dataKey="refund" fill={C.orange} radius={[5,5,0,0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrap>
        <ChartWrap title="Semester-wise Revenue">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={semCollData} margin={{ top:4, right:4, left:-8, bottom:0 }}>
              <defs>
                <linearGradient id="rvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="sem" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}L`} />
              <Tooltip formatter={(v:number) => `₹${v}L`} contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:11 }} />
              <Area type="monotone" dataKey="collection" stroke={C.blue} strokeWidth={2.5} fill="url(#rvGrad)" name="Collection" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrap>
      </div>
    </div>
  );
}

// ─── PAGE: SETTINGS ───────────────────────────────────────────────────────────
function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab]           = useState<"semester"|"fees"|"hostels">("semester");
  const [newHostel, setNewHostel] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2500); };

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings().then(res => res.settings),
  });

  const { data: hostels = [] } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => settingsApi.getHostels().then(res => res.hostels),
  });

  const [messFee, setMessFee]   = useState(25000);
  const [bf, setBf]             = useState(30);
  const [lu, setLu]             = useState(65);
  const [di, setDi]             = useState(65);

  useEffect(() => {
    if (settings) {
      setMessFee(settings.messFee);
      setBf(settings.bf);
      setLu(settings.lu);
      setDi(settings.di);
    }
  }, [settings]);

  const updateFeesMutation = useMutation({
    mutationFn: (fee: number) => settingsApi.updateFees(fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast("Saved!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update fees");
    }
  });

  const updateMealsMutation = useMutation({
    mutationFn: (rates: { bf: number; lu: number; di: number }) => 
      settingsApi.updateMeals(rates.bf, rates.lu, rates.di),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast("Meal prices saved!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update meal rates");
    }
  });

  const createHostelMutation = useMutation({
    mutationFn: (name: string) => settingsApi.createHostel(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      setNewHostel("");
      toast("Hostel added!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to add hostel");
    }
  });

  const deleteHostelMutation = useMutation({
    mutationFn: (name: string) => settingsApi.deleteHostel(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      toast("Removed.");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to remove hostel");
    }
  });

  const handleSaveFees = () => {
    updateFeesMutation.mutate(messFee);
  };

  const handleSaveMeals = () => {
    updateMealsMutation.mutate({ bf, lu, di });
  };

  const handleAddHostel = () => {
    if (!newHostel.trim()) return;
    createHostelMutation.mutate(newHostel.trim());
  };

  const handleDeleteHostel = (name: string) => {
    if (confirm(`Remove "${name}"?`)) {
      deleteHostelMutation.mutate(name);
    }
  };

  const TABS = [
    { id:"semester"as const, l:"Semester", icon:<BookOpen size={14}/> },
    { id:"fees"    as const, l:"Fees",     icon:<IndianRupee size={14}/> },
    { id:"hostels" as const, l:"Hostels",  icon:<Building2 size={14}/> },
  ];

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {toastMsg && <Toast msg={toastMsg} />}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ background:C.card, border:`1px solid ${C.border}`, width:"fit-content", maxWidth:"100%", boxShadow:C.shadow }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
            style={{ background:tab===t.id?C.blue:"transparent", color:tab===t.id?"#fff":C.muted }}>
            {t.icon}{t.l}
          </button>
        ))}
      </div>

      {tab === "semester" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Active Semesters" />
            <div className="p-5 flex flex-col gap-3">
              {[{s:"Spring 2026",active:true,range:"Jan–Jun 2026",n:430},{s:"Autumn 2026",active:false,range:"Jul–Dec 2026",n:0},{s:"Autumn 2025",active:false,range:"Jul–Dec 2025",n:418}].map(s => (
                <div key={s.s} className="flex items-center gap-3 rounded-xl p-4"
                  style={{ background:s.active?C.blueLight:"#F8FAFC", border:`1px solid ${s.active?C.blue+"30":C.border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background:s.active?C.blue:"#CBD5E1", color:s.active?"#fff":"#64748B" }}>
                    {s.s.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color:C.text }}>{s.s}</div>
                    <div className="text-xs" style={{ color:C.muted }}>{s.range} · {s.n} students</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.active && <StatusBadge status="Active" />}
                    <Btn variant="ghost" size="sm" onClick={() => toast(`${s.s} ${s.active?"archived":"restored"}`)}>{s.active?"Archive":"Restore"}</Btn>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <FInput placeholder="New semester (e.g. Spring 2027)" className="flex-1" value="" readOnly />
                <Btn variant="primary" icon={<Plus size={14}/>} onClick={() => toast("Semester created!")} disabled>Create</Btn>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Semester Timeline" />
            <div className="p-5 relative ml-4 flex flex-col gap-4">
              {[
                {s:"Spring 2026",c:C.blue, active:true},
                {s:"Autumn 2025",c:C.green},
                {s:"Spring 2025",c:C.green},
                {s:"Autumn 2024",c:C.muted},
              ].map((s, i) => (
                <div key={s.s} className="flex gap-4 items-start relative">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5 z-10" style={{ background:s.c, boxShadow:s.active?`0 0 0 4px ${C.blue}20`:"" }} />
                  {i < 3 && <div className="absolute left-[5.5px] top-4 w-0.5" style={{ bottom:"-16px", background:C.border }} />}
                  <div className="flex-1 rounded-xl p-3.5" style={{ background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color:C.text }}>{s.s}</span>
                      <StatusBadge status={s.active?"Active":"Inactive"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "fees" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Semester Mess Fee" />
            <div className="p-5 flex flex-col gap-4">
              <Field label="Mess Fee per Semester (₹)">
                <FInput type="number" value={messFee} onChange={e => setMessFee(Number(e.target.value))} />
              </Field>
              <div className="rounded-xl p-3" style={{ background:C.blueLight }}>
                <div className="flex gap-2 items-start">
                  <Info size={13} style={{ color:C.blue, flexShrink:0, marginTop:1 }} />
                  <p className="text-xs" style={{ color:C.blue }}>Default ₹25,000. Changes apply to new records only.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Btn variant="primary" icon={<Check size={14}/>} onClick={handleSaveFees}>Save Changes</Btn>
                <Btn variant="ghost"   icon={<RefreshCw size={13}/>} onClick={() => { setMessFee(25000); toast("Reset to default."); }}>Restore Default</Btn>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Meal Pricing" />
            <div className="p-5 flex flex-col gap-4">
              {[
                { e:"☀️", l:"Breakfast", v:bf, s:setBf, c:C.orange, bg:C.orangeLight },
                { e:"🌤️", l:"Lunch",     v:lu, s:setLu, c:C.teal,   bg:C.tealLight   },
                { e:"🌙", l:"Dinner",    v:di, s:setDi, c:C.blue,   bg:C.blueLight   },
              ].map(m => (
                <div key={m.l} className="flex items-center gap-3 rounded-xl p-3.5" style={{ background:m.bg }}>
                  <div className="text-xl w-8 text-center">{m.e}</div>
                  <div className="flex-1"><div className="text-sm font-bold" style={{ color:m.c }}>{m.l}</div></div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold" style={{ color:m.c }}>₹</span>
                    <input type="number" value={m.v} onChange={e => m.s(Number(e.target.value))}
                      className="rounded-xl px-3 py-2 text-sm font-bold outline-none text-right"
                      style={{ width:72, background:"#fff", border:`1.5px solid ${m.c}30`, color:m.c }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <Btn variant="primary" icon={<Check size={14}/>} onClick={handleSaveMeals}>Save Changes</Btn>
                <Btn variant="ghost"   icon={<RefreshCw size={13}/>} onClick={() => { setBf(30); setLu(65); setDi(65); toast("Defaults restored."); }}>Restore Defaults</Btn>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "hostels" && (
        <Card>
          <CardHeader title="Hostel Management"
            actions={
              <div className="flex gap-2">
                <FInput value={newHostel} onChange={e => setNewHostel(e.target.value)} placeholder="Hostel name…" style={{ width:180 }} />
                <Btn variant="primary" icon={<Plus size={14}/>} onClick={handleAddHostel}>Add</Btn>
              </div>
            }
          />
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hostels.map(h => {
              return (
                <div key={h} className="rounded-xl p-4" style={{ background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background:C.blue }}>{h.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color:C.text }}>{h}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="danger" size="sm" icon={<Trash2 size={11}/>} onClick={() => handleDeleteHostel(h)}>Delete</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── PAGE: STUDENT PORTAL ─────────────────────────────────────────────────────
function PortalPage({ studentId }: { studentId: string }) {
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => studentsApi.getByRollNo(studentId).then(res => res.student),
  });

  const { data: myLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['studentLeaves', studentId],
    queryFn: () => leavesApi.getStudentLeaves(studentId).then(res => res.leaves),
  });

  if (studentLoading || leavesLoading) {
    return (
      <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-slate-500">
        Student profile not found.
      </div>
    );
  }

  const totalLeaveDays = myLeaves.reduce((a, l) => a + daysBetween(l.leaveStart, l.leaveEnd), 0);
  const netFee = student.amountPaid - student.refundEarned;
  const prevSems = [
    { s:"Autumn 2025", f:25000, p:25000, r:1820 },
    { s:"Spring 2025", f:25000, p:25000, r:980  },
    { s:"Autumn 2024", f:22000, p:22000, r:650  },
    { s:"Spring 2024", f:22000, p:22000, r:420  },
  ];
  const totalPrevRef = prevSems.reduce((a, s) => a + s.r, 0);
  const payPct    = Math.round((student.amountPaid  / student.messFee) * 100);
  const refundPct = Math.round((student.refundEarned / student.messFee) * 100);
  const netPct    = Math.round((netFee           / student.messFee) * 100);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      {/* Banner */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow:C.shadowMd }}>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background:`linear-gradient(135deg,${C.blue} 0%,#1565A8 60%,#0e7490 100%)` }}>
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex-shrink-0" style={{ boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
            <ImageWithFallback src={nitmLogo} alt="NITM" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"rgba(255,255,255,0.55)" }}>Student Portal — Read Only</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{student.name}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {[student.rollNo, student.dept, student.hostel, `Room ${student.room}`, student.year].map(v => (
                <span key={v} className="text-xs sm:text-sm" style={{ color:"rgba(255,255,255,0.7)" }}>{v}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{ background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.9)" }}>
            <Eye size={12}/>Read-Only
          </div>
        </div>
        <div className="grid grid-cols-3" style={{ background:C.blueDark }}>
          {[{l:"Academic Year",v:student.year},{l:"Semester",v:student.semester},{l:"Status",v:student.status}].map(s => (
            <div key={s.l} className="px-3 py-2.5 text-center" style={{ borderRight:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>{s.l}</div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l:"Total Refund",    v:fmtINR(student.refundEarned+totalPrevRef), icon:<RefreshCw size={18}/>,  c:C.orange, bg:C.orangeLight },
          { l:"Total Leave Days",v:`${totalLeaveDays} days`,              icon:<CalendarOff size={18}/>, c:C.teal,   bg:C.tealLight   },
          { l:"Current Refund",  v:fmtINR(student.refundEarned),             icon:<IndianRupee size={18}/>, c:C.green,  bg:C.greenLight  },
          { l:"Prev Semesters",  v:fmtINR(totalPrevRef),                 icon:<BookOpen size={18}/>,    c:C.blue,   bg:C.blueLight   },
        ].map(s => (
          <div key={s.l} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background:s.bg }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:s.c+"25", color:s.c }}>{s.icon}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color:s.c }}>{s.l}</div>
              <div className="text-base sm:text-lg font-bold" style={{ color:s.c }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fee card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Spring 2026 — Fee Summary" />
            <div className="p-4 sm:p-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { l:"Semester Fee",  v:fmtINR(student.messFee),      c:C.blue,   bg:C.blueLight   },
                  { l:"Amount Paid",   v:fmtINR(student.amountPaid),   c:C.green,  bg:C.greenLight  },
                  { l:"Refund Earned", v:fmtINR(student.refundEarned), c:C.orange, bg:C.orangeLight },
                  { l:"Net Consumed",  v:fmtINR(netFee),           c:C.teal,   bg:C.tealLight   },
                ].map(s => (
                  <div key={s.l} className="rounded-xl p-3 text-center" style={{ background:s.bg }}>
                    <div className="text-xs font-semibold mb-1" style={{ color:s.c, opacity:.75 }}>{s.l}</div>
                    <div className="text-base sm:text-lg font-bold" style={{ color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { l:"Payment Progress", pct:payPct,    c:C.blue,   sub:`${fmtINR(student.amountPaid)} of ${fmtINR(student.messFee)}` },
                  { l:"Refund Offset",    pct:refundPct, c:C.orange, sub:`${fmtINR(student.refundEarned)} refunded` },
                  { l:"Net Fee Ratio",    pct:netPct,    c:C.teal,   sub:`${fmtINR(netFee)} effectively consumed` },
                ].map(p => (
                  <div key={p.l}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color:C.textSub }}>{p.l}</span>
                      <span className="text-xs font-bold" style={{ color:p.c }}>{p.pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full" style={{ background:"#E8F0FA" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width:`${p.pct}%`, background:p.c }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color:C.muted }}>{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Leave summary */}
        <Card>
          <CardHeader title="Leave Summary" sub="Current semester" />
          <div className="p-4 flex flex-col gap-3">
            {myLeaves.length === 0
              ? <div className="py-10 flex flex-col items-center gap-2" style={{ color:C.muted, opacity:.4 }}><CalendarDays size={24}/><span className="text-sm">No leave</span></div>
              : myLeaves.map(l => {
                const d = daysBetween(l.leaveStart, l.leaveEnd);
                return (
                  <div key={l.id} className="rounded-xl p-3" style={{ background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold" style={{ color:C.text }}>{l.leaveStart} → {l.leaveEnd}</div>
                      <div className="text-sm font-bold" style={{ color:C.teal }}>{fmtINR(l.refundAmount)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs" style={{ color:C.muted }}>{d} days · {l.reason}</div>
                    </div>
                  </div>
                );
              })
            }
            {myLeaves.length > 0 && (
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background:C.tealLight }}>
                <span className="text-sm font-semibold" style={{ color:C.teal }}>Total</span>
                <span className="text-lg font-bold" style={{ color:C.teal }}>{fmtINR(myLeaves.reduce((a,l)=>a+l.refundAmount,0))}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Full leave history */}
      {myLeaves.length > 0 && (
        <Card>
          <CardHeader title="Full Leave History" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                  {["Leave Date","Return","Days","BF","LU","DI","Refund"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((l, i) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: i < myLeaves.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color:C.textSub }}>{l.leaveStart}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color:C.textSub }}>{l.leaveEnd}</td>
                    <td className="px-4 py-3 text-sm font-bold text-center" style={{ color:C.text }}>{daysBetween(l.leaveStart,l.leaveEnd)}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold" style={{ color:C.orange }}>{l.breakfastMissed}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold" style={{ color:C.teal   }}>{l.lunchMissed}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold" style={{ color:C.blue   }}>{l.dinnerMissed}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color:C.teal }}>{fmtINR(l.refundAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [auth,       setAuth]       = useState<{ role: AuthRole; id: string } | null>(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        return { role: u.role as AuthRole, id: u.username };
      } catch {
        return null;
      }
    }
    return null;
  });
  const [page,       setPage]       = useState<Page>("dashboard");
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync route on roles
  useEffect(() => {
    if (auth) {
      setPage(auth.role === 'student' ? 'portal' : 'dashboard');
    }
  }, [auth]);

  const handleLogin  = (role: AuthRole, id: string) => { setAuth({ role, id }); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
    setPage("dashboard");
    setMobileOpen(false);
  };

  const { data: students = [] } = useQuery({
    queryKey: ['students-lookup'],
    queryFn: () => studentsApi.getAll({}).then(res => res.students),
    enabled: !!auth,
  });

  if (!auth) return (
    <>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <LoginPage onLogin={handleLogin} />
    </>
  );

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(15,76,129,0.15); border-radius:8px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(15,76,129,0.3); }
      `}</style>
      <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: "'Inter',sans-serif" }}>
        {/* Hide sidebar entirely for student role on mobile since they only have one page */}
        {(auth.role === "admin" || !isMobile) && (
          <Sidebar
            page={page} setPage={setPage}
            collapsed={collapsed} setCollapsed={setCollapsed}
            mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
            onLogout={handleLogout} isMobile={isMobile}
            auth={auth}
            students={students}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <Topbar page={page} onMenuClick={() => setMobileOpen(true)} onLogout={handleLogout} auth={auth} students={students} />
          <main className="flex-1 overflow-y-auto">
            {page === "dashboard" && auth.role === "admin" && <DashboardPage />}
            {page === "students"  && auth.role === "admin" && <StudentsPage />}
            {page === "leave"     && auth.role === "admin" && <LeavePage />}
            {page === "records"   && auth.role === "admin" && <RecordsPage />}
            {page === "settings"  && auth.role === "admin" && <SettingsPage />}
            {page === "portal"    && <PortalPage studentId={auth.id} />}
          </main>
        </div>
      </div>
    </>
  );
}
