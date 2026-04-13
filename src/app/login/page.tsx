import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <body
      className="min-h-screen flex flex-col items-center justify-center p-6 text-on-surface overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #ecfdf5 100%)" }}
    >
      {/* Background Decoration (Glassmorphism blobs) */}
      <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

      <main className="w-full max-w-md flex flex-col items-center text-center">
        {/* App Identity Section */}
        <div className="mb-12 flex flex-col items-center">
          {/* Icon Badge */}
          <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center shadow-[0_12px_32px_rgba(53,37,205,0.2)] mb-8 transform rotate-3">
            <span
              className="material-symbols-outlined text-white text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
          </div>
          {/* Product Name */}
          <h1 className="headline-font text-5xl font-extrabold tracking-tight text-primary mb-3">
            ארנק הקופונים
          </h1>
          <p className="text-on-surface-variant text-lg font-medium headline-font">
            נהל את הקופונים שלך בצורה חכמה
          </p>
        </div>

        {/* Benefits Section */}
        <div className="w-full grid grid-cols-1 gap-4 mb-10">
          {[
            { emoji: "💰", bg: "bg-secondary-fixed", text: "חסוך כסף" },
            { emoji: "⏰", bg: "bg-tertiary-fixed", text: "אל תפספס תוקף" },
            { emoji: "📊", bg: "bg-primary-fixed", text: "עקוב אחרי החיסכון" },
          ].map(({ emoji, bg, text }) => (
            <div
              key={text}
              className="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4 transition-all hover:bg-white/80"
            >
              <div className={`w-10 h-10 rounded-md ${bg} flex items-center justify-center text-xl shadow-sm`}>
                {emoji}
              </div>
              <span className="font-semibold text-on-surface text-right">{text}</span>
            </div>
          ))}
        </div>

        {/* Login Actions */}
        <div className="w-full space-y-4">
          <GoogleSignInButton />
          <ErrorMessage searchParams={searchParams} />
        </div>

        {/* Footer / Privacy */}
        <footer className="mt-16 w-full max-w-xs text-xs text-on-surface-variant leading-relaxed">
          <p>
            על ידי התחברות, אתה מסכים ל
            <a className="text-primary underline underline-offset-4 font-medium" href="#">תנאי השימוש</a>
            {" "}ול
            <a className="text-primary underline underline-offset-4 font-medium" href="#">מדיניות הפרטיות</a>
            {" "}שלנו.
          </p>
        </footer>
      </main>

      {/* Visual Anchor: Asymmetric Card Bleed */}
      <div className="absolute bottom-[-100px] right-[-100px] w-80 h-48 bg-white/40 backdrop-blur-xl rounded-xl -rotate-12 border border-white/50 -z-10 hidden md:block" />
      <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-indigo-100/30 backdrop-blur-lg rounded-full -z-10 hidden md:block" />
    </body>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <p className="text-xs text-error mt-3 break-all">
      שגיאה: {params.error}
    </p>
  );
}
