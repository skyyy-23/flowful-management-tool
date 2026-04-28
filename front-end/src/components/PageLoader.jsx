export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="page-loader">
      <div className="page-loader__pulse" />
      <p>{message}</p>
    </div>
  );
}
