import { useContext } from "react";

import LoanContext from "./LoanContext";

export function useLoans() {
  const context = useContext(LoanContext);
  if (!context) throw new Error("useLoans must be used inside LoanProvider");
  return context;
}
