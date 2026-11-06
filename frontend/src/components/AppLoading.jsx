import "./AppLoading.css";

function AppLoading({ message = "Loading..." }) {
  return (
    <main className="app-loading" role="status" aria-live="polite">
      <span className="app-loading__spinner" aria-hidden="true" />
      <p>{message}</p>
    </main>
  );
}

export default AppLoading;
