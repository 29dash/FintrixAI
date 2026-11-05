import { useEffect, useState } from "react";

import ToastContext from "../state/ToastContext";

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message, type = "success") => setToast({ message, type });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div className={`app-toast app-toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"}><span>{toast.message}</span><button type="button" className="app-toast__close" aria-label="Close notification" onClick={() => setToast(null)}>×</button></div>}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
