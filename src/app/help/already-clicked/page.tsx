"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  CreditCard,
  KeyRound,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

type ScenarioKey =
  | "openedSite"
  | "personalInfo"
  | "bankingInfo"
  | "cardDetails"
  | "otpEntered"
  | "paymentMade"
  | "installedApp"
  | "credentials"
  | "somethingElse";

interface GuidanceSection {
  immediateActions: string[];
  secondaryActions: string[];
  contactsToReach: { title: string; detail: string; action: string }[];
  warningNote: string;
}

export default function AlreadyClickedPage() {
  const { t } = useLanguage();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey | null>(null);

  const scenarioOptions: { key: ScenarioKey; label: string; icon: any; urgency: "high" | "critical" | "medium" }[] = [
    { key: "otpEntered", label: t("alreadyClicked.options.otpEntered"), icon: KeyRound, urgency: "critical" },
    { key: "cardDetails", label: t("alreadyClicked.options.cardDetails"), icon: CreditCard, urgency: "critical" },
    { key: "bankingInfo", label: t("alreadyClicked.options.bankingInfo"), icon: CreditCard, urgency: "critical" },
    { key: "paymentMade", label: t("alreadyClicked.options.paymentMade"), icon: ShieldAlert, urgency: "critical" },
    { key: "credentials", label: t("alreadyClicked.options.credentials"), icon: Lock, urgency: "high" },
    { key: "installedApp", label: t("alreadyClicked.options.installedApp"), icon: Download, urgency: "high" },
    { key: "personalInfo", label: t("alreadyClicked.options.personalInfo"), icon: AlertTriangle, urgency: "medium" },
    { key: "openedSite", label: t("alreadyClicked.options.openedSite"), icon: CheckCircle2, urgency: "medium" },
    { key: "somethingElse", label: t("alreadyClicked.options.somethingElse"), icon: HelpCircle, urgency: "medium" },
  ];

  const guidanceMap: Record<ScenarioKey, GuidanceSection> = {
    otpEntered: {
      immediateActions: [
        "Call your bank's 24/7 fraud hotline immediately and ask to temporarily freeze transactions on your accounts and cards.",
        "Inform the bank agent that a one-time authorization code was compromised.",
        "Change your internet banking login password and email account password from a clean, secure device.",
      ],
      secondaryActions: [
        "Review your transaction history immediately for unauthorized transfers.",
        "Enable multi-factor biometric authentication on your official banking app.",
        "Preserve SMS timestamps and screenshots as evidence.",
      ],
      contactsToReach: [
        { title: "Bank Card Hotline", detail: "Check the back of your physical card or official app", action: "Call Bank" },
        { title: "Police Cyber Crime Unit (LK)", detail: "Hotline 1938 for financial cyber fraud", action: "Call 1938" },
      ],
      warningNote: "Scammers use OTPs within seconds to authenticate unauthorized wire transfers. Acting within minutes is crucial.",
    },
    cardDetails: {
      immediateActions: [
        "Immediately block or freeze your credit/debit card using your official banking mobile app, or call the 24/7 card hotline on the back of your card.",
        "Request the bank to cancel the exposed card number and issue a replacement card with a new CVV.",
        "Check recent pending transactions and request chargeback on unauthorized debits.",
      ],
      secondaryActions: [
        "Monitor your account statement closely over the next 30 days.",
        "Never approve unknown 3D-Secure prompts on your phone.",
      ],
      contactsToReach: [
        { title: "Your Bank's 24/7 Emergency Card Center", detail: "Available on the back of your debit/credit card", action: "Call Bank" },
        { title: "Sri Lanka Police Cyber Crime", detail: "Hotline 1938", action: "Call 1938" },
      ],
      warningNote: "Freezing your card prevents fraudulent online card-not-present transactions.",
    },
    bankingInfo: {
      immediateActions: [
        "Contact your financial institution immediately through verified official numbers (do not use numbers provided in the suspicious message).",
        "Request immediate temporary suspension of internet and mobile banking access.",
        "Check account balance and request transaction hold if unauthorized debits are pending.",
      ],
      secondaryActions: [
        "Change your online banking password and security questions via the official website or branch.",
        "Submit a formal written dispute and keep the incident reference number.",
      ],
      contactsToReach: [
        { title: "Official Bank Customer Service", detail: "Check official passbook or bank website", action: "Contact Bank" },
        { title: "Financial Ombudsman Sri Lanka", detail: "www.financialombudsman.lk", action: "Learn More" },
      ],
      warningNote: "Only use independently verified official contact numbers for your bank.",
    },
    paymentMade: {
      immediateActions: [
        "Immediately notify your bank or remittance provider to attempt a payment recall or reversal on the outgoing transaction.",
        "Document the recipient account number, bank name, payment reference, and exact timestamp.",
        "File an immediate formal complaint with the nearest police station or Police Cyber Crime Division (Hotline 1938).",
      ],
      secondaryActions: [
        "Preserve full chat transcripts, transaction SMS slips, and deposit receipts.",
        "Do not pay any 'release fees' or 'tax clearance' requested by the fraudster to recover funds.",
      ],
      contactsToReach: [
        { title: "Sri Lanka Police Cyber Crime Division", detail: "Hotline: 1938 | cybercrime@police.lk", action: "Call 1938" },
        { title: "Sri Lanka CERT|CC", detail: "011 269 1692 / 101 | report@cert.gov.lk", action: "Contact CERT" },
      ],
      warningNote: "Legitimate recovery agencies will never ask you for an advance fee to recover scammed funds.",
    },
    credentials: {
      immediateActions: [
        "Change the compromised password immediately using the official service website or app.",
        "If you reused this password on email, banking, or social accounts, change those passwords immediately as well.",
        "Sign out of all active sessions across all devices in security settings.",
      ],
      secondaryActions: [
        "Enable Multi-Factor Authentication (MFA/2FA) using an authenticator app.",
        "Check registered recovery phone numbers and email addresses to ensure the scammer did not alter them.",
      ],
      contactsToReach: [
        { title: "Official Service Security Center", detail: "Access directly via browser URL bar", action: "Open Service" },
      ],
      warningNote: "Never share verification SMS codes or security prompts with anyone.",
    },
    installedApp: {
      immediateActions: [
        "Immediately disconnect your phone from Wi-Fi and mobile data (turn on Airplane Mode).",
        "Uninstall the suspicious application or APK from device settings > Apps.",
        "Revoke Accessibility and Device Administrator privileges if the app requested them.",
      ],
      secondaryActions: [
        "Scan your device with a trusted mobile security antivirus.",
        "Change sensitive passwords from a different, clean computer or phone.",
        "If unsure, perform a factory reset of the phone after backing up essential personal media.",
      ],
      contactsToReach: [
        { title: "Sri Lanka CERT|CC Assistance", detail: "011 269 1692 / report@cert.gov.lk", action: "Contact CERT" },
      ],
      warningNote: "Malicious APKs can secretly intercept SMS messages, read OTPs, and record banking keystrokes.",
    },
    personalInfo: {
      immediateActions: [
        "Be on high alert for follow-up calls or messages pretending to be your bank, police, or courier.",
        "Never share OTPs or passwords if someone calls referencing the personal details you entered.",
      ],
      secondaryActions: [
        "Monitor your credit report and bank statements for unauthorized inquiries.",
        "If National Identity Card (NIC) photos were uploaded, report identity theft to the Department of Registration of Persons or Police.",
      ],
      contactsToReach: [
        { title: "Sri Lanka Police 1938", detail: "Cyber Crime Division", action: "Call 1938" },
      ],
      warningNote: "Scammers often sell personal details to other syndicates for secondary targeted attacks.",
    },
    openedSite: {
      immediateActions: [
        "Close the browser tab and do not interact with any pop-ups.",
        "Clear your browser cache, history, and cookies for the last 24 hours.",
      ],
      secondaryActions: [
        "Check your browser downloads folder to ensure no automatic file or APK was downloaded.",
        "Keep your device operating system and browser updated to the latest security patch.",
      ],
      contactsToReach: [
        { title: "ScamCheck Safety Guide", detail: "Check any links here before opening", action: "Check Links" },
      ],
      warningNote: "Simply opening a site without downloading files or submitting forms rarely causes harm on modern updated browsers.",
    },
    somethingElse: {
      immediateActions: [
        "Stop all communication with the suspicious party immediately.",
        "Do not transfer any money, share verification codes, or provide remote screen access (AnyDesk, TeamViewer).",
        "Consult a trusted tech-savvy friend, your bank, or the official police hotline.",
      ],
      secondaryActions: [
        "Preserve chat transcripts and numbers as evidence.",
        "Submit a community report on ScamCheck to alert other citizens.",
      ],
      contactsToReach: [
        { title: "Police Cyber Crime Division", detail: "Hotline 1938 (Free & 24/7 in Sri Lanka)", action: "Call 1938" },
      ],
      warningNote: "When in doubt, always independently verify through established official channels.",
    },
  };

  const currentGuidance = selectedScenario ? guidanceMap[selectedScenario] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary p-2 rounded-xl bg-surface border border-surface-border transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-risk-high-bg text-risk-high text-xs font-bold border border-risk-high-border">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incident Response Guidance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          {t("alreadyClicked.title")}
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t("alreadyClicked.subtitle")}
        </p>
      </div>

      {!selectedScenario ? (
        /* Question: What happened? */
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text-primary">
              {t("alreadyClicked.question")}
            </h2>
            <p className="text-xs text-text-secondary">
              Select the situation that best matches what took place:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {scenarioOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedScenario(opt.key)}
                  className="w-full p-4 rounded-xl border border-surface-border hover:border-trust hover:bg-trust-subtle/20 transition-all text-left flex items-center justify-between group touch-target shadow-soft"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-muted group-hover:bg-trust group-hover:text-white transition-colors flex items-center justify-center shrink-0 text-text-secondary">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {opt.label}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-trust group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Defensive Guidance Result */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedScenario(null)}
            className="text-xs font-semibold text-trust hover:underline flex items-center gap-1"
          >
            ← Choose a different situation
          </button>

          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-6">
            <div className="p-4 rounded-2xl bg-risk-critical-bg border border-risk-critical-border flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-risk-critical shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-risk-critical">Urgent Advice</div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {currentGuidance?.warningNote}
                </p>
              </div>
            </div>

            {/* Immediate Steps */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                1. Take These Immediate Steps Right Now
              </h3>
              <div className="space-y-2.5">
                {currentGuidance?.immediateActions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface border border-surface-border flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-trust-subtle text-trust flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-relaxed">
                      {act}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Steps */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                2. Secondary Protective Measures
              </h3>
              <div className="space-y-2.5">
                {currentGuidance?.secondaryActions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-risk-low shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {act}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Incident Contacts */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Official Incident Reporting Numbers (Sri Lanka)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentGuidance?.contactsToReach.map((cnt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-muted border border-surface-border space-y-1"
                  >
                    <div className="font-bold text-xs text-text-primary">{cnt.title}</div>
                    <div className="text-xs text-text-secondary">{cnt.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit ScamCheck Report Action */}
            <div className="pt-2">
              <Link
                href="/reports/submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center gap-2 touch-target"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit a Community Report to Protect Others</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
