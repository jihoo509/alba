export const metadata = { title: "Alba Manager" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#111", color: "#fff", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
