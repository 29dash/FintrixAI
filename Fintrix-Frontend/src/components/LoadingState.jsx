function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state__spinner" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingState;
