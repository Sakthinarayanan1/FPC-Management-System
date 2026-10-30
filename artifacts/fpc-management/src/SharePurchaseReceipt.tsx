import React from "react";
import { BadgeCheck, CheckCircle2, Clock, Download, FileText, Landmark, Printer, ShieldCheck, X } from "lucide-react";
import { money, officialCompanyRegistration, type SharePurchaseRecord } from "@/lib/store";

interface SharePurchaseReceiptProps {
  receipt: SharePurchaseRecord;
  onClose: () => void;
}

export default function SharePurchaseReceipt({ receipt, onClose }: SharePurchaseReceiptProps) {
  const comp = officialCompanyRegistration;

  return (
    <div className="em-modalback" onClick={onClose} style={{ zIndex: 90 }}>
      <div
        className="em-modal sh-receipt-modal"
        style={{ width: "min(760px, 98%)", padding: 0, overflow: "hidden", background: "#fffdfa" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "#1b3a24",
          color: "#ffffff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#a3c2a9" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>
              Share Purchase Receipt · {receipt.receiptNumber}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="em-btn primary"
              style={{ padding: "6px 12px", fontSize: 11, background: "#2e6a47", borderColor: "#3e825a" }}
              onClick={() => window.print()}
            >
              <Printer size={13} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: 0,
                borderRadius: 6,
                color: "#ffffff",
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                cursor: "pointer"
              }}
              aria-label="Close receipt"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="sh-receipt-paper" style={{ padding: "28px 32px", color: "#1f3327" }}>
          {/* Header Section */}
          <div style={{
            textAlign: "center",
            borderBottom: "2px solid #285434",
            paddingBottom: 16,
            marginBottom: 20
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#edf5ee",
              color: "#286442",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8
            }}>
              <BadgeCheck size={13} /> Registered Farmer Producer Company
            </div>
            <h2 style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#183f2a",
              margin: "4px 0 6px",
              letterSpacing: "-0.3px"
            }}>
              {comp.companyName}
            </h2>
            <div style={{ fontSize: 10.5, color: "#5a6e61", lineHeight: 1.5, maxWidth: 620, margin: "0 auto" }}>
              <span><b>CIN:</b> {comp.cin}</span> • <span><b>Registration No:</b> {comp.registrationNumber}</span> • <span><b>ROC:</b> {comp.rocName}</span>
              <div style={{ marginTop: 2 }}>{comp.registeredAddress}</div>
            </div>
          </div>

          {/* Receipt Title & Disclaimer Banner */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            background: "#f4f8f4",
            border: "1px solid #dce8dd",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20
          }}>
            <div>
              <span style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#286442",
                fontWeight: 800
              }}>
                OFFICIAL PAYMENT RECEIPT
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "2px 0 0", color: "#164428" }}>
                SHARE PURCHASE RECEIPT
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#687a6f" }}>Receipt Number</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#1b5e20" }}>
                {receipt.receiptNumber}
              </div>
            </div>
          </div>

          {/* Primary Transaction & Shareholder Information */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 20,
            marginBottom: 20,
            fontSize: 11
          }}>
            <div style={{ background: "#ffffff", border: "1px solid #e5ede5", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "#7a8a7f", marginBottom: 8 }}>
                Shareholder Particulars
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  <span style={{ color: "#68796e", width: 110, display: "inline-block" }}>Shareholder Name:</span>
                  <strong style={{ color: "#163d25", fontSize: 12 }}>{receipt.shareholderName}</strong>
                </div>
                <div>
                  <span style={{ color: "#68796e", width: 110, display: "inline-block" }}>Shareholder ID:</span>
                  <code style={{ fontFamily: "monospace", fontWeight: 700, color: "#286442" }}>{receipt.shareholderId}</code>
                  {receipt.farmerId && <span style={{ color: "#7a8a7f", marginLeft: 6 }}>({receipt.farmerId})</span>}
                </div>
                <div>
                  <span style={{ color: "#68796e", width: 110, display: "inline-block" }}>Folio Number:</span>
                  <code style={{ fontFamily: "monospace", fontWeight: 600 }}>{receipt.folio || receipt.folioNumber || "FL-001"}</code>
                </div>
                {receipt.address && (
                  <div>
                    <span style={{ color: "#68796e", width: 110, display: "inline-block" }}>Recorded Address:</span>
                    <span style={{ color: "#34493b" }}>{receipt.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e5ede5", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "#7a8a7f", marginBottom: 8 }}>
                Payment & Confirmation
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  <span style={{ color: "#68796e", width: 130, display: "inline-block" }}>Transaction Ref:</span>
                  <code style={{ fontFamily: "monospace", fontWeight: 600 }}>{receipt.id}</code>
                </div>
                <div>
                  <span style={{ color: "#68796e", width: 130, display: "inline-block" }}>Payment Confirmed:</span>
                  <span style={{ fontWeight: 600, color: "#1b4528" }}>{receipt.purchaseConfirmedAtFormatted}</span>
                </div>
                <div>
                  <span style={{ color: "#68796e", width: 130, display: "inline-block" }}>Payment Status:</span>
                  <span className="em-status" style={{ fontSize: 9.5, padding: "2px 8px" }}>
                    <CheckCircle2 size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                    {receipt.paymentStatus}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#68796e", width: 130, display: "inline-block" }}>Payment Mode:</span>
                  <span style={{ color: "#2c4235" }}>{receipt.paymentMode || "Bank transfer"}</span>
                </div>
                {receipt.paymentReference && (
                  <div>
                    <span style={{ color: "#68796e", width: 130, display: "inline-block" }}>UTR / Reference:</span>
                    <code style={{ fontFamily: "monospace", fontSize: 10 }}>{receipt.paymentReference}</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Share Purchase Particulars Table */}
          <div style={{ border: "1px solid #dbe6dc", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f2f7f2", borderBottom: "1px solid #dbe6dc" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, color: "#4f6957", textTransform: "uppercase" }}>
                    Description & Security Class
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 9, color: "#4f6957", textTransform: "uppercase" }}>
                    Distinctive Numbers
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 9, color: "#4f6957", textTransform: "uppercase" }}>
                    Shares
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 9, color: "#4f6957", textTransform: "uppercase" }}>
                    Nominal Value
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 9, color: "#4f6957", textTransform: "uppercase" }}>
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eef3ee" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <strong style={{ color: "#1b4429", display: "block" }}>
                      {receipt.purchaseType === "Additional Shares" ? "Additional Equity Shares Subscription" : "Initial Equity Shares Allotment"}
                    </strong>
                    <small style={{ color: "#7a8c80" }}>Class of Security: Equity Shares · Fully Paid Up</small>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontFamily: "monospace", color: "#284432" }}>
                    {receipt.distinctiveFrom} – {receipt.distinctiveTo}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, fontSize: 12 }}>
                    {(receipt.sharesPurchased ?? receipt.shares ?? 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "monospace" }}>
                    {money(receipt.faceValue || 100)}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#166534", fontSize: 13 }}>
                    {money(receipt.totalAmount)}
                  </td>
                </tr>
                <tr style={{ background: "#fafdfa" }}>
                  <td colSpan={4} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#37503f" }}>
                    Total Amount Paid & Accounted:
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#166534", fontSize: 14 }}>
                    {money(receipt.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 48-Hour Certificate Notice Banner */}
          <div style={{
            background: "#fffaf0",
            border: "1px solid #f3e2bf",
            borderRadius: 8,
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }}>
            <Clock size={20} color="#b47818" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a580c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Shareholder Certificate Issuance Notice (48-Hour Workflow)
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6f5120", lineHeight: 1.5 }}>
                In accordance with the cooperative's statutory allotment procedures, the official <b>Shareholder Certificate</b> (Certificate No. <code>{receipt.certificateId || "SC-pending"}</code>) will become available for generation, preview, and download 48 hours after payment confirmation on:
              </p>
              <div style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#fdf1d6",
                padding: "4px 10px",
                borderRadius: 6,
                fontWeight: 700,
                color: "#7e4a05",
                fontSize: 11
              }}>
                <Clock size={12} /> Eligible at: {receipt.certificateEligibleAtFormatted}
              </div>
            </div>
          </div>

          {/* Signatory & Legal Footnote */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid #e1ebe2",
            fontSize: 10,
            color: "#6b7c70"
          }}>
            <div>
              <div>This is a computer-generated official payment receipt.</div>
              <div>Generated via FPC Management System · {comp.companyName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ borderBottom: "1px solid #285434", width: 160, marginBottom: 4 }} />
              <div style={{ fontWeight: 700, color: "#1f3a29" }}>Authorized Signatory</div>
              <div style={{ fontSize: 9 }}>For {comp.companyName}</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div style={{
          padding: "12px 20px",
          background: "#f7faf7",
          borderTop: "1px solid #e3ede3",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10
        }}>
          <button type="button" className="em-btn primary" onClick={() => window.print()}>
            <Printer size={14} /> Print Receipt
          </button>
          <button type="button" className="em-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
