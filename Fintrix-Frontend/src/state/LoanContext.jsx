import { useEffect, useState } from "react";

import { getLoans, getProfile } from "../api";
import LoanContext from "./LoanContext";

const SELECTED_LOAN_KEY = "selectedLoanId";

export function LoanProvider({ children }) {
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(() => localStorage.getItem(SELECTED_LOAN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  const [error, setError] = useState("");

  const refreshLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLoans();
      setLoans(Array.isArray(data) ? data : []);
      setSelectedLoanId((currentId) => {
        const selectedExists = data.some((loan) => loan._id === currentId);
        const nextId = selectedExists ? currentId : data[0]?._id || null;
        if (nextId) localStorage.setItem(SELECTED_LOAN_KEY, nextId);
        else localStorage.removeItem(SELECTED_LOAN_KEY);
        return nextId;
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return undefined;
    }

    let cancelled = false;

    Promise.all([
      getLoans(),
      getProfile().catch(() => null),
    ]).then(([data, profile]) => {
      if (cancelled) return;

      const nextLoans = Array.isArray(data) ? data : [];
      setLoans(nextLoans);
      setUser(profile);
      setSelectedLoanId((currentId) => {
        const selectedExists = nextLoans.some((loan) => loan._id === currentId);
        const nextId = selectedExists ? currentId : nextLoans[0]?._id || null;
        if (nextId) localStorage.setItem(SELECTED_LOAN_KEY, nextId);
        else localStorage.removeItem(SELECTED_LOAN_KEY);
        return nextId;
      });
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      if (localStorage.getItem("token")) refreshLoans();
      else {
        setLoans([]);
        setUser(null);
        setSelectedLoanId(null);
      }
    };

    window.addEventListener("fintrix-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("fintrix-auth-changed", handleAuthChanged);
  }, []);

  const selectLoan = (loanId) => {
    setSelectedLoanId(loanId);
    if (loanId) localStorage.setItem(SELECTED_LOAN_KEY, loanId);
  };

  const selectedLoan = loans.find((loan) => loan._id === selectedLoanId) || loans[0] || null;

  return (
    <LoanContext.Provider value={{
      loans,
      selectedLoan,
      selectedLoanId: selectedLoan?._id || null,
      selectLoan,
      refreshLoans,
      user,
      loading,
      error,
    }}>
      {children}
    </LoanContext.Provider>
  );
}
