import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (err: any) {
      console.error("Login error:", err);

      // Friendly messages instead of exposing Firebase error text
      switch (err?.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("The email or password is incorrect.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        case "auth/network-request-failed":
          setError("Unable to connect. Please check your internet connection.");
          break;

        default:
          setError("Login failed. Please check your credentials and try again.");
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen romantic-gradient px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">

        <h2 className="font-script text-3xl text-romantic-deep mb-2">
          Welcome Back
        </h2>

        {/* <p className="text-sm text-muted-foreground mb-6">
          Our little memories are waiting for you ♡
        </p> */}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-xl border border-romantic-rose/30 bg-romantic-pink/30 px-4 py-3 text-sm text-romantic-deep animate-reveal-up">
            {error}
          </div>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 px-4 py-2 rounded-xl border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-romantic-rose/40 transition"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        {/* Password */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-2 rounded-xl border border-border bg-background/60 pr-16 focus:outline-none focus:ring-2 focus:ring-romantic-rose/40 transition"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-romantic-rose transition-colors"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Login */}
        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-romantic-rose text-white py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          Login
        </button>

      </div>
    </div>
  );
}
