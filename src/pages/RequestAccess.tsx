import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RequestAccess = () => {
    const navigate = useNavigate();

    const handleRequest = () => {
        toast({
            title: "Request Sent",
            description: "An admin will review your request shortly.",
        });
        // In a real app this would call an API
        setTimeout(() => navigate("/"), 2000);
    };

    return (
        <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-soft text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-primary" />
                </div>

                <h1 className="font-display font-bold text-2xl mb-2">Access Required</h1>
                <p className="text-muted-foreground mb-8">
                    You need approval to access the store billing system.
                </p>

                <div className="space-y-4">
                    <Button
                        onClick={handleRequest}
                        className="w-full gradient-primary shadow-glow h-11"
                    >
                        Request Access
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/auth")}
                        className="w-full"
                    >
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RequestAccess;
