import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import LoanSelector from "./LoanSelector";

function AppLayout({ sidebarVariant = "user", title, subtitle, action, children, contentClassName = "" }) {
  return (
    <div className="app-shell">
      <Sidebar variant={sidebarVariant} />

      <main className="main-panel">
        <div className="page-wrapper">
          {title && <PageHeader title={title} subtitle={subtitle} action={action} />}
          {sidebarVariant === "user" && <LoanSelector />}
          <div className={contentClassName || "page-content"}>{children}</div>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
