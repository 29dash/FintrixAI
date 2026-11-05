import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiInfo, FiLoader } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import { apiRequest } from "../api";
import { useLoans } from "../state/useLoans";

const purposes = ["car", "credit_card", "debt_consolidation", "educational", "home_improvement", "house", "major_purchase", "medical", "moving", "other", "renewable_energy", "small_business", "vacation", "wedding"];
const employmentLengths = ["< 1 year", "1 year", "2 years", "3 years", "4 years", "5 years", "6 years", "7 years", "8 years", "9 years", "10+ years", "Unknown"];

function LoanApplication() {
  const navigate = useNavigate();
  const { refreshLoans, selectLoan } = useLoans();
  // The risk model is trained on a US LendingClub-style dataset; CIBIL is normalized to its FICO-compatible input.
  const [form, setForm] = useState({ amount: "", purpose: "", duration: "", interestRate: "", grade: "", annualIncome: "", employmentLength: "", homeOwnership: "", verificationStatus: "", dti: "", cibilScore: "", openAccounts: "", revolvingBalance: "", revolvingUtilization: "", totalAccounts: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (values = form) => {
    const nextErrors = {};
    const required = ["amount", "purpose", "duration", "interestRate", "grade", "employmentLength", "homeOwnership", "annualIncome", "verificationStatus", "dti", "cibilScore", "openAccounts", "revolvingBalance", "revolvingUtilization", "totalAccounts"];
    required.forEach((field) => { if (values[field] === "") nextErrors[field] = "Required"; });
    if (values.amount !== "" && Number(values.amount) <= 0) nextErrors.amount = "Enter a positive loan amount.";
    if (values.annualIncome !== "" && Number(values.annualIncome) <= 0) nextErrors.annualIncome = "Enter a positive annual income.";
    if (values.interestRate !== "" && (Number(values.interestRate) <= 0 || Number(values.interestRate) > 100)) nextErrors.interestRate = "Enter a rate between 0 and 100%.";
    if (values.cibilScore !== "" && (Number(values.cibilScore) < 300 || Number(values.cibilScore) > 900)) nextErrors.cibilScore = "CIBIL score must be between 300 and 900.";
    if (values.dti !== "" && (Number(values.dti) < 0 || Number(values.dti) > 100)) nextErrors.dti = "DTI must be between 0 and 100%.";
    if (values.revolvingUtilization !== "" && (Number(values.revolvingUtilization) < 0 || Number(values.revolvingUtilization) > 100)) nextErrors.revolvingUtilization = "Utilization must be between 0 and 100%.";
    ["openAccounts", "revolvingBalance", "totalAccounts"].forEach((field) => { if (values[field] !== "" && Number(values[field]) < 0) nextErrors[field] = "Cannot be negative."; });
    return nextErrors;
  };

  const updateField = (field, value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setErrors(validate(nextForm));
    setError("");
  };

  const isValid = Object.keys(validate()).length === 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setError("");
    try {
      const data = await apiRequest("/loan/apply", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.amount), purpose: form.purpose, duration: Number(form.duration), interestRate: Number(form.interestRate), grade: form.grade,
          annualIncome: Number(form.annualIncome), employmentLength: form.employmentLength, homeOwnership: form.homeOwnership, verificationStatus: form.verificationStatus,
          dti: Number(form.dti), cibilScore: Number(form.cibilScore), openAccounts: Number(form.openAccounts), revolvingBalance: Number(form.revolvingBalance), revolvingUtilization: Number(form.revolvingUtilization), totalAccounts: Number(form.totalAccounts),
        }),
      });
      await refreshLoans();
      if (data.loan?._id) selectLoan(data.loan._id);
      navigate("/risk");
    } catch (requestError) {
      setError(requestError.message || "Application failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, input) => <label className={`field ${errors[name] ? "field--invalid" : ""}`}>
    <span className="field__label">{label} <span className="required-mark" aria-hidden="true">*</span></span>
    {input}
    {errors[name] && <span className="field__error" role="alert">{errors[name]}</span>}
  </label>;

  return (
    <AppLayout sidebarVariant="user" title="Loan Application" subtitle="Enter your financial information to assess your loan eligibility.">
      <div className="page-form-shell">
        <form className="application-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section"><div className="form-section__header"><h3>1. Loan Details</h3></div><div className="form-grid form-grid--two">
            {field("amount", "Loan Amount (INR)", <><input type="number" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} placeholder="250000" min="1" /><span className="field__hint">Enter the requested amount in rupees.</span></>)}
            {field("purpose", "Loan Purpose", <select value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)}><option value="">Select purpose</option>{purposes.map((value) => <option key={value} value={value}>{value}</option>)}</select>)}
            {field("duration", "Loan Term", <select value={form.duration} onChange={(e) => updateField("duration", e.target.value)}><option value="">Select term</option><option value="36">36 months</option><option value="60">60 months</option></select>)}
            {field("interestRate", "Interest Rate (%)", <input type="number" value={form.interestRate} onChange={(e) => updateField("interestRate", e.target.value)} placeholder="9.5" min="0.01" step="0.01" />)}
          </div></div>

          <div className="form-section"><div className="form-section__header"><h3>2. Employment &amp; Financial Information</h3></div><div className="form-grid form-grid--two">
            {field("grade", "Loan Grade", <select value={form.grade} onChange={(e) => updateField("grade", e.target.value)}><option value="">Select grade</option>{["A", "B", "C", "D", "E", "F", "G"].map((value) => <option key={value} value={value}>{value}</option>)}</select>)}
            {field("employmentLength", "Employment Length", <select value={form.employmentLength} onChange={(e) => updateField("employmentLength", e.target.value)}><option value="">Select length</option>{employmentLengths.map((value) => <option key={value} value={value}>{value}</option>)}</select>)}
            {field("homeOwnership", "Home Ownership", <select value={form.homeOwnership} onChange={(e) => updateField("homeOwnership", e.target.value)}><option value="">Select status</option>{["ANY", "MORTGAGE", "OWN", "RENT"].map((value) => <option key={value} value={value}>{value}</option>)}</select>)}
            {field("annualIncome", "Annual Income (INR)", <input type="number" value={form.annualIncome} onChange={(e) => updateField("annualIncome", e.target.value)} placeholder="1200000" min="1" />)}
            {field("verificationStatus", "Income Verification", <select value={form.verificationStatus} onChange={(e) => updateField("verificationStatus", e.target.value)}><option value="">Select verification</option>{["Not Verified", "Source Verified", "Verified"].map((value) => <option key={value} value={value}>{value}</option>)}</select>)}
          </div></div>

          <div className="form-section"><div className="form-section__header"><h3>3. Credit Profile</h3><p className="form-section__note">The model was trained on a US LendingClub-style dataset. CIBIL is normalized to the model's FICO-compatible range as a capstone proxy.</p></div><div className="form-grid form-grid--two">
            {field("dti", "Debt-to-Income Ratio (%)", <input type="number" value={form.dti} onChange={(e) => updateField("dti", e.target.value)} placeholder="18" min="0" max="100" step="0.1" />)}
            {field("cibilScore", "CIBIL Score (proxy)", <><input type="number" value={form.cibilScore} onChange={(e) => updateField("cibilScore", e.target.value)} placeholder="720" min="300" max="900" /><span className="field__hint">Accepted range: 300-900.</span></>)}
            {field("openAccounts", "Open Accounts", <input type="number" value={form.openAccounts} onChange={(e) => updateField("openAccounts", e.target.value)} placeholder="8" min="0" />)}
            {field("revolvingBalance", "Revolving Balance (INR)", <input type="number" value={form.revolvingBalance} onChange={(e) => updateField("revolvingBalance", e.target.value)} placeholder="35000" min="0" />)}
            {field("revolvingUtilization", "Revolving Utilization (%)", <input type="number" value={form.revolvingUtilization} onChange={(e) => updateField("revolvingUtilization", e.target.value)} placeholder="35" min="0" max="100" step="0.1" />)}
            {field("totalAccounts", "Total Accounts", <input type="number" value={form.totalAccounts} onChange={(e) => updateField("totalAccounts", e.target.value)} placeholder="12" min="0" />)}
          </div></div>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-note"><FiInfo /><span>This information is used for AI-based risk analysis and loan eligibility assessment.</span></div>
          <button type="submit" className="button button--primary button--wide" disabled={!isValid || submitting}>{submitting ? <><FiLoader className="spin" /> Analyzing...</> : "Analyze Risk"}</button>
        </form>
      </div>
    </AppLayout>
  );
}

export default LoanApplication;
