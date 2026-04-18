export default function SkeletonLoader() {
  return (
    <div className="fade-in-up">
      {/* Rate cards skeleton */}
      <div className="rate-cards-grid">
        <div className="glass-card rate-card">
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div
            className="skeleton skeleton-text"
            style={{ width: "80%", marginBottom: 16 }}
          />
          <div className="skeleton skeleton-text-lg" />
          <div
            className="skeleton skeleton-text-sm"
            style={{ marginTop: 8 }}
          />
        </div>
        <div className="glass-card rate-card">
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div
            className="skeleton skeleton-text"
            style={{ width: "80%", marginBottom: 16 }}
          />
          <div className="skeleton skeleton-text-lg" />
          <div
            className="skeleton skeleton-text-sm"
            style={{ marginTop: 8 }}
          />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="glass-card chart-section" style={{ marginTop: 32 }}>
        <div
          className="skeleton skeleton-text"
          style={{ width: "40%", height: 20, marginBottom: 20 }}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: 60, height: 32, borderRadius: 9999 }}
            />
          ))}
        </div>
        <div className="skeleton skeleton-chart" />
      </div>
    </div>
  );
}
