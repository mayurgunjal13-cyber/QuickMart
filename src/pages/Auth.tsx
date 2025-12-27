import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store } from "lucide-react";

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signIn, signUp, user, loading } = useAuth();
    const navigate = useNavigate();
    const hasNavigated = useRef(false);

    // Redirect to home when user is authenticated
    useEffect(() => {
        console.log('Auth.tsx useEffect - user:', user?.email, 'loading:', loading, 'hasNavigated:', hasNavigated.current);
        if (user && !loading && !hasNavigated.current) {
            console.log('Auth.tsx: User authenticated, navigating to home');
            hasNavigated.current = true;
            setIsSubmitting(false);
            navigate("/", { replace: true });
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        if (isSignUp && !name) {
            setError("Please enter your name");
            return;
        }

        setIsSubmitting(true);
        console.log('Auth.tsx: Starting', isSignUp ? 'signUp' : 'signIn');

        try {
            if (isSignUp) {
                await signUp(name, email, password);
            } else {
                await signIn(email, password);
            }
            console.log('Auth.tsx: Sign in/up completed successfully');
            // The signIn/signUp triggers onAuthStateChange which updates user state
            // The useEffect above will handle navigation when user state updates
            // Set a timeout to reset isSubmitting if navigation doesn't happen
            setTimeout(() => {
                if (!hasNavigated.current) {
                    console.log('Auth.tsx: Navigation timeout, checking user state');
                    setIsSubmitting(false);
                }
            }, 5000);
        } catch (err) {
            console.error('Auth.tsx: Sign in/up error:', err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while checking initial auth state
    if (loading && !isSubmitting) {
        return (
            <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-4 mx-auto animate-pulse">
                        <Store className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-4">
                        <Store className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="font-display font-bold text-2xl mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isSignUp ? "Sign up for QuickMart" : "Sign in to QuickMart"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        {isSignUp && (
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11"
                                required={isSignUp}
                                autoComplete="name"
                                disabled={isSubmitting}
                            />
                        )}
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11"
                            required
                            autoComplete="email"
                            disabled={isSubmitting}
                        />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11"
                            required
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            disabled={isSubmitting}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full gradient-primary shadow-glow h-11"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-primary hover:underline"
                            disabled={isSubmitting}
                        >
                            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;

