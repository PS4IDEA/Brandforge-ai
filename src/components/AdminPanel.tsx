import React, { useState } from 'react';
import { translations } from '../translations';
import { Language, UserProfile, UsageLog, SupportTicket } from '../types';
import { 
  ShieldCheck, Users, Coins, TrendingUp, AlertTriangle, 
  Activity, CheckCircle2, Check, RefreshCw, Star, Trash2,
  Mail, Eye, X
} from 'lucide-react';

interface AdminPanelProps {
  language: Language;
  users: UserProfile[];
  onAdjustCredits: (uid: string, credits: number) => void;
  onAdjustPlan: (uid: string, plan: 'free' | 'pro' | 'business') => void;
  systemLogs: UsageLog[];
  supportTickets: SupportTicket[];
  onResolveTicket: (id: string) => void;
  welcomeEmails?: any[];
  onSendTestEmail?: (email: string) => Promise<{ success: boolean; error?: string }>;
  currentUserEmail?: string;
}

export default function AdminPanel({
  language,
  users,
  onAdjustCredits,
  onAdjustPlan,
  systemLogs,
  supportTickets,
  onResolveTicket,
  welcomeEmails = [],
  onSendTestEmail,
  currentUserEmail = ''
}: AdminPanelProps) {
  const t = translations[language];

  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [creditAdjustment, setCreditAdjustment] = useState<number>(10);
  const [planAdjustment, setPlanAdjustment] = useState<'free' | 'pro' | 'business'>('pro');
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  // Preview state for automated email templates
  const [viewingEmail, setViewingEmail] = useState<any | null>(null);

  // Test Email state
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(currentUserEmail);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleOpenTestEmailModal = () => {
    setTestEmailRecipient(currentUserEmail);
    setTestEmailResult(null);
    setShowTestEmailModal(true);
  };

  const handleTriggerSendTest = async () => {
    if (!onSendTestEmail) return;
    if (!testEmailRecipient.trim()) {
      setTestEmailResult({ success: false, error: 'Please enter a valid recipient email address.' });
      return;
    }
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await onSendTestEmail(testEmailRecipient.trim());
      setTestEmailResult(res);
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err.message || String(err) });
    } finally {
      setTestEmailLoading(false);
    }
  };

  // Calculate mock analytics
  const totalUsers = users.length;
  const totalPro = users.filter(u => u.subscriptionPlan === 'pro').length;
  const totalBusiness = users.filter(u => u.subscriptionPlan === 'business').length;
  const activeSells = (totalPro * 29) + (totalBusiness * 79); // Mock monthly revenue
  const totalCreditsInCirculation = users.reduce((acc, u) => acc + u.credits, 0);

  const handleAdjustCredits = () => {
    if (!selectedUserUid) return;
    onAdjustCredits(selectedUserUid, Number(creditAdjustment));
    setAdjustSuccess(true);
    setTimeout(() => setAdjustSuccess(false), 2500);
  };

  const handleAdjustPlan = () => {
    if (!selectedUserUid) return;
    onAdjustPlan(selectedUserUid, planAdjustment);
    setAdjustSuccess(true);
    setTimeout(() => setAdjustSuccess(false), 2500);
  };

  const getSelectedUser = () => {
    return users.find(u => u.uid === selectedUserUid) || null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="bg-rose-100 dark:bg-rose-950/40 p-2.5 rounded-2xl text-rose-600 dark:text-rose-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
            {t.adminDashboard}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.systemStatus}
          </p>
        </div>
      </div>

      {/* Analytics KPI Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Enrolled</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{totalUsers}</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Pro Subscriptions</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{totalPro}</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">SaaS Monthly Revenue</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">${activeSells}/mo</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Credits Supply</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{totalCreditsInCirculation}</span>
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

      </div>

      {/* Grid: Adjustments & Users list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Users enrollment list */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-500" />
            {t.usersManagement}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">User Email</th>
                  <th className="px-4 py-3">Active Tier</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((item) => (
                  <tr 
                    key={item.uid} 
                    onClick={() => setSelectedUserUid(item.uid)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition ${selectedUserUid === item.uid ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {item.email} {item.role === 'admin' ? '(Admin)' : ''}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.subscriptionPlan === 'business' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                          : item.subscriptionPlan === 'pro'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.subscriptionPlan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{item.credits}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-600 hover:underline">Select</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Adjustments Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Coins className="w-4 h-4 text-indigo-500" />
            {t.creditsManagement}
          </h3>

          {selectedUserUid ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-xs text-slate-500">
                <span className="block font-bold">Modifying User:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{getSelectedUser()?.email}</span>
              </div>

              {/* Ajust credits */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Credits To Adjust (+ or -)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAdjustCredits}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl"
                  >
                    Adjust
                  </button>
                </div>
              </div>

              {/* Adjust subscription */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-400 block">Force Subscription Plan</label>
                <div className="flex gap-2">
                  <select
                    value={planAdjustment}
                    onChange={(e) => setPlanAdjustment(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="free">FREE</option>
                    <option value="pro">PRO</option>
                    <option value="business">BUSINESS</option>
                  </select>
                  <button
                    onClick={handleAdjustPlan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl"
                  >
                    Update Plan
                  </button>
                </div>
              </div>

              {adjustSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <Check className="w-4 h-4" />
                  <span>{t.creditsAdjustSuccess}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
              Select an enrolled user from the table to begin adjustments
            </div>
          )}
        </div>

      </div>

      {/* Support tickets list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Activity className="w-4 h-4 text-indigo-500" />
          {t.supportTickets}
        </h3>

        {supportTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  ticket.status === 'resolved' 
                    ? 'border-slate-100 dark:border-slate-850 opacity-60 bg-slate-50/50' 
                    : 'border-rose-100 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">From: {ticket.userEmail}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ticket.status === 'resolved' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 mb-1">{ticket.subject}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{ticket.message}</p>
                </div>

                {ticket.status === 'open' && (
                  <button
                    onClick={() => onResolveTicket(ticket.id)}
                    className="self-end flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.resolveTicket}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No support tickets active.</div>
        )}
      </div>

      {/* AI Log Entries */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Activity className="w-4 h-4 text-indigo-500" />
          {t.logsTitle}
        </h3>

        {systemLogs.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Engine Type</th>
                  <th className="px-4 py-2.5">Prompt Used</th>
                  <th className="px-4 py-2.5">Cost</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-bold text-indigo-600">{log.type.toUpperCase()}</td>
                    <td className="px-4 py-2.5 max-w-xs truncate">{log.prompt}</td>
                    <td className="px-4 py-2.5 font-semibold text-rose-500">-{log.creditsConsumed}</td>
                    <td className="px-4 py-2.5 text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No AI usage recorded yet in this session.</div>
        )}
      </div>

      {/* SparkMail Automated Outbound Emails */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Mail className="w-4 h-4 text-emerald-500" />
            Automated Welcome Emails Outbox (SparkMail Integration)
          </h3>
          <div className="flex items-center gap-3">
            {onSendTestEmail && (
              <button 
                onClick={handleOpenTestEmailModal}
                className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Send Test Email
              </button>
            )}
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              Active SDK: v2.4.1
            </span>
          </div>
        </div>

        {welcomeEmails.length > 0 ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Recipient</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {welcomeEmails.map((email: any) => (
                  <tr key={email.id || email.trackingId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-left">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{email.recipientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{email.recipientEmail}</div>
                    </td>
                    <td className="px-4 py-3 truncate max-w-xs text-left" title={email.subject}>
                      {email.subject}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                        email.status === 'sent' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}>
                        <span className="w-1 h-1 rounded-full bg-current"></span>
                        {email.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-left">
                      {new Date(email.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewingEmail(email)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Draft
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No automated welcome emails dispatched yet.</div>
        )}
      </div>

      {/* Email Preview Modal */}
      {viewingEmail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">
                  Outbound Transactional Email Preview
                </h4>
              </div>
              <button 
                onClick={() => setViewingEmail(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Delivery Metadata */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 text-xs space-y-1.5 text-left">
              <div>
                <span className="text-slate-400 inline-block w-20 font-medium">To:</span> 
                <span className="font-semibold text-slate-700 dark:text-slate-200">{viewingEmail.recipientName}</span> 
                <span className="text-slate-400 font-mono ml-1">(&lt;{viewingEmail.recipientEmail}&gt;)</span>
              </div>
              <div>
                <span className="text-slate-400 inline-block w-20 font-medium">Subject:</span> 
                <span className="font-semibold text-slate-800 dark:text-white">{viewingEmail.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 inline-block w-20 font-medium">Gateway:</span> 
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">{viewingEmail.provider}</span>
              </div>
              <div>
                <span className="text-slate-400 inline-block w-20 font-medium">Tracking ID:</span> 
                <span className="text-slate-500 font-mono text-[10px] select-all">{viewingEmail.trackingId}</span>
              </div>
              <div>
                <span className="text-slate-400 inline-block w-20 font-medium">Delivered At:</span> 
                <span className="text-slate-600 dark:text-slate-300 font-medium">{new Date(viewingEmail.sentAt).toLocaleString()}</span>
              </div>
            </div>

            {/* HTML Sandbox Area */}
            <div className="p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto flex-grow max-h-[45vh]">
              {viewingEmail.bodyHtml ? (
                <div 
                  className="bg-white rounded-2xl p-4 shadow-sm max-w-lg mx-auto overflow-hidden text-left"
                  dangerouslySetInnerHTML={{ __html: viewingEmail.bodyHtml }} 
                />
              ) : (
                <div className="text-center py-8 text-slate-400">Email content is plain text or empty.</div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/85 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Real-time Resend Sandbox-Aware Test Email Modal */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                <h4 className="font-display font-bold text-base text-slate-800 dark:text-white">
                  Send Outbound Test Email
                </h4>
              </div>
              <button 
                onClick={() => setShowTestEmailModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send a transactional welcome email with custom branding dynamically via your integrated Resend API gateway.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="e.g. abuadham261@gmail.com"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Sandbox Limitation Callout */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex gap-2.5 items-start">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block">⚠️ Resend Sandbox Account Restrictions</span>
                  <p className="leading-relaxed">
                    If your Resend.com account is currently in <strong>sandbox mode</strong> (unverified domain), Resend strictly blocks emails to arbitrary recipients.
                  </p>
                  <p className="font-medium text-slate-750 dark:text-slate-200">
                    To test successfully, you <strong>MUST</strong> input the exact owner email of your Resend account (e.g., <code className="bg-amber-100/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-amber-900 dark:text-amber-300 font-bold select-all">abuadham261@gmail.com</code>).
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              {testEmailResult && (
                <div className={`p-3 rounded-2xl border text-xs ${
                  (testEmailResult as any).sandboxLimited
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-400'
                    : testEmailResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400'
                }`}>
                  <span className="font-bold block mb-0.5">
                    {(testEmailResult as any).sandboxLimited 
                      ? "⚠️ Simulated Success (Resend Sandbox)" 
                      : testEmailResult.success 
                        ? "✓ Test Sent Successfully!" 
                        : "✗ Dispatch Failure"}
                  </span>
                  <p className="font-mono text-[10px] break-all max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {(testEmailResult as any).sandboxLimited 
                      ? ((testEmailResult as any).warning || "Resend sandbox limits restricted actual delivery, but the system simulated a successful dispatch.")
                      : (testEmailResult.error || "Email successfully passed to Resend webhook and queued.")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowTestEmailModal(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={testEmailLoading}
                onClick={handleTriggerSendTest}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {testEmailLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    Send Test
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
