import { Wallet } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/60 border border-gray-100 p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Wallet size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">ארנק הקופונים</h1>
          <p className="text-sm text-gray-500 mb-8">נהל את הקופונים שלך בצורה חכמה</p>

          {/* Benefits */}
          <div className="space-y-2.5 mb-8 text-right">
            {[
              { icon: "💳", text: "שמור קופונים וכרטיסים נטענים" },
              { icon: "⚡", text: "עקוב אחרי יתרות ומימושים חלקיים" },
              { icon: "🔔", text: "קבל התראות לפני פקיעת תוקף" },
              { icon: "📊", text: "צפה בחיסכון המצטבר שלך" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Google sign-in */}
          <GoogleSignInButton />

          {/* Error message */}
          <ErrorMessage searchParams={searchParams} />

          <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
            בהתחברות אתה מסכים לתנאי השימוש.<br />הנתונים שלך מאובטחים ופרטיים.
          </p>
        </div>
      </div>
    </div>
  );
}

async function ErrorMessage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <p className="text-xs text-red-500 mt-3 break-all">
      שגיאה: {params.error}
    </p>
  );
}
