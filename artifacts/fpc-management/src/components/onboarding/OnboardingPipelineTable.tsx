import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { FpcApplication, FpcInvitation, RecordRow, State } from "@/lib/store";
import ApplicationReviewDrawer from "./ApplicationReviewDrawer";
import EmailPreviewModal from "./EmailPreviewModal";

interface OnboardingPipelineTableProps {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
  onOpenInviteModal: () => void;
}

export default function OnboardingPipelineTable({
  state,
  setState,
  setToast,
  onOpenInviteModal,
}: OnboardingPipelineTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedInvitation, setSelectedInvitation] = useState<FpcInvitation | null>(null);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  // Email preview modal state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [previewEmailData, setPreviewEmailData] = useState<{
    type: "invitation" | "approval" | "correction";
    recipientName: string;
    recipientEmail: string;
    companyName?: string;
    fpcId?: string;
    registrationUrl?: string;
    expiresAt?: string;
    remarks?: string;
  } | null>(null);

  const invitations = (state.records.fpcInvitations || []) as unknown as FpcInvitation[];
  const applications = (state.records.fpcApplications || []) as unknown as FpcApplication[];

  // Join invitation with application
  const rows = useMemo(() => {
    return invitations.map((inv) => {
      const app = applications.find((a) => a.invitationId === inv.id);
      return {
        invitation: inv,
        application: app || null,
      };
    });
  }, [invitations, applications]);

  // Filter & Search
  const filteredRows = useMemo(() => {
    return rows.filter(({ invitation, application }) => {
      const q = search.toLowerCase();
      const nameMatch = invitation.adminName.toLowerCase().includes(q);
      const emailMatch = invitation.adminEmail.toLowerCase().includes(q);
      const compMatch = (application?.companyName || "").toLowerCase().includes(q);
      const idMatch = invitation.id.toLowerCase().includes(q);

      if (q && !nameMatch && !emailMatch && !compMatch && !idMatch) {
        return false;
      }

      if (filterStatus === "ALL") return true;
      if (filterStatus === "ACTION_REQUIRED") {
        return invitation.status === "Submitted" || invitation.status === "Under Review";
      }
      if (filterStatus === "IN_PROGRESS") {
        return (
          invitation.status === "Invitation Sent" ||
          invitation.status === "Invitation Opened" ||
          invitation.status === "Draft"
        );
      }
      if (filterStatus === "CORRECTION") {
        return invitation.status === "Correction Required";
      }
      if (filterStatus === "APPROVED") {
        return invitation.status === "Approved";
      }
      return invitation.status === filterStatus;
    });
  }, [rows, search, filterStatus]);

  const handleResend = async (inv: FpcInvitation) => {
    try {
      const res = await fetch(`/api/onboarding/invitations/${encodeURIComponent(inv.id)}/resend`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setToast(data.error || "Failed to deliver email through mail provider.");
        return;
      }

      const updated = data.invitation;
      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcInvitations: (s.records.fpcInvitations || []).map((row) =>
            row.id === inv.id ? (updated as unknown as RecordRow) : row
          ),
        },
      }));

      setToast(`Invitation email successfully resent to ${inv.adminEmail}. Expiration extended by 7 days.`);
    } catch (err: any) {
      setToast(err.message || `Network error while resending invitation to ${inv.adminEmail}.`);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/onboard/register?token=${token}`;
    navigator.clipboard.writeText(url);
    setToast("Registration invitation link copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Submitted":
        return "bg-blue-100 text-blue-800 border-blue-300 font-bold";
      case "Under Review":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Correction Required":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Draft":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Invitation Opened":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Invitation Sent":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Admin Name, Email, or Company..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="ALL">All Pipelines ({rows.length})</option>
              <option value="ACTION_REQUIRED">Action Required (Submitted / Review)</option>
              <option value="IN_PROGRESS">In Progress (Sent / Draft)</option>
              <option value="CORRECTION">Correction Required</option>
              <option value="APPROVED">Approved &amp; Active</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenInviteModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Send size={14} /> Send Onboarding Invite
        </button>
      </div>

      {/* Pipeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invited FPC Admin</th>
                <th className="py-3 px-4">Proposed Company / Location</th>
                <th className="py-3 px-4 text-center">Pipeline Status</th>
                <th className="py-3 px-4">Timeline / Expiry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Clock size={28} className="mx-auto mb-2 opacity-40" />
                    No onboarding invitations found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ invitation, application }) => {
                  const registrationUrl = `${window.location.origin}/onboard/register?token=${invitation.token}`;

                  return (
                    <tr key={invitation.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Admin Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{invitation.adminName}</div>
                        <div className="text-[11px] text-slate-500">{invitation.adminEmail}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          +91 {invitation.adminMobile}
                        </div>
                      </td>

                      {/* Company Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {application?.companyName || (
                            <span className="text-slate-400 italic">Not entered yet</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-slate-400" />
                          {application?.state ? `${application.district || ""}, ${application.state}` : "Pending self-registration"}
                        </div>
                        {invitation.fpcId && (
                          <div className="mt-1">
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {invitation.fpcId}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            invitation.status
                          )}`}
                        >
                          {invitation.status}
                        </span>
                        {invitation.resendCount > 0 && (
                          <div className="text-[9px] text-slate-400 mt-1">
                            Resent {invitation.resendCount}x
                          </div>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="text-[11px]">
                          Invited: <span className="font-medium">{invitation.invitedAt}</span>
                        </div>
                        <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                          Expires: {new Date(invitation.expiresAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* If Submitted or Under Review or Correction Required -> Review Drawer */}
                          {application && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvitation(invitation);
                                setReviewDrawerOpen(true);
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                invitation.status === "Submitted"
                                  ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {invitation.status === "Submitted" ? "Review & Approve" : "View Application"}
                            </button>
                          )}

                          {/* Quick Link Copy */}
                          <button
                            type="button"
                            title="Copy Onboarding Link"
                            onClick={() => handleCopyLink(invitation.token)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Resend Option */}
                          {invitation.status !== "Approved" && (
                            <button
                              type="button"
                              title="Resend Invitation Email"
                              onClick={() => handleResend(invitation)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <RefreshCw size={13} />
                            </button>
                          )}

                          {/* Preview Email */}
                          <button
                            type="button"
                            title="Preview Dispatched Email"
                            onClick={() => {
                              setPreviewEmailData({
                                type: invitation.status === "Approved" ? "approval" : "invitation",
                                recipientName: invitation.adminName,
                                recipientEmail: invitation.adminEmail,
                                companyName: application?.companyName,
                                fpcId: invitation.fpcId,
                                registrationUrl,
                                expiresAt: invitation.expiresAt,
                              });
                              setEmailPreviewOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <Mail size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Review Drawer */}
      {selectedInvitation && (
        <ApplicationReviewDrawer
          isOpen={reviewDrawerOpen}
          onClose={() => {
            setReviewDrawerOpen(false);
            setSelectedInvitation(null);
          }}
          invitation={selectedInvitation}
          application={applications.find((a) => a.invitationId === selectedInvitation.id) || null}
          state={state}
          setState={setState}
          setToast={setToast}
        />
      )}

      {/* Email Preview Modal */}
      {previewEmailData && (
        <EmailPreviewModal
          isOpen={emailPreviewOpen}
          onClose={() => setEmailPreviewOpen(false)}
          type={previewEmailData.type}
          recipientName={previewEmailData.recipientName}
          recipientEmail={previewEmailData.recipientEmail}
          companyName={previewEmailData.companyName}
          fpcId={previewEmailData.fpcId}
          registrationUrl={previewEmailData.registrationUrl}
          expiresAt={previewEmailData.expiresAt}
        />
      )}
    </div>
  );
}

