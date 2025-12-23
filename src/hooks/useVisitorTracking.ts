import { useEffect } from "react";

export function useVisitorTracking(path: string) {
    useEffect(() => {
        console.log(`[VisitorTracking] Visited: ${path}`);
        // No-op for demo
    }, [path]);
}
