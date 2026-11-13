import React from "react";
export function LoadingState({ children = "Loading..." }) {
  return (
    <p role="status" className="loading-note">
      {children}
    </p>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div role="alert" className="error-box">
      {message}
      {retry && (
        <>
          {" "}
          <button type="button" className="text-link" onClick={retry}>
            RETRY
          </button>
        </>
      )}
    </div>
  );
}
export function EmptyState({ children }) {
  return <p className="form-note">{children}</p>;
}
