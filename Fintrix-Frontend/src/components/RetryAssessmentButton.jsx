import { useState } from "react";

import { reassessLoan } from "../api";
import { useToast } from "../state/useToast";
import { useLoans } from "../state/useLoans";

function RetryAssessmentButton({ loan }) {
  const { refreshLoans, selectLoan } = useLoans();
  const { showToast } = useToast();
  const [retrying, setRetrying] = useState(false);

  if (!loan || !["failed", "pending"].includes(loan.riskAssessmentStatus)) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const data = await reassessLoan(loan._id);
      await refreshLoans();
      selectLoan(data.loan?._id || loan._id);
      showToast("Risk assessment completed.", "success");
    } catch (error) {
      showToast(error.message || "Risk assessment failed.", "error");
    } finally {
      setRetrying(false);
    }
  };

  return <button type="button" className="button button--secondary" onClick={handleRetry} disabled={retrying}>{retrying ? "Retrying..." : "Retry assessment"}</button>;
}

export default RetryAssessmentButton;
