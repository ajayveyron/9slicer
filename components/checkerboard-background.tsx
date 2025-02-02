export function CheckerboardBackground() {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #333 25%, transparent 25%),
          linear-gradient(-45deg, #333 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #333 75%),
          linear-gradient(-45deg, transparent 75%, #333 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        backgroundColor: "#222",
      }}
    />
  )
}

